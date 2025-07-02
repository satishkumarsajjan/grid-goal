'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { type Task } from '@prisma/client';
import { TaskItem } from './task-item';
import { CreateTaskForm } from './create-task-form';

// DND-Kit Imports for Drag and Drop functionality
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { GoalWithTasksCount } from '@/lib/types';

// Props for the component
interface TaskListProps {
  goalId: string | null;
}

// --- API Fetching Functions ---

const fetchGoalDetails = async (
  goalId: string
): Promise<GoalWithTasksCount> => {
  const { data } = await axios.get(`/api/goals/${goalId}`);
  return data;
};

const fetchTasksByGoal = async (goalId: string): Promise<Task[]> => {
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

  // Local state to manage the visual order of tasks during drag operations.
  // This allows for an "optimistic" UI update that feels instantaneous.
  const [orderedTasks, setOrderedTasks] = useState<Task[]>([]);

  // Query 1: Fetch the details of the selected goal
  const {
    data: goal,
    isLoading: isGoalLoading,
    isError: isGoalError,
  } = useQuery<GoalWithTasksCount>({
    queryKey: ['goal', goalId],
    queryFn: () => fetchGoalDetails(goalId!),
    enabled: !!goalId,
  });

  // Query 2: Fetch the tasks for the selected goal
  const {
    data: fetchedTasks,
    isLoading: areTasksLoading,
    isError: areTasksError,
  } = useQuery<Task[]>({
    queryKey: ['tasks', goalId],
    queryFn: () => fetchTasksByGoal(goalId!),
    enabled: !!goalId,
  });

  // This effect synchronizes the local `orderedTasks` state with the
  // data fetched from the server.
  useEffect(() => {
    if (fetchedTasks) {
      setOrderedTasks(fetchedTasks);
    }
  }, [fetchedTasks]);

  // Mutation for saving the new task order to the database
  const orderMutation = useMutation({
    mutationFn: updateTaskOrder,
    onSuccess: () => {
      // Once the API call succeeds, invalidate the query to ensure our
      // local cache is in sync with the database.
      queryClient.invalidateQueries({ queryKey: ['tasks', goalId] });
    },
    onError: (error) => {
      // If the save fails, revert the local state back to the original server state
      // to avoid a disjointed UI.
      setOrderedTasks(fetchedTasks || []);
      console.error('Failed to update task order:', error);
      // You could add a toast notification here to inform the user.
    },
  });

  // dnd-kit sensors to detect drag events (pointer for mouse, keyboard for accessibility)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handler for when a drag operation is completed
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = orderedTasks.findIndex((t) => t.id === active.id);
      const newIndex = orderedTasks.findIndex((t) => t.id === over.id);

      // Create the new, reordered array for the optimistic UI update
      const reorderedTasks = arrayMove(orderedTasks, oldIndex, newIndex);
      setOrderedTasks(reorderedTasks);

      // Prepare the data payload for the API (only IDs and new order are needed)
      const tasksToUpdate = reorderedTasks.map((task, index) => ({
        id: task.id,
        sortOrder: index,
      }));

      // Call the mutation to save the new order to the database
      orderMutation.mutate(tasksToUpdate);
    }
  };

  // --- Render Logic ---

  if (!goalId) {
    return (
      <div className='flex h-full flex-col items-center justify-center bg-gray-50 text-center dark:bg-gray-800/20'>
        <h2 className='text-xl font-semibold text-gray-700 dark:text-gray-300'>
          Select a goal
        </h2>
        <p className='text-gray-500 dark:text-gray-400'>
          Choose a goal from the list to see its tasks.
        </p>
      </div>
    );
  }

  if (isGoalLoading || areTasksLoading) {
    // A simple loading state. This could be replaced with a skeleton loader.
    return <div>Loading...</div>;
  }

  if (isGoalError || areTasksError) {
    return <div className='text-red-500'>Error loading goal data.</div>;
  }

  if (!goal) {
    return <div>Goal not found.</div>;
  }

  return (
    <div className='flex h-full flex-col'>
      {/* Header Section */}
      <div className='border-b border-gray-200 p-4 dark:border-gray-700'>
        <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-50'>
          {goal.title}
        </h1>
        {goal.description && (
          <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
            {goal.description}
          </p>
        )}
      </div>

      {/* Task List Section - Wrapped in dnd-kit context providers */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className='flex-1 overflow-y-auto p-4'>
          <SortableContext
            items={orderedTasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {orderedTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </SortableContext>
        </div>
      </DndContext>

      {/* Footer Section for adding new tasks */}
      <div className='border-t border-gray-200 p-4 dark:border-gray-700'>
        <CreateTaskForm goalId={goal.id} />
      </div>
    </div>
  );
}
