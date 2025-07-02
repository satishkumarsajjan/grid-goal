import { z } from 'zod';

export const createGoalSchema = z.object({
  title: z.string().min(1, { message: 'Title cannot be empty.' }).max(255),
  description: z.string().max(10000).optional(),
  parentId: z.string().cuid().optional(),
});

// You would create other schemas here as you build more features
// export const updateGoalSchema = ...
// export const createTaskSchema = ...
