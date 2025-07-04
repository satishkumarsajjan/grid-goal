'use client';

import { TaskStatus } from '@prisma/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
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
import { CreateTaskForm } from './create-task-form';
import { TaskItem } from './task-item';

import { type GoalWithTasksCount, type TaskWithTime } from '@/lib/types';
import { TaskListSkeleton } from './task-list-skeleton';
import { TaskStats } from './task-stats';

// --- Type Definitions & API Functions ---
interface TaskListProps {
  goalId: string | null;
}

const fetchGoalDetails = async (
  goalId: string
): Promise<GoalWithTasksCount> => {
  const { data } = await axios.get(`/api/goals/${goalId}`);
  return data;
};

const fetchTasksByGoal = async (goalId: string): Promise<TaskWithTime[]> => {
  const { data } = await axios.get(`/api/goals/${goalId}/tasks`);
  return data;
};

const updateTaskOrder = async (tasks: { id: string; sortOrder: number }[]) => {
  const { data } = await axios.patch('/api/tasks/order', tasks);
  return data;
};

// --- Main Component ---
export function TaskList({ goalId }: TaskListProps) {
  const queryClient = useQueryClient();
  const [orderedTasks, setOrderedTasks] = useState<TaskWithTime[]>([]);

  const { data: goal, isLoading: isGoalLoading } = useQuery<GoalWithTasksCount>(
    {
      queryKey: ['goal', goalId],
      queryFn: () => fetchGoalDetails(goalId!),
      enabled: !!goalId,
    }
  );

  const {
    data: fetchedTasks,
    isLoading: areTasksLoading,
    isError,
    error,
  } = useQuery<TaskWithTime[]>({
    queryKey: ['tasks', goalId],
    queryFn: () => fetchTasksByGoal(goalId!),
    enabled: !!goalId,
  });

  useEffect(() => {
    if (fetchedTasks) {
      setOrderedTasks(fetchedTasks);
    }
  }, [fetchedTasks]);

  const taskStats = useMemo(() => {
    if (!fetchedTasks) {
      return { total: 0, completed: 0, inProgress: 0, pending: 0 };
    }
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

  const orderMutation = useMutation({
    mutationFn: updateTaskOrder,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['tasks', goalId] }),
    onError: () => {
      setOrderedTasks(fetchedTasks || []);
      toast.error('Could not save new order.');
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

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

  const renderContent = () => {
    if (isGoalLoading || areTasksLoading) return <TaskListSkeleton />;
    if (isError)
      return (
        <div className='text-destructive p-4 text-center'>
          Error: {error.message}
        </div>
      );
    if (!goal) return <div>Goal not found.</div>;

    return (
      <div className='flex h-full flex-col bg-card rounded-lg border'>
        {/* Header Section */}
        <div className='p-4 border-b'>
          <h1 className='text-2xl font-bold'>{goal.title}</h1>
          {goal.description && (
            <p className='mt-1 text-sm text-muted-foreground'>
              {goal.description}
            </p>
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
                  <TaskItem key={task.id} task={task} />
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
    );
  };

  return renderContent();
}
