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
