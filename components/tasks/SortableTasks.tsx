'use client';

import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  // FIX: DragStartEvent is no longer needed here
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TaskItem } from './task-item';
import { type TaskWithTime } from '@/lib/types';

// FIX: The props interface no longer requires onDragStart
interface SortableTasksProps {
  tasks: TaskWithTime[];
  onDragEnd: (event: DragEndEvent) => void;
  onStartSession: (task: TaskWithTime) => void;
  isDisabled: boolean;
}

// FIX: The component no longer accepts onDragStart as a prop
export function SortableTasks({
  tasks,
  onDragEnd,
  onStartSession,
  isDisabled,
}: SortableTasksProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  return (
    <div className='flex-1 overflow-y-auto overflow-x-clip p-2'>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        // FIX: The onDragStart prop is removed from the DndContext
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
          disabled={isDisabled}
        >
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onStartSession={onStartSession}
                isDragDisabled={isDisabled}
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
  );
}
