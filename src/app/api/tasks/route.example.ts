import { NextRequest } from 'next/server';
import { TasksService } from '@/lib/services/tasks.service';
import {
  taskQuerySchema,
  createTaskSchema,
} from '@/lib/validators/tasks.validator';
import { User } from '@/lib/models';
import { getSequelize } from '@/lib/db/connection';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { ValidationError, NotFoundError } from '@/lib/errors';
import '@/lib/models';

const tasksService = new TasksService();

export async function GET(request: NextRequest) {
  try {
    const sequelize = getSequelize();
    await sequelize.authenticate();

    const searchParams = request.nextUrl.searchParams;
    const query: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      query[key] = value;
    });

    const queryValidation = taskQuerySchema.safeParse(query);
    if (!queryValidation.success) {
      throw new ValidationError(
        'Invalid query parameters',
        queryValidation.error.issues
      );
    }

    const filters = queryValidation.data;
    const tasks = await tasksService.getAllTasks(filters);

    return successResponse(tasks);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const sequelize = getSequelize();
    await sequelize.authenticate();

    const body = await request.json();
    const validation = createTaskSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      let errorMessage = firstError?.message || 'Validation failed';

      if (errorMessage === 'Required') {
        errorMessage = 'Title is required and must be a non-empty string';
      } else if (errorMessage.includes('Invalid enum value')) {
        if (firstError?.path?.includes('status')) {
          errorMessage = 'Invalid status value';
        } else if (firstError?.path?.includes('priority')) {
          errorMessage = 'Invalid priority value';
        }
      }

      throw new ValidationError(errorMessage, validation.error.issues);
    }

    const data = validation.data;

    if (data.assigneeId) {
      const user = await User.findByPk(data.assigneeId);
      if (!user) {
        throw new NotFoundError('Assignee');
      }
    }

    const task = await tasksService.createTask(data);
    return successResponse(task, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
