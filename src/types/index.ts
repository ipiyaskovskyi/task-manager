export type Status = 'todo' | 'in_progress' | 'review' | 'done';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskType = 'Task' | 'Subtask' | 'Bug' | 'Story' | 'Epic';

export interface User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  mobilePhone?: string | null;
  country?: string | null;
  city?: string | null;
  address?: string | null;
  createdAt?: Date | string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  type: TaskType;
  status: Status;
  priority: Priority;
  createdAt: Date;
  deadline?: Date;
  assignee?: User | null;
}
