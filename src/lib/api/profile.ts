import type { User } from '@/types';
import { getAuthHeaders } from '@/lib/auth/token-storage';

const API_BASE_URL = '/api/profile';

type ApiUserResponse = {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  mobilePhone?: string | null;
  country?: string | null;
  city?: string | null;
  address?: string | null;
  createdAt: string | null;
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
  mobilePhone: user.mobilePhone || undefined,
  country: user.country || undefined,
  city: user.city || undefined,
  address: user.address || undefined,
  createdAt: user.createdAt || undefined,
});

export async function fetchProfile(): Promise<User> {
  if (typeof window === 'undefined') {
    throw new Error('fetchProfile can only be called on the client');
  }

  const response = await fetch(API_BASE_URL, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });

  const data = await handleResponse<ApiUserResponse>(response);
  return mapApiUser(data);
}

export interface UpdateProfilePayload {
  firstname: string;
  lastname: string;
  email: string;
  mobilePhone?: string | null;
  country?: string | null;
  city?: string | null;
  address?: string | null;
}

export async function updateProfile(
  payload: UpdateProfilePayload
): Promise<User> {
  if (typeof window === 'undefined') {
    throw new Error('updateProfile can only be called on the client');
  }

  const response = await fetch(API_BASE_URL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  const data = await handleResponse<ApiUserResponse>(response);
  return mapApiUser(data);
}
