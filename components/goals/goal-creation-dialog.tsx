'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { GoalForm } from './create-goal-form'; // Assuming you have this form component
import { type GoalDialogOptions } from '@/app/(main)/goals/[[...goalId]]/page';

interface GoalCreationDialogProps {
  options: GoalDialogOptions;
  onOpenChange: (open: boolean) => void;
}

export function GoalCreationDialog({
  options,
  onOpenChange,
}: GoalCreationDialogProps) {
  return (
    <Dialog open={options.open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>
            {options.parentId ? 'Create New Sub-Goal' : 'Create New Goal'}
          </DialogTitle>
        </DialogHeader>
        <GoalForm
          parentId={options.parentId}
          onFinished={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
