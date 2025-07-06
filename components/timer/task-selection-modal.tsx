'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { TimerMode, type Task } from '@prisma/client';
import { toast } from 'sonner';

import { useTimerStore, type ActiveTask } from '@/store/timer-store';
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

// Type definition for the data fetched from the API
type TaskWithGoalTitle = Task & { goal: { title: string } };

// API fetching functions
const fetchQueue = async (): Promise<TaskWithGoalTitle[]> =>
  (await axios.get('/api/daily-queue?includeGoal=true')).data.map(
    (item: any) => item.task
  );

const fetchAllTasks = async (): Promise<TaskWithGoalTitle[]> =>
  (await axios.get('/api/tasks?includeGoal=true')).data;

// Component props
interface TaskSelectionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedTask?: ActiveTask;
}

export function TaskSelectionModal({
  isOpen,
  onOpenChange,
  preselectedTask,
}: TaskSelectionModalProps) {
  const startSession = useTimerStore((state) => state.startSession);

  // State now only stores the ID, which is simpler and more robust.
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<TimerMode>('STOPWATCH');

  // --- Data Fetching with TanStack Query ---
  const { data: queueItems, isLoading: queueIsLoading } = useQuery<
    TaskWithGoalTitle[]
  >({
    queryKey: ['dailyQueueWithGoal'],
    queryFn: fetchQueue,
    enabled: isOpen && !preselectedTask, // Only fetch if the modal is open AND no task is preselected.
  });

  const hasQueue = !!queueItems && queueItems.length > 0;
  const { data: allTasks, isLoading: tasksAreLoading } = useQuery<
    TaskWithGoalTitle[]
  >({
    queryKey: ['allTasksWithGoal'],
    queryFn: fetchAllTasks,
    enabled: isOpen && !preselectedTask && !hasQueue, // Only fetch all tasks if the queue is also empty.
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const isLoading = queueIsLoading || (tasksAreLoading && !hasQueue);
  const tasksToShow = hasQueue ? queueItems : allTasks;

  // --- State Synchronization & Default Selection ---
  useEffect(() => {
    // This effect correctly sets the selected task ID when the modal opens or data changes.
    if (!isOpen) {
      setSelectedTaskId(null); // Always reset on close.
      return;
    }

    if (preselectedTask) {
      setSelectedTaskId(preselectedTask.id);
    } else if (hasQueue) {
      setSelectedTaskId(queueItems[0].id); // Default to first item in queue
    } else if (allTasks && allTasks.length > 0) {
      setSelectedTaskId(allTasks[0].id); // Default to first item in all tasks
    } else {
      setSelectedTaskId(null); // No data, no selection
    }
  }, [isOpen, preselectedTask, hasQueue, allTasks, queueItems]);

  // --- The CRITICAL Event Handler ---
  const handleStart = () => {
    let taskPayload: ActiveTask | undefined;

    // Case 1: A task was pre-selected when opening the modal.
    if (preselectedTask) {
      taskPayload = preselectedTask;
    }
    // Case 2: No pre-selection, so find the selected task from our fetched data.
    else if (selectedTaskId && tasksToShow) {
      const task = tasksToShow.find((t) => t.id === selectedTaskId);
      if (task) {
        // Construct the payload required by the timer store
        console.log('TASK', task);

        taskPayload = {
          id: task.id,
          title: task.title,
          goalId: task.goalId,
          goalTitle: task.goal.title,
        };
      }
    }

    // If we couldn't determine a task to start, show an error.
    if (!taskPayload) {
      toast.error('Please select a task to focus on.');
      return;
    }

    // If a valid payload was constructed, start the session.
    startSession(taskPayload, selectedMode);
    onOpenChange(false); // Close the modal
  };

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

        {/* Timer Mode Tabs */}
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

        {/* Task Selection List (only shown if no task was preselected) */}
        {!preselectedTask && (
          <div className='mt-4'>
            <h4 className='text-sm font-semibold mb-2 text-muted-foreground'>
              {hasQueue ? 'From Your Focus Queue' : 'Select a Task'}
            </h4>
            <ScrollArea className='h-48 border rounded-md'>
              <div className='p-2'>
                {isLoading ? (
                  <div className='space-y-2 p-2'>
                    <Skeleton className='h-8 w-full' />
                    <Skeleton className='h-8 w-full' />
                    <Skeleton className='h-8 w-full' />
                  </div>
                ) : !tasksToShow || tasksToShow.length === 0 ? (
                  <p className='text-sm text-muted-foreground text-center py-4'>
                    No actionable tasks found.
                  </p>
                ) : (
                  tasksToShow.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className={cn(
                        'w-full text-left p-2 rounded-md text-sm transition-colors',
                        selectedTaskId === task.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent'
                      )}
                    >
                      {task.title}
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        <DialogFooter className='mt-4'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {/* The disabled state is now simpler: just check if any task is selected. */}
          <Button
            onClick={handleStart}
            disabled={preselectedTask ? false : !selectedTaskId}
          >
            Start
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
