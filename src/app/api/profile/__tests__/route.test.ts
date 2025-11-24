import { GET, PUT } from '../route';
import { User } from '@/lib/models';
import { sequelize } from '@/lib/db/sequelize';
import { NextRequest } from 'next/server';
import type { RequestInit as NextRequestInit } from 'next/dist/server/web/spec-extension/request';
import { generateToken } from '@/lib/auth/jwt';

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

let testUser: User | null = null;
let authToken: string | null = null;

beforeEach(async () => {
  await User.destroy({ where: {} });

  testUser = await User.create({
    firstname: 'Test',
    lastname: 'User',
    email: 'test@example.com',
    password: 'testpassword',
  });

  authToken = generateToken({
    id: testUser.id,
    firstname: testUser.firstname,
    lastname: testUser.lastname,
    email: testUser.email,
    createdAt: testUser.createdAt,
    updatedAt: testUser.updatedAt,
  });
});

function createMockRequest(
  method: string,
  url: string,
  body?: Record<string, unknown>,
  includeAuth = true
): NextRequest {
  const fullUrl = `http://localhost:3000${url}`;
  const headers = new Headers();
  if (body) {
    headers.set('Content-Type', 'application/json');
  }
  if (includeAuth && authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
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

describe('GET /api/profile', () => {
  it('should return 200 and user profile when authenticated', async () => {
    const req = createMockRequest('GET', '/api/profile');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe(testUser?.id);
    expect(data.email).toBe('test@example.com');
    expect(data.firstname).toBe('Test');
    expect(data.lastname).toBe('User');
    expect(data.password).toBeUndefined();
  });

  it('should return 401 when not authenticated', async () => {
    const req = createMockRequest('GET', '/api/profile', undefined, false);
    const response = await GET(req);

    expect(response.status).toBe(401);
  });

  it('should return 404 when user does not exist', async () => {
    await User.destroy({ where: {} });
    const req = createMockRequest('GET', '/api/profile');
    const response = await GET(req);

    expect(response.status).toBe(404);
  });
});

describe('PUT /api/profile', () => {
  it('should return 200 and update profile when data is valid', async () => {
    const req = createMockRequest('PUT', '/api/profile', {
      firstname: 'Updated',
      lastname: 'Name',
      email: 'updated@example.com',
      mobilePhone: '+1234567890',
      country: 'USA',
      city: 'New York',
      address: '123 Main St',
    });

    const response = await PUT(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.firstname).toBe('Updated');
    expect(data.lastname).toBe('Name');
    expect(data.email).toBe('updated@example.com');
    expect(data.mobilePhone).toBe('+1234567890');
    expect(data.country).toBe('USA');
    expect(data.city).toBe('New York');
    expect(data.address).toBe('123 Main St');
  });

  it('should return 400 when firstname is missing', async () => {
    const req = createMockRequest('PUT', '/api/profile', {
      lastname: 'Name',
      email: 'test@example.com',
    });

    const response = await PUT(req);
    expect(response.status).toBe(400);
  });

  it('should return 400 when email format is invalid', async () => {
    const req = createMockRequest('PUT', '/api/profile', {
      firstname: 'Test',
      lastname: 'User',
      email: 'invalid-email',
    });

    const response = await PUT(req);
    expect(response.status).toBe(400);
  });

  it('should return 400 when email is already in use by another user', async () => {
    await User.create({
      firstname: 'Other',
      lastname: 'User',
      email: 'other@example.com',
      password: 'password123',
    });

    const req = createMockRequest('PUT', '/api/profile', {
      firstname: 'Test',
      lastname: 'User',
      email: 'other@example.com',
    });

    const response = await PUT(req);
    expect(response.status).toBe(400);
  });

  it('should allow updating own email', async () => {
    const req = createMockRequest('PUT', '/api/profile', {
      firstname: 'Test',
      lastname: 'User',
      email: 'test@example.com',
    });

    const response = await PUT(req);
    expect(response.status).toBe(200);
  });

  it('should return 400 when mobile phone format is invalid', async () => {
    const req = createMockRequest('PUT', '/api/profile', {
      firstname: 'Test',
      lastname: 'User',
      email: 'test@example.com',
      mobilePhone: 'invalid-phone',
    });

    const response = await PUT(req);
    expect(response.status).toBe(400);
  });

  it('should return 401 when not authenticated', async () => {
    const req = createMockRequest(
      'PUT',
      '/api/profile',
      {
        firstname: 'Test',
        lastname: 'User',
        email: 'test@example.com',
      },
      false
    );

    const response = await PUT(req);
    expect(response.status).toBe(401);
  });
});
