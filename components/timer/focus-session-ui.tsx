'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { type Task } from '@prisma/client';

import { useTimerStore } from '@/store/timer-store';
import { useTimer } from '@/hooks/use-timer';
import { Button } from '@/components/ui/button';
import { SessionSummaryPanel } from '@/components/session/session-summary-panel';

// API fetching function for the task's details
const fetchTaskDetails = async (taskId: string): Promise<Task> => {
  const { data } = await axios.get(`/api/tasks/${taskId}`);
  return data;
};

// Helper function to format seconds into a HH:MM:SS string
const formatTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((v) => v.toString().padStart(2, '0'))
    .join(':');
};

export function FocusSessionUI() {
  // State to control when the summary panel is shown
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);

  // Get necessary state and actions from the global timer store
  const { activeTaskId, activeGoalId } = useTimerStore();

  // Our custom hook provides the live elapsed time, updated every second
  const elapsedTime = useTimer();

  // Fetch the details of the currently active task
  const { data: task, isLoading } = useQuery<Task>({
    queryKey: ['task', activeTaskId], // Dynamic query key based on the active task
    queryFn: () => fetchTaskDetails(activeTaskId!),
    enabled: !!activeTaskId, // Only run the query if there is an active task
    staleTime: Infinity, // The task details are unlikely to change during a session
  });

  // Handler for the "Stop Session" button
  const handleStop = () => {
    // Instead of stopping immediately, we show the summary panel
    setIsSummaryVisible(true);
  };

  // This is the full-screen Zen Mode UI
  const ZenMode = (
    <div className='fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900 text-white transition-opacity duration-300'>
      <div className='text-center'>
        <p className='text-lg text-gray-400'>Focusing on:</p>
        <h1 className='mt-2 text-4xl font-bold text-white'>
          {isLoading || !task ? 'Loading task...' : task.title}
        </h1>

        <div className='mt-12 font-mono text-8xl font-bold tracking-tighter text-white'>
          {formatTime(elapsedTime)}
        </div>

        <Button
          onClick={handleStop}
          variant='destructive'
          size='lg'
          className='mt-12'
        >
          Stop Session
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {ZenMode}

      {/* 
        The SessionSummaryPanel is always rendered in the background, but it
        is only made visible when its `isOpen` prop is true. This allows its
        slide-in animation to work correctly.
      */}
      <SessionSummaryPanel
        isOpen={isSummaryVisible}
        onClose={() => setIsSummaryVisible(false)} // Allows closing the panel (e.g., by clicking outside)
        durationSeconds={elapsedTime}
        taskId={activeTaskId!}
        goalId={activeGoalId!}
      />
    </>
  );
}
