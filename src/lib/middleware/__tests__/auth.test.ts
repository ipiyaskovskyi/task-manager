import { authenticateRequest, requireAuth } from '../auth';
import { NextRequest } from 'next/server';
import type { RequestInit as NextRequestInit } from 'next/dist/server/web/spec-extension/request';
import { generateToken } from '@/lib/auth/jwt';
import { User } from '@/lib/models';
import { sequelize } from '@/lib/db/sequelize';

beforeAll(async () => {
  try {
    await sequelize.authenticate();
  } catch (error) {
    console.error('Database authentication failed:', error);
  }
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

function createMockRequest(
  method: string,
  url: string,
  headers?: Record<string, string>
): NextRequest {
  const fullUrl = `http://localhost:3000${url}`;
  const requestHeaders = new Headers();
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      requestHeaders.set(key, value);
    });
  }
  const requestInit: NextRequestInit = {
    method,
    headers: requestHeaders,
  };
  return new NextRequest(fullUrl, requestInit);
}

describe('Auth middleware', () => {
  let testUser: User;
  let validToken: string;

  beforeAll(async () => {
    testUser = await User.create({
      firstname: 'Test',
      lastname: 'User',
      email: 'test@example.com',
      password: 'password123',
    });

    validToken = generateToken({
      id: testUser.id,
      firstname: testUser.firstname,
      lastname: testUser.lastname,
      email: testUser.email,
      createdAt: testUser.createdAt,
      updatedAt: testUser.updatedAt,
    });
  });

  describe('authenticateRequest', () => {
    it('should return user data when token is valid', async () => {
      const req = createMockRequest('GET', '/api/test', {
        Authorization: `Bearer ${validToken}`,
      });

      const result = await authenticateRequest(req);

      expect(result).toBeDefined();
      expect(result?.userId).toBe(testUser.id);
      expect(result?.email).toBe(testUser.email);
    });

    it('should return null when Authorization header is missing', async () => {
      const req = createMockRequest('GET', '/api/test');

      const result = await authenticateRequest(req);

      expect(result).toBeNull();
    });

    it('should return null when token is invalid', async () => {
      const req = createMockRequest('GET', '/api/test', {
        Authorization: 'Bearer invalid-token',
      });

      const result = await authenticateRequest(req);

      expect(result).toBeNull();
    });

    it('should return null when token format is wrong', async () => {
      const req = createMockRequest('GET', '/api/test', {
        Authorization: 'Token some-token',
      });

      const result = await authenticateRequest(req);

      expect(result).toBeNull();
    });

    it('should return null when Bearer prefix is missing', async () => {
      const req = createMockRequest('GET', '/api/test', {
        Authorization: validToken,
      });

      const result = await authenticateRequest(req);

      expect(result).toBeNull();
    });
  });

  describe('requireAuth', () => {
    it('should return null when authentication is successful', async () => {
      const req = createMockRequest('GET', '/api/test', {
        Authorization: `Bearer ${validToken}`,
      });

      const result = await requireAuth(req);

      expect(result).toBeNull();
    });

    it('should return error response when token is missing', async () => {
      const req = createMockRequest('GET', '/api/test');

      const result = await requireAuth(req);

      expect(result).toBeDefined();
      expect(result?.status).toBe(401);
      const json = await result?.json();
      expect(json.error).toBeDefined();
    });

    it('should return error response when token is invalid', async () => {
      const req = createMockRequest('GET', '/api/test', {
        Authorization: 'Bearer invalid-token',
      });

      const result = await requireAuth(req);

      expect(result).toBeDefined();
      expect(result?.status).toBe(401);
    });
  });
});
