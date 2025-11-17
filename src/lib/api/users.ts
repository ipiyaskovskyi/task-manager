import type { User } from '@/types';
import { getAuthHeaders } from '@/lib/auth/token-storage';

const API_BASE_URL = '/api/users';

type ApiUserResponse = {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  createdAt: string;
};

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

  const data = await response.json();
  return data.data || data;
}

const mapApiUser = (user: ApiUserResponse): User => ({
  id: user.id,
  firstname: user.firstname,
  lastname: user.lastname,
  email: user.email,
  createdAt: user.createdAt || undefined,
});

export async function fetchUsers(): Promise<User[]> {
  if (typeof window === 'undefined') {
    return [];
  }

  const response = await fetch(API_BASE_URL, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });

  const data = await handleResponse<ApiUserResponse[]>(response);

  if (Array.isArray(data)) {
    return data.map(mapApiUser);
  }

  return [];
}
