import { saveToken } from '../auth/token-storage';

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

export interface UserResponse {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  mobilePhone?: string | null;
  country?: string | null;
  city?: string | null;
  address?: string | null;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  if (typeof window === 'undefined') {
    throw new Error('login can only be called on the client');
  }

  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const authResponse = await handleResponse<AuthResponse>(response);
  if (authResponse.token) {
    saveToken(authResponse.token);
  }
  return authResponse;
}

export async function register(
  payload: RegisterPayload
): Promise<AuthResponse> {
  if (typeof window === 'undefined') {
    throw new Error('register can only be called on the client');
  }

  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const authResponse = await handleResponse<AuthResponse>(response);
  if (authResponse.token) {
    saveToken(authResponse.token);
  }
  return authResponse;
}
