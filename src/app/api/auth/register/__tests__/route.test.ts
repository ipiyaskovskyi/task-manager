import { POST } from '../route';
import { User } from '@/lib/models';
import { sequelize } from '@/lib/db/sequelize';
import { NextRequest } from 'next/server';
import type { RequestInit as NextRequestInit } from 'next/dist/server/web/spec-extension/request';

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

describe('POST /api/auth/register', () => {
  it('should return 201 and create user when data is valid', async () => {
    const req = createMockRequest('POST', '/api/auth/register', {
      firstname: 'John',
      lastname: 'Doe',
      email: 'john@example.com',
      password: 'password123',
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe('john@example.com');
    expect(data.user.firstname).toBe('John');
    expect(data.user.lastname).toBe('Doe');
    expect(data.token).toBeDefined();
    expect(data.user.password).toBeUndefined();
  });

  it('should return 409 when email already exists', async () => {
    await User.create({
      firstname: 'Existing',
      lastname: 'User',
      email: 'existing@example.com',
      password: 'password123',
    });

    const req = createMockRequest('POST', '/api/auth/register', {
      firstname: 'New',
      lastname: 'User',
      email: 'existing@example.com',
      password: 'password123',
    });

    const response = await POST(req);
    expect(response.status).toBe(409);
  });

  it('should return 400 when firstname is missing', async () => {
    const req = createMockRequest('POST', '/api/auth/register', {
      lastname: 'Doe',
      email: 'john@example.com',
      password: 'password123',
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('should return 400 when lastname is missing', async () => {
    const req = createMockRequest('POST', '/api/auth/register', {
      firstname: 'John',
      email: 'john@example.com',
      password: 'password123',
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('should return 400 when email is missing', async () => {
    const req = createMockRequest('POST', '/api/auth/register', {
      firstname: 'John',
      lastname: 'Doe',
      password: 'password123',
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('should return 400 when password is missing', async () => {
    const req = createMockRequest('POST', '/api/auth/register', {
      firstname: 'John',
      lastname: 'Doe',
      email: 'john@example.com',
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('should return 400 when firstname is too short', async () => {
    const req = createMockRequest('POST', '/api/auth/register', {
      firstname: 'J',
      lastname: 'Doe',
      email: 'john@example.com',
      password: 'password123',
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('should return 400 when password is too short', async () => {
    const req = createMockRequest('POST', '/api/auth/register', {
      firstname: 'John',
      lastname: 'Doe',
      email: 'john@example.com',
      password: '12345',
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('should return 400 when email format is invalid', async () => {
    const req = createMockRequest('POST', '/api/auth/register', {
      firstname: 'John',
      lastname: 'Doe',
      email: 'invalid-email',
      password: 'password123',
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('should accept optional fields', async () => {
    const req = createMockRequest('POST', '/api/auth/register', {
      firstname: 'John',
      lastname: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      mobilePhone: '+1234567890',
      country: 'USA',
      city: 'New York',
      address: '123 Main St',
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.user.mobilePhone).toBe('+1234567890');
    expect(data.user.country).toBe('USA');
    expect(data.user.city).toBe('New York');
    expect(data.user.address).toBe('123 Main St');
  });

  it('should return 400 when mobile phone format is invalid', async () => {
    const req = createMockRequest('POST', '/api/auth/register', {
      firstname: 'John',
      lastname: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      mobilePhone: 'invalid-phone',
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });
});
