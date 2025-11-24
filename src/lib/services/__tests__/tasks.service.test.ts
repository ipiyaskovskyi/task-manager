import { TasksService } from '../tasks.service';
import { Task, User } from '@/lib/models';
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

beforeEach(async () => {
  await Task.destroy({ where: {} });
  await User.destroy({ where: {} });
});

describe('TasksService', () => {
  const tasksService = new TasksService();
  let testUser: User;

  beforeEach(async () => {
    testUser = await User.create({
      firstname: 'Test',
      lastname: 'User',
      email: 'test@example.com',
      password: 'password123',
    });
  });

  describe('createTask', () => {
    it('should create a task with all fields', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const task = await tasksService.createTask({
        title: 'Test Task',
        description: 'Test Description',
        type: 'Task',
        status: 'todo',
        priority: 'high',
        deadline: tomorrow,
        assigneeId: testUser.id,
      });

      expect(task).toBeDefined();
      expect(task?.title).toBe('Test Task');
      expect(task?.description).toBe('Test Description');
      expect(task?.status).toBe('todo');
      expect(task?.priority).toBe('high');
      expect(task?.assigneeId).toBe(testUser.id);
    });

    it('should use default values when optional fields are not provided', async () => {
      const task = await tasksService.createTask({
        title: 'Minimal Task',
      });

      expect(task).toBeDefined();
      expect(task?.title).toBe('Minimal Task');
      expect(task?.status).toBe('todo');
      expect(task?.priority).toBe('medium');
      expect(task?.description).toBeNull();
      expect(task?.deadline).toBeNull();
      expect(task?.assigneeId).toBeNull();
    });
  });

  describe('getTaskById', () => {
    it('should return task with assignee when task exists', async () => {
      const task = await Task.create({
        title: 'Test Task',
        status: 'todo',
        priority: 'medium',
        assigneeId: testUser.id,
      });

      const result = await tasksService.getTaskById(task.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(task.id);
      expect(result?.assignee).toBeDefined();
      expect(result?.assignee?.id).toBe(testUser.id);
    });

    it('should return null when task does not exist', async () => {
      const result = await tasksService.getTaskById(99999);
      expect(result).toBeNull();
    });
  });

  describe('getAllTasks', () => {
    it('should return all tasks when no filters are provided', async () => {
      await Task.create({
        title: 'Task 1',
        status: 'todo',
        priority: 'medium',
      });
      await Task.create({
        title: 'Task 2',
        status: 'in_progress',
        priority: 'high',
      });

      const tasks = await tasksService.getAllTasks();

      expect(Array.isArray(tasks)).toBe(true);
      expect((tasks as Task[]).length).toBe(2);
    });

    it('should filter by status', async () => {
      await Task.create({
        title: 'Todo Task',
        status: 'todo',
        priority: 'medium',
      });
      await Task.create({
        title: 'In Progress Task',
        status: 'in_progress',
        priority: 'medium',
      });

      const tasks = await tasksService.getAllTasks({ status: 'todo' });

      expect(Array.isArray(tasks)).toBe(true);
      expect((tasks as Task[]).length).toBe(1);
      expect((tasks as Task[])[0].status).toBe('todo');
    });

    it('should filter by priority', async () => {
      await Task.create({
        title: 'High Priority',
        status: 'todo',
        priority: 'high',
      });
      await Task.create({
        title: 'Low Priority',
        status: 'todo',
        priority: 'low',
      });

      const tasks = await tasksService.getAllTasks({ priority: 'high' });

      expect(Array.isArray(tasks)).toBe(true);
      expect((tasks as Task[]).length).toBe(1);
      expect((tasks as Task[])[0].priority).toBe('high');
    });

    it('should return paginated results when page is provided', async () => {
      for (let i = 1; i <= 25; i++) {
        await Task.create({
          title: `Task ${i}`,
          status: 'todo',
          priority: 'medium',
        });
      }

      const result = await tasksService.getAllTasks({ page: 1, limit: 10 });

      expect('tasks' in result).toBe(true);
      expect('pagination' in result).toBe(true);
      if ('tasks' in result && 'pagination' in result) {
        expect(result.tasks.length).toBe(10);
        expect(result.pagination.total).toBe(25);
        expect(result.pagination.page).toBe(1);
        expect(result.pagination.limit).toBe(10);
        expect(result.pagination.totalPages).toBe(3);
        expect(result.pagination.hasNext).toBe(true);
        expect(result.pagination.hasPrev).toBe(false);
      }
    });
  });

  describe('updateTask', () => {
    it('should update task with new values', async () => {
      const task = await Task.create({
        title: 'Original Title',
        description: 'Original Description',
        status: 'todo',
        priority: 'medium',
      });

      const updated = await tasksService.updateTask(task.id, {
        title: 'Updated Title',
        status: 'in_progress',
        priority: 'high',
      });

      expect(updated).toBeDefined();
      expect(updated?.title).toBe('Updated Title');
      expect(updated?.status).toBe('in_progress');
      expect(updated?.priority).toBe('high');
      expect(updated?.description).toBe('Original Description');
    });

    it('should return null when task does not exist', async () => {
      const result = await tasksService.updateTask(99999, {
        title: 'Updated Title',
      });

      expect(result).toBeNull();
    });

    it('should allow partial updates', async () => {
      const task = await Task.create({
        title: 'Original Title',
        status: 'todo',
        priority: 'medium',
      });

      const updated = await tasksService.updateTask(task.id, {
        title: 'Updated Title',
      });

      expect(updated?.title).toBe('Updated Title');
      expect(updated?.status).toBe('todo');
      expect(updated?.priority).toBe('medium');
    });
  });

  describe('deleteTask', () => {
    it('should delete task and return true', async () => {
      const task = await Task.create({
        title: 'Task to Delete',
        status: 'todo',
        priority: 'medium',
      });

      const result = await tasksService.deleteTask(task.id);

      expect(result).toBe(true);

      const deletedTask = await Task.findByPk(task.id);
      expect(deletedTask).toBeNull();
    });

    it('should return false when task does not exist', async () => {
      const result = await tasksService.deleteTask(99999);
      expect(result).toBe(false);
    });
  });
});
