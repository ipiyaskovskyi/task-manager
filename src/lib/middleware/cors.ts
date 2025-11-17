import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = (
  process.env.CORS_ORIGINS || 'http://localhost:3000'
).split(',');

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'Accept',
];

export function handleCORS(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin');

  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });

    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    response.headers.set(
      'Access-Control-Allow-Methods',
      ALLOWED_METHODS.join(', ')
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      ALLOWED_HEADERS.join(', ')
    );
    response.headers.set('Access-Control-Max-Age', '86400');

    return response;
  }

  return null;
}

export function addCORSHeaders(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  const origin = request.headers.get('origin');

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  response.headers.set(
    'Access-Control-Allow-Methods',
    ALLOWED_METHODS.join(', ')
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    ALLOWED_HEADERS.join(', ')
  );

  return response;
}
