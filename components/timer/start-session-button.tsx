'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlayCircle } from 'lucide-react';
import { TaskSelectionModal } from './task-selection-modal'; // We will create this next

export function StartSessionButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)} size='lg'>
        <PlayCircle className='mr-2 h-5 w-5' />
        Start Focus Session
      </Button>

      {/* 
        The modal is rendered here but is controlled by the `isModalOpen` state.
        It's not visible until the button is clicked.
      */}
      <TaskSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
