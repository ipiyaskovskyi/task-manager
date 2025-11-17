import { NextRequest } from 'next/server';
import { TasksService } from '@/lib/services/tasks.service';
import {
  taskQuerySchema,
  createTaskSchema,
} from '@/lib/validators/tasks.validator';
import { User } from '@/lib/models';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { initializeDatabase } from '@/lib/db/init';
import { applySecurityMiddleware } from '@/lib/middleware/api-security';
import { requireAuth } from '@/lib/middleware/auth';

const tasksService = new TasksService();

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks
 *     description: Retrieve a list of tasks with optional filtering
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [todo, in_progress, review, done]
 *         description: Filter by task status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filter by task priority
 *       - in: query
 *         name: createdFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter tasks created from this date
 *       - in: query
 *         name: createdTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter tasks created until this date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function GET(request: NextRequest) {
  return applySecurityMiddleware(request, async (req) => {
    try {
      const authError = await requireAuth(req);
      if (authError) return authError;

      await initializeDatabase();

      const searchParams = req.nextUrl.searchParams;
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
  });
}

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     description: Create a new task with the provided details
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskRequest'
 *           example:
 *             title: "Complete project documentation"
 *             description: "Write comprehensive API documentation"
 *             status: "todo"
 *             priority: "high"
 *             type: "Task"
 *             deadline: "2024-12-31T23:59:59Z"
 *             assigneeId: 1
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function POST(request: NextRequest) {
  return applySecurityMiddleware(request, async (req) => {
    try {
      const authError = await requireAuth(req);
      if (authError) return authError;

      await initializeDatabase();

      const body = await req.json().catch(() => ({}));
      const validation = createTaskSchema.safeParse(body);

      if (!validation.success) {
        const firstError = validation.error.issues[0];
        let errorMessage = firstError?.message || 'Validation failed';

        if (
          errorMessage === 'Required' ||
          errorMessage.includes('expected string, received undefined') ||
          (firstError?.path?.includes('title') && !body.title)
        ) {
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
  });
}
