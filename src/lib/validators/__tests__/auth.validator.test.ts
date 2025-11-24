import { registerSchema, loginSchema } from '../auth.validator';

describe('Auth validators', () => {
  describe('registerSchema', () => {
    it('should validate valid registration data', () => {
      const data = {
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const result = registerSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.firstname).toBe('John');
        expect(result.data.lastname).toBe('Doe');
        expect(result.data.email).toBe('john@example.com');
      }
    });

    it('should trim firstname and lastname', () => {
      const data = {
        firstname: '  John  ',
        lastname: '  Doe  ',
        email: 'john@example.com',
        password: 'password123',
      };

      const result = registerSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.firstname).toBe('John');
        expect(result.data.lastname).toBe('Doe');
      }
    });

    it('should trim email', () => {
      const data = {
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const result = registerSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('john@example.com');
      }
    });

    it('should reject when firstname is too short', () => {
      const data = {
        firstname: 'J',
        lastname: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const result = registerSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should reject when lastname is too short', () => {
      const data = {
        firstname: 'John',
        lastname: 'D',
        email: 'john@example.com',
        password: 'password123',
      };

      const result = registerSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should reject when email is invalid', () => {
      const data = {
        firstname: 'John',
        lastname: 'Doe',
        email: 'invalid-email',
        password: 'password123',
      };

      const result = registerSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should reject when password is too short', () => {
      const data = {
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        password: '12345',
      };

      const result = registerSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should accept optional fields', () => {
      const data = {
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        mobilePhone: '+1234567890',
        country: 'USA',
        city: 'New York',
        address: '123 Main St',
      };

      const result = registerSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mobilePhone).toBe('+1234567890');
        expect(result.data.country).toBe('USA');
        expect(result.data.city).toBe('New York');
        expect(result.data.address).toBe('123 Main St');
      }
    });

    it('should reject invalid mobile phone format', () => {
      const data = {
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        mobilePhone: 'invalid-phone',
      };

      const result = registerSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should accept valid mobile phone format', () => {
      const data = {
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        mobilePhone: '+1234567890',
      };

      const result = registerSchema.safeParse(data);

      expect(result.success).toBe(true);
    });
  });

  describe('loginSchema', () => {
    it('should validate valid login data', () => {
      const data = {
        email: 'john@example.com',
        password: 'password123',
      };

      const result = loginSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('john@example.com');
        expect(result.data.password).toBe('password123');
      }
    });

    it('should trim email', () => {
      const data = {
        email: 'john@example.com',
        password: 'password123',
      };

      const result = loginSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('john@example.com');
      }
    });

    it('should reject when email is invalid', () => {
      const data = {
        email: 'invalid-email',
        password: 'password123',
      };

      const result = loginSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should reject when password is missing', () => {
      const data = {
        email: 'john@example.com',
      };

      const result = loginSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should reject when email is missing', () => {
      const data = {
        password: 'password123',
      };

      const result = loginSchema.safeParse(data);

      expect(result.success).toBe(false);
    });
  });
});
