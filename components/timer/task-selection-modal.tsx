'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { type Task } from '@prisma/client';
import { useTimerStore } from '@/store/timer-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';

interface TaskSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// We need a new API endpoint to fetch all actionable tasks
const fetchAllTasks = async (): Promise<Task[]> => {
  const { data } = await axios.get('/api/tasks/actionable'); // Let's define this new route
  return data;
};

export function TaskSelectionModal({
  isOpen,
  onClose,
}: TaskSelectionModalProps) {
  // Get the startSession action from our Zustand store
  const startSession = useTimerStore((state) => state.startSession);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const {
    data: tasks,
    isLoading,
    isError,
  } = useQuery<Task[]>({
    queryKey: ['actionableTasks'],
    queryFn: fetchAllTasks,
    // We only want to fetch the tasks when the modal is opened for the first time
    enabled: isOpen,
  });

  const handleStartSession = () => {
    if (selectedTask) {
      startSession(selectedTask.id, selectedTask.goalId);
      // The main layout will handle showing Zen Mode, so we just need to close the modal
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Select a Task</DialogTitle>
          <DialogDescription>
            Choose which task you want to focus on for this session.
          </DialogDescription>
        </DialogHeader>
        <div className='mt-4'>
          <ScrollArea className='h-72'>
            <div className='space-y-2 pr-4'>
              {isLoading && <p>Loading tasks...</p>}
              {isError && <p className='text-red-500'>Failed to load tasks.</p>}
              {tasks?.map((task) => (
                <button
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`w-full text-left rounded-md border p-4 transition-colors ${
                    selectedTask?.id === task.id
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <p className='font-medium'>{task.title}</p>
                  {/* We can add the parent goal title here later */}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
        <div className='mt-6 flex justify-end'>
          <Button
            onClick={handleStartSession}
            disabled={!selectedTask} // Disable button until a task is selected
          >
            Start Session
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
