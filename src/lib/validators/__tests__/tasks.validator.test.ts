import {
  createTaskSchema,
  updateTaskSchema,
  taskParamsSchema,
  taskQuerySchema,
  taskStatusSchema,
  taskPrioritySchema,
  taskTypeSchema,
} from '../tasks.validator';

describe('Tasks validators', () => {
  describe('createTaskSchema', () => {
    it('should validate valid task data', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const data = {
        title: 'Test Task',
        description: 'Test Description',
        type: 'Task',
        status: 'todo',
        priority: 'high',
        deadline: tomorrow.toISOString(),
        assigneeId: 1,
      };

      const result = createTaskSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should reject when title is missing', () => {
      const data = {
        description: 'Test Description',
      };

      const result = createTaskSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should reject when title is empty string', () => {
      const data = {
        title: '   ',
      };

      const result = createTaskSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should use default status and priority', () => {
      const data = {
        title: 'Test Task',
      };

      const result = createTaskSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('todo');
        expect(result.data.priority).toBe('medium');
      }
    });

    it('should reject invalid status', () => {
      const data = {
        title: 'Test Task',
        status: 'invalid_status',
      };

      const result = createTaskSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should reject invalid priority', () => {
      const data = {
        title: 'Test Task',
        priority: 'invalid_priority',
      };

      const result = createTaskSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should reject deadline in the past', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const data = {
        title: 'Test Task',
        deadline: yesterday.toISOString(),
      };

      const result = createTaskSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should accept deadline in the future', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const data = {
        title: 'Test Task',
        deadline: tomorrow.toISOString(),
      };

      const result = createTaskSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should accept null deadline', () => {
      const data = {
        title: 'Test Task',
        deadline: null,
      };

      const result = createTaskSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should accept valid assigneeId', () => {
      const data = {
        title: 'Test Task',
        assigneeId: 1,
      };

      const result = createTaskSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should reject negative assigneeId', () => {
      const data = {
        title: 'Test Task',
        assigneeId: -1,
      };

      const result = createTaskSchema.safeParse(data);

      expect(result.success).toBe(false);
    });
  });

  describe('updateTaskSchema', () => {
    it('should validate partial update data', () => {
      const data = {
        title: 'Updated Title',
      };

      const result = updateTaskSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should allow updating only status', () => {
      const data = {
        status: 'in_progress',
      };

      const result = updateTaskSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should reject empty title when provided', () => {
      const data = {
        title: '   ',
      };

      const result = updateTaskSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should accept null for optional fields', () => {
      const data = {
        description: null,
        type: null,
        deadline: null,
        assigneeId: null,
      };

      const result = updateTaskSchema.safeParse(data);

      expect(result.success).toBe(true);
    });
  });

  describe('taskParamsSchema', () => {
    it('should validate valid task ID', () => {
      const result = taskParamsSchema.safeParse({ id: '1' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
      }
    });

    it('should coerce string to number', () => {
      const result = taskParamsSchema.safeParse({ id: '123' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.id).toBe('number');
        expect(result.data.id).toBe(123);
      }
    });

    it('should reject negative ID', () => {
      const result = taskParamsSchema.safeParse({ id: '-1' });

      expect(result.success).toBe(false);
    });

    it('should reject zero ID', () => {
      const result = taskParamsSchema.safeParse({ id: '0' });

      expect(result.success).toBe(false);
    });

    it('should reject non-numeric ID', () => {
      const result = taskParamsSchema.safeParse({ id: 'invalid' });

      expect(result.success).toBe(false);
    });
  });

  describe('taskQuerySchema', () => {
    it('should validate valid query parameters', () => {
      const data = {
        status: 'todo',
        priority: 'high',
        page: '1',
        limit: '10',
      };

      const result = taskQuerySchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('todo');
        expect(result.data.priority).toBe('high');
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
      }
    });

    it('should use default page and limit', () => {
      const data = {};

      const result = taskQuerySchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should reject invalid status', () => {
      const data = {
        status: 'invalid_status',
      };

      const result = taskQuerySchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should reject limit over 100', () => {
      const data = {
        limit: '101',
      };

      const result = taskQuerySchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should accept valid date formats for createdFrom', () => {
      const data = {
        createdFrom: '2024-01-01',
      };

      const result = taskQuerySchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should reject invalid date formats', () => {
      const data = {
        createdFrom: 'invalid-date',
      };

      const result = taskQuerySchema.safeParse(data);

      expect(result.success).toBe(false);
    });
  });

  describe('Enum schemas', () => {
    it('should validate task status enum', () => {
      expect(taskStatusSchema.safeParse('todo').success).toBe(true);
      expect(taskStatusSchema.safeParse('in_progress').success).toBe(true);
      expect(taskStatusSchema.safeParse('review').success).toBe(true);
      expect(taskStatusSchema.safeParse('done').success).toBe(true);
      expect(taskStatusSchema.safeParse('invalid').success).toBe(false);
    });

    it('should validate task priority enum', () => {
      expect(taskPrioritySchema.safeParse('low').success).toBe(true);
      expect(taskPrioritySchema.safeParse('medium').success).toBe(true);
      expect(taskPrioritySchema.safeParse('high').success).toBe(true);
      expect(taskPrioritySchema.safeParse('urgent').success).toBe(true);
      expect(taskPrioritySchema.safeParse('invalid').success).toBe(false);
    });

    it('should validate task type enum', () => {
      expect(taskTypeSchema.safeParse('Task').success).toBe(true);
      expect(taskTypeSchema.safeParse('Subtask').success).toBe(true);
      expect(taskTypeSchema.safeParse('Bug').success).toBe(true);
      expect(taskTypeSchema.safeParse('Story').success).toBe(true);
      expect(taskTypeSchema.safeParse('Epic').success).toBe(true);
      expect(taskTypeSchema.safeParse('invalid').success).toBe(false);
    });
  });
});
