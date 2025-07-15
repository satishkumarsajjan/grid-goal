'use client';

import { type TaskWithTime } from '@/lib/types';
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
import { CheckCircle2, ListX } from 'lucide-react';
import { TaskItem } from './task-item';
import { ScrollArea } from '@/components/ui/scroll-area'; // 1. Import the ScrollArea component

interface SortableTasksProps {
  tasks: TaskWithTime[];
  totalTaskCount: number;
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
    // The empty state does not need to be in the scroll area,
    // so it's rendered directly if there are no tasks.
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
    // This is the "No matching tasks" state, which should be inside the scroll area.
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

  // A small optimization: if there are no tasks at all, don't even render the DndContext or ScrollArea.
  if (totalTaskCount === 0) {
    return renderEmptyState();
  }

  return (
    // 2. Wrap the DndContext with the ScrollArea component
    // The `h-full` class makes it fill the parent container, which should be a flex item.
    <ScrollArea className='h-full p-2'>
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
              : // Render the "No Matching Tasks" state when filters clear the list
                renderEmptyState()}
          </SortableContext>
        </ul>
      </DndContext>
    </ScrollArea>
  );
}
