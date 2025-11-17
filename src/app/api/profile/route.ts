import { NextRequest } from 'next/server';
import { User } from '@/lib/models';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { initializeDatabase } from '@/lib/db/init';
import { applySecurityMiddleware } from '@/lib/middleware/api-security';
import { requireAuth, authenticateRequest } from '@/lib/middleware/auth';
import { z } from 'zod';

const mobilePhoneRegex = /^\+?[1-9]\d{1,14}$/;

const updateProfileSchema = z.object({
  firstname: z.string().min(1, 'First name is required').max(100),
  lastname: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
  mobilePhone: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || val.trim() === '' || mobilePhoneRegex.test(val.trim()),
      {
        message:
          'Invalid mobile phone format. Use international format (e.g., +1234567890)',
      }
    ),
  country: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's profile information
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function GET(request: NextRequest) {
  return applySecurityMiddleware(request, async (req) => {
    try {
      const authError = await requireAuth(req);
      if (authError) return authError;

      const authResult = await authenticateRequest(req);
      if (!authResult) {
        return errorResponse(new Error('Unauthorized'), 401);
      }

      await initializeDatabase();

      const user = await User.findByPk(authResult.userId, {
        attributes: [
          'id',
          'firstname',
          'lastname',
          'email',
          'mobilePhone',
          'country',
          'city',
          'address',
          'createdAt',
        ],
      });

      if (!user) {
        return errorResponse(new Error('User not found'), 404);
      }

      return successResponse(
        {
          id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          mobilePhone: user.mobilePhone,
          country: user.country,
          city: user.city,
          address: user.address,
          createdAt: user.createdAt ? user.createdAt.toISOString() : null,
        },
        200
      );
    } catch (error) {
      console.error('Error fetching profile:', error);
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to fetch profile',
        500
      );
    }
  });
}

/**
 * @swagger
 * /api/profile:
 *   put:
 *     summary: Update current user profile
 *     description: Update the authenticated user's profile information
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstname
 *               - lastname
 *               - email
 *             properties:
 *               firstname:
 *                 type: string
 *               lastname:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function PUT(request: NextRequest) {
  return applySecurityMiddleware(request, async (req) => {
    try {
      const authError = await requireAuth(req);
      if (authError) return authError;

      const authResult = await authenticateRequest(req);
      if (!authResult) {
        return errorResponse(new Error('Unauthorized'), 401);
      }

      await initializeDatabase();

      const body = await req.json().catch(() => ({}));
      const validation = updateProfileSchema.safeParse(body);

      if (!validation.success) {
        const firstError = validation.error.issues[0];
        return errorResponse(
          new Error(firstError?.message || 'Validation failed'),
          400
        );
      }

      const user = await User.findByPk(authResult.userId);
      if (!user) {
        return errorResponse(new Error('User not found'), 404);
      }

      const existingUser = await User.findOne({
        where: { email: validation.data.email },
      });

      if (existingUser && existingUser.id !== authResult.userId) {
        return errorResponse(new Error('Email already in use'), 400);
      }

      user.firstname = validation.data.firstname;
      user.lastname = validation.data.lastname;
      user.email = validation.data.email;
      user.mobilePhone = validation.data.mobilePhone || null;
      user.country = validation.data.country || null;
      user.city = validation.data.city || null;
      user.address = validation.data.address || null;
      await user.save();

      return successResponse(
        {
          id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          mobilePhone: user.mobilePhone,
          country: user.country,
          city: user.city,
          address: user.address,
          createdAt: user.createdAt ? user.createdAt.toISOString() : null,
        },
        200
      );
    } catch (error) {
      console.error('Error updating profile:', error);
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to update profile',
        500
      );
    }
  });
}
