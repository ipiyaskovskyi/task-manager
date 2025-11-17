import { NextRequest } from 'next/server';
import { User } from '@/lib/models';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { initializeDatabase } from '@/lib/db/init';
import { applySecurityMiddleware } from '@/lib/middleware/api-security';
import { requireAuth } from '@/lib/middleware/auth';

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users (without passwords)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
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

      await initializeDatabase();

      const users = await User.findAll({
        attributes: ['id', 'firstname', 'lastname', 'email', 'createdAt'],
        order: [['createdAt', 'DESC']],
      });

      const usersData = users.map((u) => ({
        id: u.id,
        firstname: u.firstname,
        lastname: u.lastname,
        email: u.email,
        createdAt: u.createdAt ? u.createdAt.toISOString() : null,
      }));

      return successResponse(usersData, 200);
    } catch (error) {
      console.error('Error fetching users:', error);
      return errorResponse(
        error instanceof Error ? error.message : 'Failed to fetch users',
        500
      );
    }
  });
}
