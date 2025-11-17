import { z } from 'zod';

export const taskFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required and must be a non-empty string')
    .max(200, 'Title must not exceed 200 characters')
    .refine((val) => val.trim().length > 0, {
      message: 'Title is required and must be a non-empty string',
    }),
  description: z
    .string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional()
    .default(''),
  type: z.enum(['Task', 'Subtask', 'Bug', 'Story', 'Epic'] as const),
  status: z.enum(['todo', 'in_progress', 'review', 'done'] as const),
  priority: z.enum(['low', 'medium', 'high', 'urgent'] as const),
  deadline: z
    .string()
    .optional()
    .refine(
      (date) => {
        if (!date || date.trim() === '') return true;
        const deadlineDate = new Date(date);
        if (isNaN(deadlineDate.getTime())) return false;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return deadlineDate >= now;
      },
      { message: 'Deadline cannot be in the past' }
    )
    .default(''),
});

export type TaskFormSchema = z.infer<typeof taskFormSchema>;
