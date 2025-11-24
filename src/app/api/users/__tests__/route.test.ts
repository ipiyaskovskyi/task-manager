import { GET } from '../route';
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
  includeAuth = true
): NextRequest {
  const fullUrl = `http://localhost:3000${url}`;
  const headers = new Headers();
  if (includeAuth && authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }
  const requestInit: NextRequestInit = {
    method,
    headers,
  };
  const request = new NextRequest(fullUrl, requestInit);
  return request;
}

describe('GET /api/users', () => {
  it('should return 200 and list of users when authenticated', async () => {
    await User.create({
      firstname: 'User',
      lastname: 'One',
      email: 'user1@example.com',
      password: 'password123',
    });

    await User.create({
      firstname: 'User',
      lastname: 'Two',
      email: 'user2@example.com',
      password: 'password123',
    });

    const req = createMockRequest('GET', '/api/users');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(3);
    expect(data[0].password).toBeUndefined();
    expect(data[0].id).toBeDefined();
    expect(data[0].email).toBeDefined();
  });

  it('should not include password in response', async () => {
    const req = createMockRequest('GET', '/api/users');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    data.forEach((user: User) => {
      expect(user.password).toBeUndefined();
    });
  });

  it('should return 401 when not authenticated', async () => {
    const req = createMockRequest('GET', '/api/users', false);
    const response = await GET(req);

    expect(response.status).toBe(401);
  });

  it('should return users ordered by createdAt DESC', async () => {
    const user1 = await User.create({
      firstname: 'First',
      lastname: 'User',
      email: 'first@example.com',
      password: 'password123',
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    const user2 = await User.create({
      firstname: 'Second',
      lastname: 'User',
      email: 'second@example.com',
      password: 'password123',
    });

    const req = createMockRequest('GET', '/api/users');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    const secondUserIndex = data.findIndex((u: User) => u.id === user2.id);
    const firstUserIndex = data.findIndex((u: User) => u.id === user1.id);
    expect(secondUserIndex).toBeLessThan(firstUserIndex);
  });
});
