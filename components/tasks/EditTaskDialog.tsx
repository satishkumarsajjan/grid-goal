'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { TaskForm } from './TaskForm';
import { type Task } from '@prisma/client';

interface EditTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
}

export function EditTaskDialog({
  isOpen,
  onOpenChange,
  task,
}: EditTaskDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Make changes to your task details below.
          </DialogDescription>
        </DialogHeader>
        <div className='pt-4'>
          <TaskForm
            goalId={task.goalId}
            initialData={task}
            onFinished={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
