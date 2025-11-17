import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth/jwt';
import { UnauthorizedError } from '@/lib/errors';
import { errorResponse } from '@/lib/utils/api-response';

export async function authenticateRequest(
  request: NextRequest
): Promise<{ userId: number; email: string } | null> {
  const authHeader = request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  return payload;
}

export async function requireAuth(
  request: NextRequest
): Promise<NextResponse | null> {
  const authResult = await authenticateRequest(request);

  if (!authResult) {
    return errorResponse(new UnauthorizedError('Authentication required'), 401);
  }

  return null;
}
