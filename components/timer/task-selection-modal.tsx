'use client';

import { useState, useEffect } from 'react';
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

// --- Type Definitions & API Functions ---
type QueueItemWithTask = DailyQueueItem & { task: Task };

const fetchQueue = async (): Promise<QueueItemWithTask[]> =>
  (await axios.get('/api/daily-queue')).data;
const fetchAllTasks = async (): Promise<Task[]> =>
  (await axios.get('/api/tasks')).data; // Assuming /api/tasks GET route exists

interface TaskSelectionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  // NEW: Pass an optional task to pre-select it
  preselectedTask?: { id: string; goalId: string; title: string };
}

export function TaskSelectionModal({
  isOpen,
  onOpenChange,
  preselectedTask,
}: TaskSelectionModalProps) {
  const startSession = useTimerStore((state) => state.startSession);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<TimerMode>('stopwatch');

  // This effect synchronizes the internal state whenever the modal is opened
  // with a new preselected task.
  useEffect(() => {
    if (isOpen) {
      if (preselectedTask) {
        setSelectedTaskId(preselectedTask.id);
        setSelectedGoalId(preselectedTask.goalId);
      } else {
        // Reset if opening without a preselection
        setSelectedTaskId(null);
        setSelectedGoalId(null);
      }
    }
  }, [isOpen, preselectedTask]);

  // --- Data Fetching with TanStack Query ---
  const { data: queueItems, isLoading: queueIsLoading } = useQuery<
    QueueItemWithTask[]
  >({
    queryKey: ['dailyQueue'],
    queryFn: fetchQueue,
    enabled: isOpen, // Only fetch when the modal is open
  });

  const { data: allTasks, isLoading: tasksAreLoading } = useQuery<Task[]>({
    queryKey: ['allTasks'],
    queryFn: fetchAllTasks,
    enabled:
      isOpen &&
      !preselectedTask &&
      !queueIsLoading &&
      (!queueItems || queueItems.length === 0),
  });

  const handleStart = () => {
    if (!selectedTaskId || !selectedGoalId) {
      toast.error('Please select a task to focus on.');
      return;
    }
    startSession(selectedTaskId, selectedGoalId, selectedMode);
    onOpenChange(false);
  };

  const isLoading = queueIsLoading || tasksAreLoading;
  const tasksToShow =
    queueItems && queueItems.length > 0
      ? queueItems.map((item) => item.task)
      : allTasks;

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
              <TabsTrigger value='stopwatch'>
                <Timer className='mr-2 h-4 w-4' />
                Stopwatch
              </TabsTrigger>
              <TabsTrigger value='pomodoro'>
                <Hourglass className='mr-2 h-4 w-4' />
                Pomodoro
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Task List is hidden if a task is already pre-selected */}
        {!preselectedTask && (
          <div className='mt-4'>
            <h4 className='text-sm font-semibold mb-2 text-muted-foreground'>
              {queueItems && queueItems.length > 0
                ? 'From Your Focus Queue'
                : 'Select a Task'}
            </h4>
            <ScrollArea className='h-48 border rounded-md'>
              <div className='p-2'>
                {isLoading && (
                  <div className='p-4'>
                    <Skeleton className='h-5 w-full' />
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
                    onClick={() => {
                      setSelectedTaskId(task.id);
                      setSelectedGoalId(task.goalId);
                    }}
                    className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                      selectedTaskId === task.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    }`}
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
          <Button onClick={handleStart} disabled={!selectedTaskId}>
            Start Focusing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
