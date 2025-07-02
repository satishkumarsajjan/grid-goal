import { type Goal, type Task } from '@prisma/client';

export type GoalWithTasksCount = Goal & {
  _count: {
    tasks: number;
  };
};
