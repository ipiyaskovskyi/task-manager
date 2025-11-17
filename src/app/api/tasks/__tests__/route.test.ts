import { GET, POST } from '../route';
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

describe('GET /api/tasks', () => {
  it('should return empty array when no tasks exist', async () => {
    const req = createMockRequest('GET', '/api/tasks');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data) || (data && Array.isArray(data.tasks))).toBe(
      true
    );
    const tasks = Array.isArray(data) ? data : data.tasks;
    expect(tasks).toEqual([]);
  });

  it('should return all tasks with assignee information', async () => {
    if (!testUser) {
      throw new Error('Test user not created');
    }

    const task1 = await Task.create({
      title: 'Task 1',
      description: 'Description 1',
      status: 'todo',
      priority: 'high',
      assigneeId: testUser.id,
    });

    const task2 = await Task.create({
      title: 'Task 2',
      description: 'Description 2',
      status: 'in_progress',
      priority: 'medium',
    });

    const req = createMockRequest('GET', '/api/tasks');
    const response = await GET(req);
    const responseData = await response.json();

    expect(response.status).toBe(200);
    const data = Array.isArray(responseData)
      ? responseData
      : responseData.tasks;
    expect(data).toHaveLength(2);

    const task1Response = data.find((t: { id: number }) => t.id === task1.id);
    expect(task1Response).toBeDefined();
    if (task1Response) {
      expect(task1Response.title).toBe('Task 1');
      expect(task1Response.assignee).toBeDefined();
      if (task1Response.assignee && testUser) {
        expect(task1Response.assignee.id).toBe(testUser.id);
        expect(task1Response.assignee.firstname).toBe('Test');
        expect(task1Response.assignee.lastname).toBe('User');
      }
    }

    const task2Response = data.find((t: { id: number }) => t.id === task2.id);
    expect(task2Response).toBeDefined();
    if (task2Response) {
      expect(task2Response.title).toBe('Task 2');
      expect(task2Response.assignee).toBeNull();
    }
  });
});

describe('POST /api/tasks', () => {
  it('should return 400 when title is missing', async () => {
    const req = createMockRequest('POST', '/api/tasks', {
      description: 'Some description',
      status: 'todo',
      priority: 'high',
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Title is required and must be a non-empty string');
  });

  it('should return 400 when title is empty string', async () => {
    const req = createMockRequest('POST', '/api/tasks', {
      title: '   ',
      description: 'Some description',
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Title is required and must be a non-empty string');
  });

  it('should return 400 when deadline is in the past', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const req = createMockRequest('POST', '/api/tasks', {
      title: 'Test Task',
      deadline: yesterday.toISOString(),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Deadline cannot be in the past');
  });

  it('should create task successfully (201)', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const req = createMockRequest('POST', '/api/tasks', {
      title: 'New Task',
      description: 'Task description',
      status: 'todo',
      priority: 'high',
      deadline: tomorrow.toISOString(),
    });

    const response = await POST(req);
    const responseData = await response.json();
    const data = responseData.data || responseData;

    expect(response.status).toBe(201);
    expect(data.id).toBeDefined();
    expect(data.title).toBe('New Task');
    expect(data.description).toBe('Task description');
    expect(data.status).toBe('todo');
    expect(data.priority).toBe('high');
    expect(data.assignee).toBeNull();
    expect(data.createdAt).toBeDefined();
  });

  it('should use default values when optional fields are not provided', async () => {
    const req = createMockRequest('POST', '/api/tasks', {
      title: 'Minimal Task',
    });

    const response = await POST(req);
    const responseData = await response.json();
    const data = responseData.data || responseData;

    expect(response.status).toBe(201);
    expect(data.title).toBe('Minimal Task');
    expect(data.status).toBe('todo');
    expect(data.priority).toBe('medium');
    expect(data.description).toBeNull();
    expect(data.deadline).toBeNull();
    expect(data.assigneeId).toBeNull();
  });
});
