'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { type DailyQueueItem, type Task } from '@prisma/client';
import { toast } from 'sonner';

import { useTimerStore, type TimerMode } from '@/store/timer-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Timer, Hourglass } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';

// --- Type Definitions & API Functions ---
type QueueItemWithTask = DailyQueueItem & { task: Task };
const fetchQueue = async (): Promise<QueueItemWithTask[]> =>
  (await axios.get('/api/daily-queue')).data;
const fetchAllTasks = async (): Promise<Task[]> =>
  (await axios.get('/api/tasks')).data;

interface TaskSelectionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedTask?: Pick<Task, 'id' | 'title' | 'goalId'>;
}

export function TaskSelectionModal({
  isOpen,
  onOpenChange,
  preselectedTask,
}: TaskSelectionModalProps) {
  const startSession = useTimerStore((state) => state.startSession);
  const [selectedTask, setSelectedTask] = useState<Pick<
    Task,
    'id' | 'title' | 'goalId'
  > | null>(null);
  const [selectedMode, setSelectedMode] = useState<TimerMode>('STOPWATCH');

  // --- Data Fetching: Run queries in parallel for better performance ---
  const { data: queueItems, isLoading: queueIsLoading } = useQuery<
    QueueItemWithTask[]
  >({
    queryKey: ['dailyQueue'],
    queryFn: fetchQueue,
    enabled: isOpen, // Only fetch when open
  });

  const hasQueue = !!queueItems && queueItems.length > 0;
  const { data: allTasks, isLoading: tasksAreLoading } = useQuery<Task[]>({
    queryKey: ['allTasks'],
    queryFn: fetchAllTasks,
    enabled: isOpen && !hasQueue, // Only fetch all tasks if the queue is empty
    staleTime: 1000 * 60 * 5, // Cache all tasks for 5 minutes for better UX
  });

  // --- State Synchronization & Default Selection (The Fix for Bugs #2 & #3 and UX Flaw #2) ---
  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setSelectedTask(null);
      return;
    }

    if (preselectedTask) {
      setSelectedTask(preselectedTask);
    } else if (hasQueue) {
      // If queue exists, pre-select the first item
      const firstQueueTask = queueItems[0].task;
      setSelectedTask(firstQueueTask);
    } else if (allTasks && allTasks.length > 0) {
      // If no queue but allTasks exist, pre-select the first one
      setSelectedTask(allTasks[0]);
    } else {
      // Reset if there's no data
      setSelectedTask(null);
    }
  }, [isOpen, preselectedTask, hasQueue, allTasks, queueItems]);

  // --- Event Handlers (The Fix for Bug #1) ---
  const handleStart = () => {
    if (!selectedTask) {
      toast.error('Please select a task to focus on.');
      return;
    }
    // Pass the FULL task object with id, title, and goalId
    startSession(selectedTask, selectedMode);
    onOpenChange(false);
  };

  const isLoading = queueIsLoading || (tasksAreLoading && !hasQueue);
  const tasksToShow = hasQueue ? queueItems.map((item) => item.task) : allTasks;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Start a Focus Session</DialogTitle>
          <DialogDescription>
            {preselectedTask
              ? `Starting a session for: "${preselectedTask.title}"`
              : 'Choose a task and timer mode to begin.'}
          </DialogDescription>
        </DialogHeader>

        <div className='pt-4'>
          <Tabs
            value={selectedMode}
            onValueChange={(value) => setSelectedMode(value as TimerMode)}
            className='w-full'
          >
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='STOPWATCH'>
                <Timer className='mr-2 h-4 w-4' />
                Stopwatch
              </TabsTrigger>
              <TabsTrigger value='POMODORO'>
                <Hourglass className='mr-2 h-4 w-4' />
                Pomodoro
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {!preselectedTask && (
          <div className='mt-4'>
            <h4 className='text-sm font-semibold mb-2 text-muted-foreground'>
              {hasQueue ? 'From Your Focus Queue' : 'Select a Task'}
            </h4>
            <ScrollArea className='h-48 border rounded-md'>
              <div className='p-2'>
                {isLoading && (
                  <div className='space-y-2 p-2'>
                    <Skeleton className='h-8 w-full' />
                    <Skeleton className='h-8 w-full' />
                    <Skeleton className='h-8 w-full' />
                  </div>
                )}
                {!isLoading && (!tasksToShow || tasksToShow.length === 0) && (
                  <p className='text-sm text-muted-foreground text-center py-4'>
                    No actionable tasks found.
                  </p>
                )}
                {tasksToShow?.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className={cn(
                      'w-full text-left p-2 rounded-md text-sm transition-colors',
                      selectedTask?.id === task.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    )}
                  >
                    {task.title}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <DialogFooter className='mt-4'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleStart} disabled={!selectedTask}>
            Start Focusing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
