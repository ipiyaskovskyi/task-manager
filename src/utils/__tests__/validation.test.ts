import {
  validateEmail,
  validatePassword,
  validateName,
  validateConfirmPassword,
} from '../validation';

describe('Validation utilities', () => {
  describe('validateEmail', () => {
    it('should return undefined for valid email', () => {
      expect(validateEmail('test@example.com')).toBeUndefined();
    });

    it('should return error for empty email', () => {
      expect(validateEmail('')).toBe('Email is required');
    });

    it('should return error for whitespace-only email', () => {
      expect(validateEmail('   ')).toBe('Email is required');
    });

    it('should return error for invalid email format', () => {
      expect(validateEmail('invalid-email')).toBe(
        'Please enter a valid email address'
      );
    });

    it('should return error for email without @', () => {
      expect(validateEmail('testexample.com')).toBe(
        'Please enter a valid email address'
      );
    });

    it('should return error for email without domain', () => {
      expect(validateEmail('test@')).toBe('Please enter a valid email address');
    });

    it('should accept valid email formats', () => {
      expect(validateEmail('user@domain.com')).toBeUndefined();
      expect(validateEmail('user.name@domain.co.uk')).toBeUndefined();
      expect(validateEmail('user+tag@domain.com')).toBeUndefined();
    });
  });

  describe('validatePassword', () => {
    it('should return undefined for valid password with default min length', () => {
      expect(validatePassword('password123')).toBeUndefined();
    });

    it('should return error for empty password', () => {
      expect(validatePassword('')).toBe('Password is required');
    });

    it('should return error for password shorter than min length', () => {
      expect(validatePassword('12345')).toBe(
        'Password must be at least 6 characters'
      );
    });

    it('should accept password with exact min length', () => {
      expect(validatePassword('123456')).toBeUndefined();
    });

    it('should use custom min length', () => {
      expect(validatePassword('1234', 8)).toBe(
        'Password must be at least 8 characters'
      );
      expect(validatePassword('12345678', 8)).toBeUndefined();
    });
  });

  describe('validateName', () => {
    it('should return undefined for valid name', () => {
      expect(validateName('John', 'Firstname')).toBeUndefined();
    });

    it('should return error for empty name', () => {
      expect(validateName('', 'Firstname')).toBe('Firstname is required');
    });

    it('should return error for whitespace-only name', () => {
      expect(validateName('   ', 'Lastname')).toBe('Lastname is required');
    });

    it('should return error for name shorter than 2 characters', () => {
      expect(validateName('J', 'Firstname')).toBe(
        'Firstname must be at least 2 characters'
      );
    });

    it('should accept name with exact 2 characters', () => {
      expect(validateName('Jo', 'Firstname')).toBeUndefined();
    });

    it('should use custom field name in error message', () => {
      expect(validateName('', 'Lastname')).toBe('Lastname is required');
      expect(validateName('D', 'Lastname')).toBe(
        'Lastname must be at least 2 characters'
      );
    });
  });

  describe('validateConfirmPassword', () => {
    it('should return undefined when passwords match', () => {
      expect(
        validateConfirmPassword('password123', 'password123')
      ).toBeUndefined();
    });

    it('should return error when confirm password is empty', () => {
      expect(validateConfirmPassword('password123', '')).toBe(
        'Please confirm your password'
      );
    });

    it('should return error when passwords do not match', () => {
      expect(validateConfirmPassword('password123', 'password456')).toBe(
        'Passwords do not match'
      );
    });

    it('should be case-sensitive', () => {
      expect(validateConfirmPassword('Password123', 'password123')).toBe(
        'Passwords do not match'
      );
    });
  });
});
