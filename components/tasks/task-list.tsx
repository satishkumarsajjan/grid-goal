'use client';

import { type DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { TaskStatus } from '@prisma/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { TaskListSkeleton } from '@/app/(main)/goals/[[...goalId]]/page';
import { TaskSelectionModal } from '@/components/timer/task-selection-modal';
import { AriaLiveRegion } from '@/components/ui/AriaLiveRegion';
import { type FullGoalDetails, type TaskWithTime } from '@/lib/types';
import { CreateTaskForm } from './create-task-form';
import { SortableTasks } from './SortableTasks';
import {
  TaskListControls,
  type FilterOption,
  type SortOption,
} from './TaskListControls';
import { TaskListHeader } from './TaskListHeader';

interface TaskListProps {
  goalId: string | null;
  onOpenCreateCategoryDialog: () => void;
}

const fetchGoalDetails = async (goalId: string): Promise<FullGoalDetails> => {
  const { data } = await axios.get(`/api/goals/${goalId}`);

  return data;
};

const updateTaskOrder = async (tasks: { id: string; sortOrder: number }[]) => {
  const { data } = await axios.patch('/api/tasks/order', tasks);
  return data;
};

export function TaskList({
  goalId,
  onOpenCreateCategoryDialog,
}: TaskListProps) {
  const queryClient = useQueryClient();
  const [orderedTasks, setOrderedTasks] = useState<TaskWithTime[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskForSession, setTaskForSession] = useState<TaskWithTime | null>(
    null
  );
  const [announcement, setAnnouncement] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('ALL');
  const [activeSort, setActiveSort] = useState<SortOption>('sortOrder');

  const {
    data: goalData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['goal', goalId],
    queryFn: () => fetchGoalDetails(goalId!),
    enabled: !!goalId,
  });

  const goal = goalData;
  const fetchedTasks = goalData?.tasks;

  useEffect(() => {
    if (fetchedTasks) {
      setOrderedTasks(fetchedTasks);
    }
    setActiveFilter('ALL');
    setActiveSort('sortOrder');
  }, [fetchedTasks, goalId]);

  const displayedTasks = useMemo(() => {
    let tasks = [...orderedTasks];
    if (activeFilter !== 'ALL') {
      tasks = tasks.filter((task) => task.status === activeFilter);
    }
    switch (activeSort) {
      case 'createdAt':
        tasks.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'estimatedTimeSeconds':
        tasks.sort(
          (a, b) =>
            (b.estimatedTimeSeconds || 0) - (a.estimatedTimeSeconds || 0)
        );
        break;
      default:
        break;
    }
    return tasks;
  }, [orderedTasks, activeFilter, activeSort]);

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
      queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
    },
    onError: () => {
      setOrderedTasks(fetchedTasks || []);
      toast.error('Could not save new order. Reverting changes.');
      setAnnouncement('Task order could not be saved and has been reverted.');
    },
  });

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
      setAnnouncement(`Task "${taskTitle}" moved to position ${newIndex + 1}.`);
    }
  };

  const handleFilterChange = (filter: FilterOption) => {
    setActiveFilter(filter);
    if (filter !== 'ALL' && activeSort === 'sortOrder') {
      setActiveSort('createdAt');
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

  if (isLoading && !goalData) return <TaskListSkeleton />;
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
          onOpenCreateCategoryDialog={onOpenCreateCategoryDialog}
        />
        <TaskListControls
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          activeSort={activeSort}
          onSortChange={setActiveSort}
          isDisabled={orderMutation.isPending}
        />
        <div className='flex-1 overflow-y-auto'>
          <SortableTasks
            tasks={orderedTasks}
            totalTaskCount={orderedTasks.length}
            onDragEnd={handleDragEnd}
            onStartSession={(task) => {
              setTaskForSession(task);
              setIsModalOpen(true);
            }}
            isDisabled={orderMutation.isPending || activeSort !== 'sortOrder'}
          />
        </div>
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
                goalId: goal.id,
                goalTitle: goal.title,
              }
            : undefined
        }
      />
    </>
  );
}
