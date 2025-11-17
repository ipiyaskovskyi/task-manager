import { NextRequest, NextResponse } from 'next/server';
import { TasksService } from '@/lib/services/tasks.service';
import {
  taskParamsSchema,
  updateTaskSchema,
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
 * /api/tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     description: Retrieve a specific task by its ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task details
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
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return applySecurityMiddleware(request, async (req) => {
    try {
      const authError = await requireAuth(req);
      if (authError) return authError;

      await initializeDatabase();

      const { id } = await params;
      const paramsValidation = taskParamsSchema.safeParse({ id });

      if (!paramsValidation.success) {
        throw new ValidationError('Invalid task ID');
      }

      const task = await tasksService.getTaskById(paramsValidation.data.id);

      if (!task) {
        throw new NotFoundError('Task');
      }

      return successResponse(task);
    } catch (error) {
      return errorResponse(error);
    }
  });
}

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update a task
 *     description: Update an existing task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTaskRequest'
 *           example:
 *             title: "Updated task title"
 *             status: "in_progress"
 *             priority: "urgent"
 *     responses:
 *       200:
 *         description: Task updated successfully
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
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return applySecurityMiddleware(request, async (req) => {
    try {
      const authError = await requireAuth(req);
      if (authError) return authError;

      await initializeDatabase();

      const { id } = await params;
      const paramsValidation = taskParamsSchema.safeParse({ id });

      if (!paramsValidation.success) {
        throw new ValidationError('Invalid task ID');
      }

      const body = await req.json();
      const validation = updateTaskSchema.safeParse(body);

      if (!validation.success) {
        const firstError = validation.error.issues[0];
        let errorMessage = firstError?.message || 'Validation failed';

        if (errorMessage.includes('Invalid enum value')) {
          if (firstError?.path?.includes('status')) {
            errorMessage = 'Invalid status value';
          } else if (firstError?.path?.includes('priority')) {
            errorMessage = 'Invalid priority value';
          }
        }

        throw new ValidationError(errorMessage, validation.error.issues);
      }

      const data = validation.data;

      if (data.assigneeId !== undefined && data.assigneeId !== null) {
        const user = await User.findByPk(data.assigneeId);
        if (!user) {
          throw new NotFoundError('Assignee');
        }
      }

      const task = await tasksService.updateTask(
        paramsValidation.data.id,
        data
      );

      if (!task) {
        throw new NotFoundError('Task');
      }

      return successResponse(task);
    } catch (error) {
      return errorResponse(error);
    }
  });
}

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     description: Delete a task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     responses:
 *       204:
 *         description: Task deleted successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return applySecurityMiddleware(request, async (req) => {
    try {
      const authError = await requireAuth(req);
      if (authError) return authError;

      await initializeDatabase();

      const { id } = await params;
      const paramsValidation = taskParamsSchema.safeParse({ id });

      if (!paramsValidation.success) {
        throw new ValidationError('Invalid task ID');
      }

      const deleted = await tasksService.deleteTask(paramsValidation.data.id);

      if (!deleted) {
        throw new NotFoundError('Task');
      }

      const response = new NextResponse(null, { status: 204 });
      return response;
    } catch (error) {
      return errorResponse(error);
    }
  });
}
