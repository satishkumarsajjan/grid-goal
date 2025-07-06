import { type Goal, type Task } from '@prisma/client';

export type GoalWithTasksCount = Goal & {
  _count: {
    tasks: number;
  };
};

export type TaskWithTime = Task & {
  totalTimeSeconds: number;
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
