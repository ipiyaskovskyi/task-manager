import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 100;

export function rateLimit(request: NextRequest): NextResponse | null {
  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const now = Date.now();
  const key = `rate-limit:${ip}`;

  if (!store[key] || store[key].resetTime < now) {
    store[key] = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    };
    return null;
  }

  store[key].count++;

  if (store[key].count > RATE_LIMIT_MAX_REQUESTS) {
    return NextResponse.json(
      {
        error: 'Too many requests, please try again later',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((store[key].resetTime - now) / 1000)),
          'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
          'X-RateLimit-Remaining': String(
            Math.max(0, RATE_LIMIT_MAX_REQUESTS - store[key].count)
          ),
          'X-RateLimit-Reset': String(store[key].resetTime),
        },
      }
    );
  }

  return null;
}

export function getRateLimitHeaders(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const key = `rate-limit:${ip}`;
  const limit = store[key];

  if (!limit) {
    return {
      'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
      'X-RateLimit-Remaining': String(RATE_LIMIT_MAX_REQUESTS),
    };
  }

  return {
    'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
    'X-RateLimit-Remaining': String(
      Math.max(0, RATE_LIMIT_MAX_REQUESTS - limit.count)
    ),
    'X-RateLimit-Reset': String(limit.resetTime),
  };
}
