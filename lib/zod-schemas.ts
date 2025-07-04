import { z } from 'zod';

export const createGoalSchema = z.object({
  title: z.string().min(1, 'Goal title cannot be empty.').max(255),
  description: z.string().max(1000).optional(),
  parentId: z.string().optional(),
  deadline: z.coerce.date().optional(),
});

// You would create other schemas here as you build more features
// export const updateGoalSchema = ...
// export const createTaskSchema = ...
