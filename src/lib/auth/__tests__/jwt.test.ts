import { generateToken, verifyToken, extractTokenFromHeader } from '../jwt';
import type { UserAttributes } from '@/lib/models/User.model';

describe('JWT utilities', () => {
  const mockUser: Omit<UserAttributes, 'password'> = {
    id: 1,
    firstname: 'Test',
    lastname: 'User',
    email: 'test@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(mockUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    it('should generate different tokens for different users', () => {
      const token1 = generateToken(mockUser);
      const user2 = { ...mockUser, id: 2 };
      const token2 = generateToken(user2);

      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const token = generateToken(mockUser);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(mockUser.id);
      expect(decoded?.email).toBe(mockUser.email);
    });

    it('should return null for invalid token', () => {
      const decoded = verifyToken('invalid.token.here');
      expect(decoded).toBeNull();
    });

    it('should return null for malformed token', () => {
      const decoded = verifyToken('not-a-valid-token');
      expect(decoded).toBeNull();
    });

    it('should return null for empty token', () => {
      const decoded = verifyToken('');
      expect(decoded).toBeNull();
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from Bearer header', () => {
      const token = 'test-token-123';
      const header = `Bearer ${token}`;
      const extracted = extractTokenFromHeader(header);

      expect(extracted).toBe(token);
    });

    it('should return null when header does not start with Bearer', () => {
      const extracted = extractTokenFromHeader('Token test-token-123');
      expect(extracted).toBeNull();
    });

    it('should return null when header is null', () => {
      const extracted = extractTokenFromHeader(null);
      expect(extracted).toBeNull();
    });

    it('should return null when header is empty string', () => {
      const extracted = extractTokenFromHeader('');
      expect(extracted).toBeNull();
    });

    it('should handle Bearer with spaces correctly', () => {
      const token = 'test-token-123';
      const header = `Bearer  ${token}`;
      const extracted = extractTokenFromHeader(header);

      expect(extracted).toBe(` ${token}`);
    });
  });
});
