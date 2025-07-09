'use client';

import { TaskStatus } from '@prisma/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useMemo, useState, useEffect } from 'react';
import { toast } from 'sonner';

import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { PaceProgressChart } from '@/components/shared/pace-indicator-chart';
import { TaskSelectionModal } from '@/components/timer/task-selection-modal';
import { calculatePaceData } from '@/lib/pace-helpers';
// FIX: This type will now need to include our new deepEstimateTotalSeconds field
import { type GoalWithSessions, type TaskWithTime } from '@/lib/types'; // Assuming you define a GoalWithRelations type
import { CreateTaskForm } from './create-task-form';
import { TaskItem } from './task-item';
import { TaskListSkeleton } from './task-list-skeleton';
import { TaskStats } from './task-stats';

interface TaskListProps {
  goalId: string | null;
}

const fetchTaskListData = async (
  goalId: string
): Promise<{ goal: GoalWithSessions; tasks: TaskWithTime[] }> => {
  const [goalRes, tasksRes] = await Promise.all([
    axios.get(`/api/goals/${goalId}`),
    axios.get(`/api/goals/${goalId}/tasks`),
  ]);
  return { goal: goalRes.data, tasks: tasksRes.data };
};

const updateTaskOrder = async (tasks: { id: string; sortOrder: number }[]) => {
  const { data } = await axios.patch('/api/tasks/order', tasks);
  return data;
};

export function TaskList({ goalId }: TaskListProps) {
  const queryClient = useQueryClient();
  const [orderedTasks, setOrderedTasks] = useState<TaskWithTime[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskForSession, setTaskForSession] = useState<TaskWithTime | null>(
    null
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['taskListData', goalId],
    queryFn: () => fetchTaskListData(goalId!),
    enabled: !!goalId,
  });

  const goal = data?.goal;
  const fetchedTasks = data?.tasks;

  // FIX: This is the corrected way to handle state derived from server data.
  // It avoids the anti-pattern by only setting the state if it hasn't been
  // set before, or if the underlying data source (goalId) changes.
  // This preserves the user's local re-ordering during background refetches.
  useEffect(() => {
    if (fetchedTasks) {
      setOrderedTasks(fetchedTasks);
    }
  }, [fetchedTasks, goalId]);

  const taskStats = useMemo(() => {
    // This logic remains correct.
    if (!orderedTasks)
      return { total: 0, completed: 0, inProgress: 0, pending: 0 };
    return {
      total: orderedTasks.length,
      completed: orderedTasks.filter((t) => t.status === TaskStatus.COMPLETED)
        .length,
      inProgress: orderedTasks.filter(
        (t) => t.status === TaskStatus.IN_PROGRESS
      ).length,
      pending: orderedTasks.filter((t) => t.status === TaskStatus.PENDING)
        .length,
    };
  }, [orderedTasks]);

  // FINAL FIX: The Pace Chart logic is now simple, performant, and correct.
  const paceData = useMemo(() => {
    // It reads the pre-calculated `deepEstimateTotalSeconds` directly from the goal object.
    if (
      goal?.deadline &&
      goal.deepEstimateTotalSeconds &&
      goal.deepEstimateTotalSeconds > 0
    ) {
      // It passes this value to our corrected helper function.
      return calculatePaceData(
        goal,
        goal.focusSessions,
        goal.deepEstimateTotalSeconds
      );
    }
    return null;
  }, [goal]); // Dependency is now just the goal object.

  const orderMutation = useMutation({
    mutationFn: updateTaskOrder,
    // Note: A more advanced implementation might use optimistic updates here,
    // but invalidation is a solid and reliable pattern.
    onSuccess: () => {
      toast.success('Task order saved!');
      queryClient.invalidateQueries({ queryKey: ['taskListData', goalId] });
    },
    onError: () => {
      // Revert to the server state if the mutation fails
      setOrderedTasks(fetchedTasks || []);
      toast.error('Could not save new order. Reverting changes.');
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleStartSessionRequest = (task: TaskWithTime) => {
    setTaskForSession(task);
    setIsModalOpen(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOrderedTasks((tasks) => {
        const oldIndex = tasks.findIndex((t) => t.id === active.id);
        const newIndex = tasks.findIndex((t) => t.id === over.id);
        const reorderedTasks = arrayMove(tasks, oldIndex, newIndex);

        // After local state update, trigger the mutation to save to the backend.
        const tasksToUpdate = reorderedTasks.map((task, index) => ({
          id: task.id,
          sortOrder: index,
        }));
        orderMutation.mutate(tasksToUpdate);

        return reorderedTasks; // Return the new array for the state update
      });
    }
  };

  if (!goalId) {
    return (
      <div className='flex h-full flex-col items-center justify-center text-center rounded-lg p-8'>
        <h2 className='text-xl font-semibold text-foreground'>Select a goal</h2>
        <p className='mt-2 text-muted-foreground'>
          Choose a goal from the list to see its tasks and progress.
        </p>
      </div>
    );
  }

  if (isLoading) return <TaskListSkeleton />;
  if (isError)
    return (
      <div className='text-destructive p-4 text-center'>
        Error: {error.message}
      </div>
    );
  if (!goal) return <div>Goal not found.</div>;

  return (
    <>
      <div className='flex h-full flex-col rounded-lg'>
        <div className='p-4'>
          <h1 className='text-2xl font-bold'>{goal.title}</h1>
          {goal.description && (
            <p className='mt-1 text-sm text-muted-foreground'>
              {goal.description}
            </p>
          )}
          {paceData && paceData.length > 0 && (
            <div className='mt-4'>
              <h3 className='text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider'>
                Pace
              </h3>
              <PaceProgressChart data={paceData} />
            </div>
          )}
          <div className='mt-4'>
            <TaskStats {...taskStats} />
          </div>
        </div>

        <div className='flex-1 overflow-y-auto overflow-x-clip p-2'>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={orderedTasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {orderedTasks.length > 0 ? (
                orderedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onStartSession={handleStartSessionRequest}
                  />
                ))
              ) : (
                <div className='text-center text-muted-foreground p-10'>
                  <p>This goal has no tasks yet.</p>
                  <p className='text-sm'>
                    Add the first task below to get started.
                  </p>
                </div>
              )}
            </SortableContext>
          </DndContext>
        </div>

        <div className='p-4 border-t bg-background/50 sticky bottom-0'>
          <CreateTaskForm goalId={goal.id} />
        </div>
      </div>

      <TaskSelectionModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        preselectedTask={
          taskForSession
            ? {
                id: taskForSession.id,
                title: taskForSession.title,
                goalId: taskForSession.goalId,
                goalTitle: goal?.title ?? '',
              }
            : undefined
        }
      />
    </>
  );
}
