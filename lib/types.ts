import {
  Category,
  FocusSession,
  PomodoroCycle,
  SessionVibe,
  TimerMode,
  type Goal,
  type Task,
} from '@prisma/client';

export type GoalWithTasksCount = Goal & {
  _count: {
    tasks: number;
  };
};

export type TaskWithTime = Task & {
  totalTimeSpentSeconds: number;
};

export type GoalWithProgress = Goal & {
  totalTasks: number;
  completedTasks: number;
};

export type GoalWithProgressAndChildren = GoalWithProgress & {
  children: GoalWithProgressAndChildren[];
};

export type GoalWithSessions = Goal & {
  focusSessions: {
    startTime: Date;
    durationSeconds: number;
  }[];
};

import { Prisma } from '@prisma/client';
import { z } from 'zod';

// Base type for queue items without goal
export type DailyQueueItemWithTask = Prisma.DailyQueueItemGetPayload<{
  include: {
    task: true;
  };
}>;

// Type for queue items with goal included
export type DailyQueueItemWithTaskAndGoal = Prisma.DailyQueueItemGetPayload<{
  include: {
    task: {
      include: {
        goal: true;
      };
    };
  };
}>;

// Union type that represents both possibilities
export type QueueItem = DailyQueueItemWithTask | DailyQueueItemWithTaskAndGoal;

// Array type for the queueItems variable
export type QueueItems = QueueItem[];

// Type guard to check if a queue item has goal data
export function hasGoal(
  item: QueueItem
): item is DailyQueueItemWithTaskAndGoal {
  return 'goal' in item.task && item.task.goal !== null;
}

// Alternative: More explicit conditional type
export type DailyQueueResponse<T extends boolean = boolean> = T extends true
  ? DailyQueueItemWithTaskAndGoal[]
  : DailyQueueItemWithTask[];

export type FullGoalDetails = Goal & {
  category: Category | null;
  focusSessions: Pick<FocusSession, 'startTime' | 'durationSeconds'>[];
  tasks: TaskWithTime[];
};

export type TaskWithGoal = Task & { goal: { title: string } };

export const createFocusSessionSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  durationSeconds: z.number().int().positive(),
  taskId: z.string().cuid(),
  goalId: z.string().cuid(),
  noteAccomplished: z.string().max(10000).optional().nullable(),
  noteNextStep: z.string().max(10000).optional().nullable(),
  artifactUrl: z.string().url().optional().nullable(),
  vibe: z.nativeEnum(SessionVibe).optional(),
  tags: z.array(z.string().min(1).max(50)).optional(),
  mode: z.nativeEnum(TimerMode),
  pomodoroCycle: z.nativeEnum(PomodoroCycle).optional(),
  sequenceId: z.string().uuid().optional().nullable(),
  markTaskAsComplete: z.boolean().optional(),
});
