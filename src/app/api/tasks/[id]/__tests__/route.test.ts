import { GET, PUT, DELETE } from '../route';
import { Task, User } from '@/lib/models';
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
  await Task.destroy({ where: {} });
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

describe('GET /api/tasks/[id]', () => {
  it('should return 200 and task when task exists', async () => {
    if (!testUser) {
      throw new Error('Test user not created');
    }

    const task = await Task.create({
      title: 'Test Task',
      description: 'Test Description',
      status: 'todo',
      priority: 'high',
      assigneeId: testUser.id,
    });

    const req = createMockRequest('GET', `/api/tasks/${task.id}`);
    const response = await GET(req, {
      params: Promise.resolve({ id: task.id.toString() }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe(task.id);
    expect(data.title).toBe('Test Task');
    expect(data.assignee).toBeDefined();
  });

  it('should return 404 when task does not exist', async () => {
    const req = createMockRequest('GET', '/api/tasks/99999');
    const response = await GET(req, {
      params: Promise.resolve({ id: '99999' }),
    });

    expect(response.status).toBe(404);
  });

  it('should return 401 when not authenticated', async () => {
    const req = createMockRequest('GET', '/api/tasks/1', undefined, false);
    const response = await GET(req, {
      params: Promise.resolve({ id: '1' }),
    });

    expect(response.status).toBe(401);
  });

  it('should return 400 when id is invalid', async () => {
    const req = createMockRequest('GET', '/api/tasks/invalid');
    const response = await GET(req, {
      params: Promise.resolve({ id: 'invalid' }),
    });

    expect(response.status).toBe(400);
  });
});

describe('PUT /api/tasks/[id]', () => {
  it('should return 200 and update task when data is valid', async () => {
    const task = await Task.create({
      title: 'Original Title',
      description: 'Original Description',
      status: 'todo',
      priority: 'medium',
    });

    const req = createMockRequest('PUT', `/api/tasks/${task.id}`, {
      title: 'Updated Title',
      status: 'in_progress',
      priority: 'high',
    });

    const response = await PUT(req, {
      params: Promise.resolve({ id: task.id.toString() }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.title).toBe('Updated Title');
    expect(data.status).toBe('in_progress');
    expect(data.priority).toBe('high');
  });

  it('should return 404 when task does not exist', async () => {
    const req = createMockRequest('PUT', '/api/tasks/99999', {
      title: 'Updated Title',
    });

    const response = await PUT(req, {
      params: Promise.resolve({ id: '99999' }),
    });

    expect(response.status).toBe(404);
  });

  it('should return 400 when status is invalid', async () => {
    const task = await Task.create({
      title: 'Test Task',
      status: 'todo',
      priority: 'medium',
    });

    const req = createMockRequest('PUT', `/api/tasks/${task.id}`, {
      status: 'invalid_status',
    });

    const response = await PUT(req, {
      params: Promise.resolve({ id: task.id.toString() }),
    });

    expect(response.status).toBe(400);
  });

  it('should return 404 when assignee does not exist', async () => {
    const task = await Task.create({
      title: 'Test Task',
      status: 'todo',
      priority: 'medium',
    });

    const req = createMockRequest('PUT', `/api/tasks/${task.id}`, {
      assigneeId: 99999,
    });

    const response = await PUT(req, {
      params: Promise.resolve({ id: task.id.toString() }),
    });

    expect(response.status).toBe(404);
  });

  it('should return 400 when deadline is in the past', async () => {
    const task = await Task.create({
      title: 'Test Task',
      status: 'todo',
      priority: 'medium',
    });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const req = createMockRequest('PUT', `/api/tasks/${task.id}`, {
      deadline: yesterday.toISOString(),
    });

    const response = await PUT(req, {
      params: Promise.resolve({ id: task.id.toString() }),
    });

    expect(response.status).toBe(400);
  });

  it('should allow partial updates', async () => {
    const task = await Task.create({
      title: 'Original Title',
      description: 'Original Description',
      status: 'todo',
      priority: 'medium',
    });

    const req = createMockRequest('PUT', `/api/tasks/${task.id}`, {
      title: 'Updated Title',
    });

    const response = await PUT(req, {
      params: Promise.resolve({ id: task.id.toString() }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.title).toBe('Updated Title');
    expect(data.description).toBe('Original Description');
  });
});

describe('DELETE /api/tasks/[id]', () => {
  it('should return 204 when task is deleted', async () => {
    const task = await Task.create({
      title: 'Task to Delete',
      status: 'todo',
      priority: 'medium',
    });

    const req = createMockRequest('DELETE', `/api/tasks/${task.id}`);
    const response = await DELETE(req, {
      params: Promise.resolve({ id: task.id.toString() }),
    });

    expect(response.status).toBe(204);

    const deletedTask = await Task.findByPk(task.id);
    expect(deletedTask).toBeNull();
  });

  it('should return 404 when task does not exist', async () => {
    const req = createMockRequest('DELETE', '/api/tasks/99999');
    const response = await DELETE(req, {
      params: Promise.resolve({ id: '99999' }),
    });

    expect(response.status).toBe(404);
  });

  it('should return 401 when not authenticated', async () => {
    const req = createMockRequest('DELETE', '/api/tasks/1', undefined, false);
    const response = await DELETE(req, {
      params: Promise.resolve({ id: '1' }),
    });

    expect(response.status).toBe(401);
  });
});
