import { PomodoroCycle, SessionVibe, TimerMode } from '@prisma/client';
import { z } from 'zod';

export const createGoalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
  parentId: z.string().optional().nullable(),
  deadline: z.coerce.date().optional().nullable(),
  estimatedTimeSeconds: z.number().int().positive().optional().nullable(),
  color: z.string().startsWith('#').length(7).optional().nullable(),
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
  vibe: z.nativeEnum(SessionVibe).optional(),
  noteAccomplished: z.string().max(10000).optional(),
  noteNextStep: z.string().max(10000).optional(),
  artifactUrl: z
    .string()
    .url({ message: 'Please enter a valid URL.' })
    .optional()
    .or(z.literal('')),
});
