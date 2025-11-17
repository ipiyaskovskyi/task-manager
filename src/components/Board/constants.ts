import type { TaskType, Status, Priority } from '@/types';

export const TASK_TYPES: TaskType[] = [
  'Task',
  'Subtask',
  'Bug',
  'Story',
  'Epic',
];

export const STATUSES: Status[] = ['todo', 'in_progress', 'review', 'done'];

export const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent'];

export const STATUS_LABELS: Record<Status, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};
