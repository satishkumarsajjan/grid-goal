'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { TaskSelectionModal } from './task-selection-modal';

// This component is a simple "trigger". Its only job is to manage the
// open/closed state of the modal. It does not pass a preselectedTask.
export function StartSessionButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>
        <Play className='-ml-1 mr-2 h-4 w-4' />
        Start Focus Session
      </Button>

      <TaskSelectionModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
