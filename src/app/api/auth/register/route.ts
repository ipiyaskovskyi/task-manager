import { NextRequest } from 'next/server';
import { AuthService } from '@/lib/services/auth.service';
import { registerSchema } from '@/lib/validators/auth.validator';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { ValidationError } from '@/lib/errors';
import { initializeDatabase } from '@/lib/db/init';
import { applySecurityMiddleware } from '@/lib/middleware/api-security';

const authService = new AuthService();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: User registration
 *     description: Register a new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           example:
 *             firstname: "John"
 *             lastname: "Doe"
 *             email: "john.doe@example.com"
 *             password: "password123"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: User with this email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function POST(request: NextRequest) {
  return applySecurityMiddleware(request, async (req) => {
    try {
      await initializeDatabase();

      const body = await req.json();
      const validation = registerSchema.safeParse(body);

      if (!validation.success) {
        const firstError = validation.error.issues[0];
        const errorMessage = firstError?.message || 'Validation failed';
        throw new ValidationError(errorMessage, validation.error.issues);
      }

      const data = validation.data;
      const authResponse = await authService.register(data);
      return successResponse(authResponse, 201);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'User with this email already exists'
      ) {
        return errorResponse(new ValidationError(error.message), 409);
      }
      return errorResponse(error);
    }
  });
}
