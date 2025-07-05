import { z } from 'zod';

export const createGoalSchema = z.object({
  title: z.string().min(1, 'Goal title cannot be empty.').max(255),
  description: z.string().max(1000).optional(),
  parentId: z.string().optional(),
  deadline: z.coerce.date().optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').max(255),
  goalId: z.string().cuid('Invalid Goal ID'),
  estimatedTimeInHours: z.coerce
    .number()
    .positive('Must be a positive number')
    .optional(),
});
// You would create other schemas here as you build more features
// export const updateGoalSchema = ...
// export const createTaskSchema = ...

export const sessionSummarySchema = z.object({
  vibe: z.string(),
  noteAccomplished: z.string().optional(),
  noteNextStep: z.string().optional(),
  artifactUrl: z
    .string()
    .url({ message: 'Please enter a valid URL.' })
    .optional()
    .or(z.literal('')),
});
