import { successResponse, errorResponse } from '../api-response';
import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
} from '@/lib/errors';

describe('API Response utilities', () => {
  describe('successResponse', () => {
    it('should return 200 status by default', async () => {
      const response = successResponse({ data: 'test' });
      expect(response.status).toBe(200);
    });

    it('should return custom status when provided', async () => {
      const response = successResponse({ data: 'test' }, 201);
      expect(response.status).toBe(201);
    });

    it('should return JSON data', async () => {
      const data = { message: 'Success', id: 123 };
      const response = successResponse(data);
      const json = await response.json();

      expect(json).toEqual(data);
    });
  });

  describe('errorResponse', () => {
    it('should handle ValidationError with details', async () => {
      const details = [{ path: ['email'], message: 'Invalid email' }];
      const error = new ValidationError('Validation failed', details);
      const response = errorResponse(error);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe('Validation failed');
      expect(json.details).toEqual(details);
    });

    it('should handle ValidationError without details', async () => {
      const error = new ValidationError('Validation failed');
      const response = errorResponse(error);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toBe('Validation failed');
      expect(json.details).toBeUndefined();
    });

    it('should handle NotFoundError', async () => {
      const error = new NotFoundError('Task');
      const response = errorResponse(error);

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.error).toBe('Task not found');
    });

    it('should handle UnauthorizedError', async () => {
      const error = new UnauthorizedError('Authentication required');
      const response = errorResponse(error);

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error).toBe('Authentication required');
    });

    it('should handle AppError with custom status', async () => {
      const error = new AppError('Custom error', 418);
      const response = errorResponse(error);

      expect(response.status).toBe(418);
      const json = await response.json();
      expect(json.error).toBe('Custom error');
    });

    it('should handle generic Error', async () => {
      const error = new Error('Generic error');
      const response = errorResponse(error);

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe('Internal server error');
    });

    it('should handle unknown error types', async () => {
      const response = errorResponse('String error');

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe('Internal server error');
    });

    it('should use custom status when provided', async () => {
      const error = new ValidationError('Validation failed');
      const response = errorResponse(error, 422);

      expect(response.status).toBe(422);
    });
  });
});
