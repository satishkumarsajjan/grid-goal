'use client';

import { TimerMode, type Task } from '@prisma/client';
import { useQueries } from '@tanstack/react-query';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useTimerStore, type ActiveTask } from '@/store/timer-store';
import { Hourglass, Timer } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

type TaskWithGoalTitle = Task & { goal: { title: string } };

const fetchQueue = async (): Promise<TaskWithGoalTitle[]> =>
  (await axios.get('/api/daily-queue?includeGoal=true')).data.map(
    (item: any) => item.task
  );
const fetchAllTasks = async (): Promise<TaskWithGoalTitle[]> =>
  (await axios.get('/api/tasks?includeGoal=true')).data;

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

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<TimerMode>('STOPWATCH');

  const [activeTab, setActiveTab] = useState<'queue' | 'all'>('queue');

  const [queueQuery, allTasksQuery] = useQueries({
    queries: [
      {
        queryKey: ['dailyQueueWithGoal'],
        queryFn: fetchQueue,
        enabled: isOpen && !preselectedTask,
      },
      {
        queryKey: ['allTasksWithGoal'],
        queryFn: fetchAllTasks,
        enabled: isOpen && !preselectedTask,
        staleTime: 1000 * 60 * 5,
      },
    ],
  });

  const queueItems = queueQuery.data;
  const allTasks = allTasksQuery.data;
  const hasQueue = !!queueItems && queueItems.length > 0;

  const isLoading =
    queueQuery.isLoading || (allTasksQuery.isLoading && activeTab === 'all');

  useEffect(() => {
    if (!isOpen) {
      setSelectedTaskId(null);
      return;
    }

    if (preselectedTask) {
      setSelectedTaskId(preselectedTask.id);
    } else {
      if (hasQueue) {
        setActiveTab('queue');
        setSelectedTaskId(queueItems[0].id);
      } else if (allTasks && allTasks.length > 0) {
        setActiveTab('all');
        setSelectedTaskId(allTasks[0].id);
      } else {
        setSelectedTaskId(null);
      }
    }
  }, [isOpen, preselectedTask, hasQueue, allTasks, queueItems]);

  useEffect(() => {
    if (preselectedTask || !isOpen) return;

    if (activeTab === 'queue' && hasQueue) {
      setSelectedTaskId(queueItems[0].id);
    } else if (activeTab === 'all' && allTasks && allTasks.length > 0) {
      setSelectedTaskId(allTasks[0].id);
    } else {
      setSelectedTaskId(null);
    }
  }, [activeTab, preselectedTask, isOpen, hasQueue, allTasks, queueItems]);

  const handleStart = () => {
    let taskPayload: ActiveTask | undefined;

    if (preselectedTask) {
      taskPayload = preselectedTask;
    } else if (selectedTaskId) {
      const task =
        queueItems?.find((t) => t.id === selectedTaskId) ||
        allTasks?.find((t) => t.id === selectedTaskId);
      if (task) {
        taskPayload = {
          id: task.id,
          title: task.title,
          goalId: task.goalId,
          goalTitle: task.goal.title,
        };
      }
    }

    if (!taskPayload) {
      toast.error('Please select a task to focus on.');
      return;
    }

    startSession(taskPayload, selectedMode);
    onOpenChange(false);
  };

  const renderTaskList = (tasks: TaskWithGoalTitle[] | undefined) => {
    if (isLoading) {
      return (
        <div className='space-y-2 p-2'>
          <Skeleton className='h-12 w-full' />
          <Skeleton className='h-12 w-full' />
          <Skeleton className='h-12 w-full' />
        </div>
      );
    }
    if (!tasks || tasks.length === 0) {
      return (
        <p className='text-sm text-muted-foreground text-center py-4'>
          No actionable tasks found.
        </p>
      );
    }
    return tasks.map((task) => (
      <button
        key={task.id}
        onClick={() => setSelectedTaskId(task.id)}
        aria-selected={selectedTaskId === task.id}
        className={cn(
          'w-full text-left p-2 rounded-md transition-colors',
          selectedTaskId === task.id
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-accent'
        )}
      >
        <span className='font-medium text-sm block'>{task.title}</span>
        <span className='block text-xs text-muted-foreground'>
          {task.goal.title}
        </span>
      </button>
    ));
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
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'queue' | 'all')}
            className='w-full mt-4'
          >
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='queue' disabled={!hasQueue}>
                Focus Queue
              </TabsTrigger>
              <TabsTrigger value='all'>All Tasks</TabsTrigger>
            </TabsList>
            <ScrollArea className='h-48 border rounded-md mt-2'>
              <div className='p-2 space-y-1'>
                {activeTab === 'queue'
                  ? renderTaskList(queueItems)
                  : renderTaskList(allTasks)}
              </div>
            </ScrollArea>
          </Tabs>
        )}

        <DialogFooter className='mt-4'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
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
