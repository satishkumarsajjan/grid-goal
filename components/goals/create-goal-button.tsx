'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CreateGoalForm } from './create-goal-form';

export function CreateGoalButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className='-ml-1 mr-2 h-4 w-4' />
          New Goal
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Create a New Goal</DialogTitle>
        </DialogHeader>

        <CreateGoalForm onFinished={() => setIsOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
