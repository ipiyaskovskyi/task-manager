import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getRateLimitHeaders } from './rate-limit';
import { handleCORS, addCORSHeaders } from './cors';
import { addSecurityHeaders } from './security-headers';

export async function applySecurityMiddleware(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const corsResponse = handleCORS(request);
  if (corsResponse) {
    return addSecurityHeaders(corsResponse);
  }

  const rateLimitResponse = rateLimit(request);
  if (rateLimitResponse) {
    return addSecurityHeaders(rateLimitResponse);
  }

  const response = await handler(request);
  const responseWithCORS = addCORSHeaders(response, request);
  const responseWithSecurity = addSecurityHeaders(responseWithCORS);

  const rateLimitHeaders = getRateLimitHeaders(request);
  Object.entries(rateLimitHeaders).forEach(([key, value]) => {
    responseWithSecurity.headers.set(key, value);
  });

  return responseWithSecurity;
}
