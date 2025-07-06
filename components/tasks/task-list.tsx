'use client';

import { TaskStatus } from '@prisma/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// DND-Kit imports
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

// Our project's components and types
import { PaceIndicatorChart } from '@/components/shared/pace-indicator-chart';
import { TaskSelectionModal } from '@/components/timer/task-selection-modal'; // <-- IMPORT THE MODAL
import { calculatePaceData } from '@/lib/pace-helpers';
import { type GoalWithSessions, type TaskWithTime } from '@/lib/types';
import { CreateTaskForm } from './create-task-form';
import { TaskItem } from './task-item';
import { TaskListSkeleton } from './task-list-skeleton';
import { TaskStats } from './task-stats';

// --- Type Definition & API Functions ---
interface TaskListProps {
  goalId: string | null;
}

// A single, unified fetcher for all data related to the task list view.
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

// --- Main Component ---
export function TaskList({ goalId }: TaskListProps) {
  const queryClient = useQueryClient();
  const [orderedTasks, setOrderedTasks] = useState<TaskWithTime[]>([]);

  // --- NEW: State management for the session modal ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskForSession, setTaskForSession] = useState<TaskWithTime | null>(
    null
  );

  // A single useQuery hook to manage all data for this component.
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['taskListData', goalId],
    queryFn: () => fetchTaskListData(goalId!),
    enabled: !!goalId,
  });

  const goal = data?.goal;
  const fetchedTasks = data?.tasks;

  useEffect(() => {
    if (fetchedTasks) {
      setOrderedTasks(fetchedTasks);
    }
  }, [fetchedTasks]);

  // All useMemo hooks for calculations remain the same.
  const taskStats = useMemo(() => {
    if (!fetchedTasks)
      return { total: 0, completed: 0, inProgress: 0, pending: 0 };
    return {
      total: fetchedTasks.length,
      completed: fetchedTasks.filter((t) => t.status === TaskStatus.COMPLETED)
        .length,
      inProgress: fetchedTasks.filter(
        (t) => t.status === TaskStatus.IN_PROGRESS
      ).length,
      pending: fetchedTasks.filter((t) => t.status === TaskStatus.PENDING)
        .length,
    };
  }, [fetchedTasks]);

  const paceData = useMemo(() => {
    if (
      goal?.deadline &&
      goal.estimatedTimeSeconds &&
      goal.estimatedTimeSeconds > 0
    ) {
      return calculatePaceData(goal, goal.focusSessions);
    }
    return null;
  }, [goal]);

  // The mutation and drag-and-drop logic remain unchanged.
  const orderMutation = useMutation({
    mutationFn: updateTaskOrder,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['taskListData', goalId] }),
    onError: () => {
      setOrderedTasks(fetchedTasks || []);
      toast.error('Could not save new order.');
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // --- NEW: Handler to open the modal, passed to each TaskItem ---
  const handleStartSessionRequest = (task: TaskWithTime) => {
    setTaskForSession(task);
    setIsModalOpen(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = orderedTasks.findIndex((t) => t.id === active.id);
      const newIndex = orderedTasks.findIndex((t) => t.id === over.id);
      const reorderedTasks = arrayMove(orderedTasks, oldIndex, newIndex);
      setOrderedTasks(reorderedTasks);
      const tasksToUpdate = reorderedTasks.map((task, index) => ({
        id: task.id,
        sortOrder: index,
      }));
      orderMutation.mutate(tasksToUpdate);
    }
  };

  // --- Render Logic ---

  if (!goalId) {
    return (
      <div className='flex h-full flex-col items-center justify-center bg-secondary/20 text-center rounded-lg p-8'>
        <h2 className='text-xl font-semibold text-foreground'>Select a goal</h2>
        <p className='mt-2 text-muted-foreground'>
          Choose a goal from the list to see its tasks and progress.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <TaskListSkeleton />;
  }

  if (isError) {
    return (
      <div className='text-destructive p-4 text-center'>
        Error: {error.message}
      </div>
    );
  }

  if (!goal) {
    return <div>Goal not found.</div>;
  }

  return (
    // We use a React Fragment to render the list and the modal as siblings.
    <>
      <div className='flex h-full flex-col bg-card rounded-lg border'>
        {/* Header Section */}
        <div className='p-4 border-b'>
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
              <PaceIndicatorChart data={paceData} />
            </div>
          )}
          <div className='mt-4'>
            <TaskStats {...taskStats} />
          </div>
        </div>

        {/* Task List Section */}
        <div className='flex-1 overflow-y-auto p-2'>
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
                    // Pass the handler down to each item
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

        {/* Footer Section */}
        <div className='p-4 border-t bg-background/50 sticky bottom-0'>
          <CreateTaskForm goalId={goal.id} />
        </div>
      </div>

      {/* The Modal is rendered here, controlled by this component's state */}
      <TaskSelectionModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        preselectedTask={taskForSession || undefined}
      />
    </>
  );
}
