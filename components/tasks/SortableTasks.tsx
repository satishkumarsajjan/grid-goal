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
import { TaskItem } from './task-item';

interface SortableTasksProps {
  tasks: TaskWithTime[];
  onDragEnd: (event: DragEndEvent) => void;
  onStartSession: (task: TaskWithTime) => void;
  isDisabled: boolean;
}

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
        onDragEnd={onDragEnd}
      >
        <ul className='list-none p-0 m-0'>
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
        </ul>
      </DndContext>
    </div>
  );
}
