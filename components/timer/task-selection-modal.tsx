'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { type DailyQueueItem, type Task } from '@prisma/client';
import { toast } from 'sonner';

import { useTimerStore, type TimerMode } from '@/store/timer-store'; // <-- Import the TimerMode type
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'; // <-- IMPORT TABS
import { Timer, Hourglass } from 'lucide-react';

// --- Type Definitions & API Functions ---
type QueueItemWithTask = DailyQueueItem & { task: Task };
const fetchQueue = async (): Promise<QueueItemWithTask[]> =>
  (await axios.get('/api/daily-queue')).data;
// We might also need a fallback to fetch all tasks if the queue is empty
const fetchAllTasks = async (): Promise<Task[]> =>
  (await axios.get('/api/tasks')).data; // Assumes a simple GET all tasks endpoint

interface TaskSelectionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskSelectionModal({
  isOpen,
  onOpenChange,
}: TaskSelectionModalProps) {
  const startSession = useTimerStore((state) => state.startSession);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<TimerMode>('stopwatch'); // <-- Local state for the mode

  // Fetch the daily queue first
  const { data: queueItems, isLoading: queueIsLoading } = useQuery<
    QueueItemWithTask[]
  >({
    queryKey: ['dailyQueue'],
    queryFn: fetchQueue,
    enabled: isOpen, // Only fetch when the modal is open
  });

  // Fallback query for all tasks if the queue is empty
  const { data: allTasks, isLoading: tasksAreLoading } = useQuery<Task[]>({
    queryKey: ['allTasks'],
    queryFn: fetchAllTasks,
    enabled:
      isOpen && !queueIsLoading && (!queueItems || queueItems.length === 0),
  });

  const handleStart = () => {
    if (!selectedTaskId || !selectedGoalId) {
      toast.error('Please select a task to focus on.');
      return;
    }
    // Pass the selected mode to the startSession action
    startSession(selectedTaskId, selectedGoalId, selectedMode);
    onOpenChange(false); // Close the modal
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
          <DialogTitle>Start a New Focus Session</DialogTitle>
          <DialogDescription>
            Choose your timer mode and select a task to begin.
          </DialogDescription>
        </DialogHeader>

        {/* --- NEW: Mode Selector Tabs --- */}
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

        {/* --- Task List --- */}
        <div className='mt-4'>
          <h4 className='text-sm font-semibold mb-2'>Select a Task</h4>
          <ScrollArea className='h-48 border rounded-md'>
            <div className='p-2'>
              {isLoading && <p>Loading tasks...</p>}
              {!isLoading && (!tasksToShow || tasksToShow.length === 0) && (
                <p className='text-sm text-muted-foreground text-center py-4'>
                  No tasks to display.
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
