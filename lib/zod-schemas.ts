import { z } from 'zod';

export const createGoalSchema = z.object({
  title: z
    .string()
    .min(1, { message: 'Title is required.' })
    .max(100, { message: 'Title must be 100 characters or less.' }),

  description: z
    .string()
    .max(500, { message: 'Description must be 500 characters or less.' })
    .optional(),

  parentId: z
    .string()
    .cuid({ message: 'Invalid parent ID format.' })
    .optional(),

  // Use z.coerce.date() to safely handle date strings from JSON
  deadline: z.coerce.date().optional(),

  // This is the crucial field for backend validation.
  // It ensures that if the frontend sends the estimate, it's a valid number.
  estimatedTimeSeconds: z.number().int().positive().optional(),
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
