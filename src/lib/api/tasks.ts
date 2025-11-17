import type { Task, Status, Priority } from '@/types';
import { getAuthHeaders } from '@/lib/auth/token-storage';

const API_BASE_URL = '/api/tasks';

type ApiTask = {
  id: number;
  title: string;
  description?: string | null;
  type?: string | null;
  status: Status;
  priority?: Priority | null;
  deadline?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type ApiTaskResponse = ApiTask & {
  assignee?: {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
  } | null;
};

const mapApiTask = (task: ApiTaskResponse): Task => ({
  id: task.id,
  title: task.title,
  description: task.description ?? undefined,
  type: (task.type as 'Task' | 'Subtask' | 'Bug' | 'Story' | 'Epic') || 'Task',
  status: task.status,
  priority: task.priority ?? 'medium',
  createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
  deadline: task.deadline ? new Date(task.deadline) : undefined,
  assignee: task.assignee
    ? {
        id: task.assignee.id,
        firstname: task.assignee.firstname,
        lastname: task.assignee.lastname,
        email: task.assignee.email,
      }
    : null,
});

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = 'Request failed';
    try {
      const errorBody = await response.json();
      if (errorBody?.error) {
        message = errorBody.error;
      }
    } catch {}
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export interface TaskFilters {
  status?: Status | '';
  priority?: string | '';
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedTasksResponse {
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export async function fetchTasks(
  filters?: TaskFilters
): Promise<Task[] | PaginatedTasksResponse> {
  const queryParams = new URLSearchParams();

  if (filters) {
    if (filters.status) {
      queryParams.append('status', filters.status);
    }
    if (filters.priority) {
      queryParams.append('priority', filters.priority);
    }
    if (filters.createdFrom) {
      queryParams.append('createdFrom', filters.createdFrom);
    }
    if (filters.createdTo) {
      queryParams.append('createdTo', filters.createdTo);
    }
    if (filters.page) {
      queryParams.append('page', String(filters.page));
    }
    if (filters.limit) {
      queryParams.append('limit', String(filters.limit));
    }
  }

  const url = queryParams.toString()
    ? `${API_BASE_URL}?${queryParams.toString()}`
    : API_BASE_URL;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  const data = await handleResponse<
    ApiTaskResponse[] | { tasks: ApiTaskResponse[]; pagination: unknown }
  >(response);

  if (Array.isArray(data)) {
    return data.map(mapApiTask);
  }

  if (
    data &&
    typeof data === 'object' &&
    'tasks' in data &&
    'pagination' in data &&
    Array.isArray(data.tasks)
  ) {
    const paginatedData = data as {
      tasks: ApiTaskResponse[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    };

    return {
      tasks: paginatedData.tasks.map(mapApiTask),
      pagination: paginatedData.pagination,
    };
  }

  console.error('Invalid response format:', data);
  throw new Error(
    'Invalid response format from API: expected array or paginated object'
  );
}

export async function fetchTaskById(id: number): Promise<Task> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  const data = await handleResponse<ApiTaskResponse>(response);
  return mapApiTask(data);
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  type?: string;
  status: Status;
  priority: Priority;
  deadline?: string;
}

const buildTaskBody = (payload: Partial<CreateTaskPayload>) => {
  const body: Record<string, unknown> = {};

  if (payload.title !== undefined) {
    body.title = payload.title;
  }

  if (payload.description !== undefined) {
    body.description = payload.description || null;
  }

  if (payload.type !== undefined) {
    body.type = payload.type || null;
  }

  if (payload.status !== undefined) {
    body.status = payload.status;
  }

  if (payload.priority !== undefined) {
    body.priority = payload.priority;
  }

  if (payload.deadline !== undefined) {
    if (
      !payload.deadline ||
      (typeof payload.deadline === 'string' && payload.deadline.trim() === '')
    ) {
      body.deadline = null;
    } else {
      if (
        typeof payload.deadline === 'string' &&
        payload.deadline.includes('T')
      ) {
        body.deadline = payload.deadline;
      } else {
        body.deadline = new Date(payload.deadline).toISOString();
      }
    }
  }

  return body;
};

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(buildTaskBody(payload)),
  });

  const data = await handleResponse<ApiTaskResponse>(response);
  return mapApiTask(data);
}

export async function updateTask(
  id: number,
  payload: Partial<CreateTaskPayload>
): Promise<Task> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(buildTaskBody(payload)),
  });

  const data = await handleResponse<ApiTaskResponse>(response);
  return mapApiTask(data);
}

export async function deleteTask(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    let message = 'Failed to delete task';
    try {
      const errorBody = await response.json();
      if (errorBody?.error) {
        message = errorBody.error;
      }
    } catch {}
    throw new Error(message);
  }
}
