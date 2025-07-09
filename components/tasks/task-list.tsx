'use client';

import { TaskStatus } from '@prisma/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { type DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

import { TaskSelectionModal } from '@/components/timer/task-selection-modal';
import { calculatePaceData } from '@/lib/pace-helpers';
import { type GoalWithSessions, type TaskWithTime } from '@/lib/types';
import { CreateTaskForm } from './create-task-form';
import { SortableTasks } from './SortableTasks';
import { TaskListSkeleton } from './task-list-skeleton';
import { TaskListHeader } from './TaskListHeader';

interface TaskListProps {
  goalId: string | null;
}

const fetchTaskListData = async (
  goalId: string
): Promise<{ goal: GoalWithSessions; tasks: TaskWithTime[] }> => {
  const { data } = await axios.get(`/api/task-list-data?goalId=${goalId}`);
  return data;
};

const updateTaskOrder = async (tasks: { id: string; sortOrder: number }[]) => {
  const { data } = await axios.patch('/api/tasks/order', tasks);
  return data;
};

export function TaskList({ goalId }: TaskListProps) {
  const queryClient = useQueryClient();

  // FIX #1: Local state is the primary driver for the rendered list.
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

  // FIX #2: This useEffect is now the *only* thing that updates our local state
  // from the server. It runs when the component loads and after a successful refetch.
  useEffect(() => {
    if (fetchedTasks) {
      setOrderedTasks(fetchedTasks);
    }
  }, [fetchedTasks]);

  const { completedTaskCount, inProgressTaskCount } = useMemo(() => {
    // It works on the local `orderedTasks` state.
    if (!orderedTasks) return { completedTaskCount: 0, inProgressTaskCount: 0 };
    return {
      completedTaskCount: orderedTasks.filter(
        (t) => t.status === TaskStatus.COMPLETED
      ).length,
      inProgressTaskCount: orderedTasks.filter(
        (t) => t.status === TaskStatus.IN_PROGRESS
      ).length,
    };
  }, [orderedTasks]);

  const paceData = useMemo(() => {
    if (goal?.deadline && goal.deepEstimateTotalSeconds > 0) {
      return calculatePaceData(
        goal,
        goal.focusSessions,
        goal.deepEstimateTotalSeconds
      );
    }
    return null;
  }, [goal]);

  // FIX #3: The mutation is now simpler. It no longer needs onMutate for this.
  // Its only job is to save the data and then trigger a refetch on success.
  const orderMutation = useMutation({
    mutationFn: updateTaskOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskListData', goalId] });
    },
    onError: () => {
      // If the save fails, we revert the UI to the last known good state from the server.
      setOrderedTasks(fetchedTasks || []);
      toast.error('Could not save new order. Reverting changes.');
    },
  });

  const handleStartSessionRequest = (task: TaskWithTime) => {
    setTaskForSession(task);
    setIsModalOpen(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      // FIX #4: This is the new, robust flow.

      // 1. Get the current order from our local state.
      const oldIndex = orderedTasks.findIndex((t) => t.id === active.id);
      const newIndex = orderedTasks.findIndex((t) => t.id === over.id);

      // 2. Create the new, optimistically sorted array.
      const reorderedTasks = arrayMove(orderedTasks, oldIndex, newIndex);

      // 3. IMMEDIATELY update the local state. This is the key to a smooth UI.
      // The user sees their change instantly.
      setOrderedTasks(reorderedTasks);

      // 4. Create the payload for the API.
      const tasksToUpdate = reorderedTasks.map((task, index) => ({
        id: task.id,
        sortOrder: index,
      }));

      // 5. Fire the mutation to save the changes in the background.
      orderMutation.mutate(tasksToUpdate);
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

  // We show a skeleton on initial load, but not during background refetches.
  if (isLoading && !data) return <TaskListSkeleton />;
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
        <TaskListHeader
          goal={goal}
          taskCount={orderedTasks.length}
          completedTaskCount={completedTaskCount}
          inProgressTaskCount={inProgressTaskCount}
          isSavingOrder={orderMutation.isPending}
        />

        {/* The list now renders from our reliable local state `orderedTasks` */}
        <SortableTasks
          tasks={orderedTasks}
          onDragEnd={handleDragEnd}
          onStartSession={handleStartSessionRequest}
          isDisabled={orderMutation.isPending}
        />

        <div className='p-4 border-t bg-background/50 sticky bottom-0'>
          <CreateTaskForm
            goalId={goal.id}
            isDisabled={orderMutation.isPending}
          />
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
                goalTitle: goal.title,
              }
            : undefined
        }
      />
    </>
  );
}
