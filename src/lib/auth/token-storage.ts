const TOKEN_KEY = 'auth_token';

let tokenCache: string | null = null;
let isInitialized = false;

function initializeToken(): void {
  if (typeof window !== 'undefined' && !isInitialized) {
    try {
      tokenCache = localStorage.getItem(TOKEN_KEY);
      isInitialized = true;
    } catch {
      tokenCache = null;
      isInitialized = true;
    }
  }
}

export function saveToken(token: string): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      tokenCache = token;
      isInitialized = true;
    } catch {
      tokenCache = null;
    }
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  if (!isInitialized) {
    initializeToken();
  }
  return tokenCache;
}

export function removeToken(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(TOKEN_KEY);
      tokenCache = null;
      isInitialized = true;
    } catch {
      tokenCache = null;
    }
  }
}

export function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') {
    return {};
  }
  if (!isInitialized) {
    initializeToken();
  }
  if (tokenCache) {
    return {
      Authorization: `Bearer ${tokenCache}`,
    };
  }
  return {};
}
