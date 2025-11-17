import { z } from 'zod';

export const taskStatusSchema = z.enum([
  'todo',
  'in_progress',
  'review',
  'done',
]);
export const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);
export const taskTypeSchema = z.enum([
  'Task',
  'Subtask',
  'Bug',
  'Story',
  'Epic',
]);

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required and must be a non-empty string')
    .trim()
    .refine((val) => val.length > 0, {
      message: 'Title is required and must be a non-empty string',
    }),
  description: z.string().optional().nullable(),
  type: taskTypeSchema.optional().nullable(),
  status: taskStatusSchema.optional().default('todo'),
  priority: taskPrioritySchema.optional().default('medium'),
  deadline: z
    .union([z.string(), z.date()])
    .optional()
    .nullable()
    .transform((date) => {
      if (!date || (typeof date === 'string' && date.trim() === '')) {
        return null;
      }
      return date instanceof Date ? date : new Date(date);
    })
    .refine(
      (date) => {
        if (!date) return true;
        const deadlineDate = date instanceof Date ? date : new Date(date);
        if (isNaN(deadlineDate.getTime())) return false;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return deadlineDate >= now;
      },
      { message: 'Deadline cannot be in the past' }
    ),
  assigneeId: z.number().int().positive().optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required and must be a non-empty string')
    .trim()
    .refine((val) => val.length > 0, {
      message: 'Title is required and must be a non-empty string',
    })
    .optional(),
  description: z.string().optional().nullable(),
  type: taskTypeSchema.optional().nullable(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  deadline: z
    .union([z.string(), z.date()])
    .optional()
    .nullable()
    .transform((date) => {
      if (!date || (typeof date === 'string' && date.trim() === '')) {
        return null;
      }
      return date instanceof Date ? date : new Date(date);
    })
    .refine(
      (date) => {
        if (!date) return true;
        const deadlineDate = date instanceof Date ? date : new Date(date);
        if (isNaN(deadlineDate.getTime())) return false;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return deadlineDate >= now;
      },
      { message: 'Deadline cannot be in the past' }
    ),
  assigneeId: z.number().int().positive().optional().nullable(),
});

export const taskParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const taskQuerySchema = z.object({
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  createdFrom: z
    .string()
    .optional()
    .refine(
      (date) => {
        if (!date) return true;
        const dateObj = new Date(date);
        return !isNaN(dateObj.getTime());
      },
      { message: 'Invalid date format for createdFrom' }
    ),
  createdTo: z
    .string()
    .optional()
    .refine(
      (date) => {
        if (!date) return true;
        const dateObj = new Date(date);
        return !isNaN(dateObj.getTime());
      },
      { message: 'Invalid date format for createdTo' }
    ),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});
