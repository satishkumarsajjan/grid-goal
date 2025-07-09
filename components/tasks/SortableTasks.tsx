'use client';

import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TaskItem } from './task-item';
import { type TaskWithTime } from '@/lib/types';
import { ListX, CheckCircle2 } from 'lucide-react';

interface SortableTasksProps {
  tasks: TaskWithTime[];
  totalTaskCount: number; // NEW: The total number of tasks before filtering
  onDragEnd: (event: DragEndEvent) => void;
  onStartSession: (task: TaskWithTime) => void;
  isDisabled: boolean;
}

export function SortableTasks({
  tasks,
  totalTaskCount,
  onDragEnd,
  onStartSession,
  isDisabled,
}: SortableTasksProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const renderEmptyState = () => {
    if (totalTaskCount === 0) {
      return (
        <div className='text-center text-muted-foreground p-10 flex flex-col items-center gap-4'>
          <CheckCircle2 className='h-12 w-12 text-green-500/50' />
          <div>
            <p className='font-semibold'>Goal created!</p>
            <p className='text-sm'>Add the first task below to get started.</p>
          </div>
        </div>
      );
    }

    return (
      <div className='text-center text-muted-foreground p-10 flex flex-col items-center gap-4'>
        <ListX className='h-12 w-12 text-muted-foreground/50' />
        <div>
          <p className='font-semibold'>No Matching Tasks</p>
          <p className='text-sm'>
            No tasks match your current filter criteria.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className='flex-1 overflow-y-auto overflow-x-clip p-2'>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <ul className='list-none p-0 m-0'>
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
            disabled={isDisabled}
          >
            {tasks.length > 0
              ? tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onStartSession={onStartSession}
                    isDragDisabled={isDisabled}
                  />
                ))
              : renderEmptyState()}
          </SortableContext>
        </ul>
      </DndContext>
    </div>
  );
}
