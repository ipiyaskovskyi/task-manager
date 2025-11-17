import { NextRequest } from 'next/server';
import { AuthService } from '@/lib/services/auth.service';
import { loginSchema } from '@/lib/validators/auth.validator';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { ValidationError, UnauthorizedError } from '@/lib/errors';
import { initializeDatabase } from '@/lib/db/init';
import { applySecurityMiddleware } from '@/lib/middleware/api-security';

const authService = new AuthService();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate a user and return user information
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: "john.doe@example.com"
 *             password: "password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function POST(request: NextRequest) {
  return applySecurityMiddleware(request, async (req) => {
    try {
      await initializeDatabase();

      const body = await req.json();
      const validation = loginSchema.safeParse(body);

      if (!validation.success) {
        const firstError = validation.error.issues[0];
        const errorMessage = firstError?.message || 'Validation failed';
        throw new ValidationError(errorMessage, validation.error.issues);
      }

      const data = validation.data;
      const authResponse = await authService.login(data);
      return successResponse(authResponse);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'Invalid email or password'
      ) {
        return errorResponse(new UnauthorizedError(error.message));
      }
      return errorResponse(error);
    }
  });
}
