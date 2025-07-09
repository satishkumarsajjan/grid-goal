// components/goal/task-list.tsx
'use client';

import { TaskStatus } from '@prisma/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { type DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

import { TaskSelectionModal } from '@/components/timer/task-selection-modal';
import { AriaLiveRegion } from '@/components/ui/AriaLiveRegion';
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
  const [orderedTasks, setOrderedTasks] = useState<TaskWithTime[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskForSession, setTaskForSession] = useState<TaskWithTime | null>(
    null
  );
  const [announcement, setAnnouncement] = useState('');

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

  const { completedTaskCount, inProgressTaskCount } = useMemo(() => {
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

  const orderMutation = useMutation({
    mutationFn: updateTaskOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskListData', goalId] });
    },
    onError: () => {
      setOrderedTasks(fetchedTasks || []);
      toast.error('Could not save new order. Reverting changes.');
      setAnnouncement('Task order could not be saved and has been reverted.');
    },
  });

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

      const taskTitle = reorderedTasks[newIndex].title;
      setAnnouncement(
        `Task "${taskTitle}" moved from position ${oldIndex + 1} to ${
          newIndex + 1
        }.`
      );
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
      <AriaLiveRegion message={announcement} />

      <div className='flex h-full flex-col rounded-lg'>
        <TaskListHeader
          goal={goal}
          taskCount={orderedTasks.length}
          completedTaskCount={completedTaskCount}
          inProgressTaskCount={inProgressTaskCount}
          isSavingOrder={orderMutation.isPending}
        />
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
