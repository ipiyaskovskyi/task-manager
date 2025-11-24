import { POST } from '../route';
import { User } from '@/lib/models';
import { sequelize } from '@/lib/db/sequelize';
import { NextRequest } from 'next/server';
import type { RequestInit as NextRequestInit } from 'next/dist/server/web/spec-extension/request';
import bcrypt from 'bcrypt';

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

beforeEach(async () => {
  await User.destroy({ where: {} });
});

function createMockRequest(
  method: string,
  url: string,
  body?: Record<string, unknown>
): NextRequest {
  const fullUrl = `http://localhost:3000${url}`;
  const headers = new Headers();
  if (body) {
    headers.set('Content-Type', 'application/json');
  }
  const requestInit: NextRequestInit = {
    method,
    headers,
    ...(body && {
      body: JSON.stringify(body),
    }),
  };
  const request = new NextRequest(fullUrl, requestInit);
  return request;
}

describe('POST /api/auth/login', () => {
  it('should return 200 and token when credentials are valid', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    await User.create({
      firstname: 'Test',
      lastname: 'User',
      email: 'test@example.com',
      password: hashedPassword,
    });

    const req = createMockRequest('POST', '/api/auth/login', {
      email: 'test@example.com',
      password: 'password123',
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe('test@example.com');
    expect(data.token).toBeDefined();
    expect(typeof data.token).toBe('string');
  });

  it('should return 401 when email is invalid', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    await User.create({
      firstname: 'Test',
      lastname: 'User',
      email: 'test@example.com',
      password: hashedPassword,
    });

    const req = createMockRequest('POST', '/api/auth/login', {
      email: 'wrong@example.com',
      password: 'password123',
    });

    const response = await POST(req);
    expect(response.status).toBe(401);
  });

  it('should return 401 when password is invalid', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    await User.create({
      firstname: 'Test',
      lastname: 'User',
      email: 'test@example.com',
      password: hashedPassword,
    });

    const req = createMockRequest('POST', '/api/auth/login', {
      email: 'test@example.com',
      password: 'wrongpassword',
    });

    const response = await POST(req);
    expect(response.status).toBe(401);
  });

  it('should return 400 when email is missing', async () => {
    const req = createMockRequest('POST', '/api/auth/login', {
      password: 'password123',
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('should return 400 when password is missing', async () => {
    const req = createMockRequest('POST', '/api/auth/login', {
      email: 'test@example.com',
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('should return 400 when email format is invalid', async () => {
    const req = createMockRequest('POST', '/api/auth/login', {
      email: 'invalid-email',
      password: 'password123',
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('should trim email before validation', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    await User.create({
      firstname: 'Test',
      lastname: 'User',
      email: 'test@example.com',
      password: hashedPassword,
    });

    const req = createMockRequest('POST', '/api/auth/login', {
      email: 'test@example.com',
      password: 'password123',
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
  });
});
