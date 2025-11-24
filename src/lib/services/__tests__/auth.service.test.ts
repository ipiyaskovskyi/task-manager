import { AuthService } from '../auth.service';
import { User } from '@/lib/models';
import { sequelize } from '@/lib/db/sequelize';
import bcrypt from 'bcrypt';

beforeAll(async () => {
  try {
    await sequelize.authenticate();
  } catch (error) {
    console.error('Database authentication failed:', error);
  }
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await User.destroy({ where: {} });
});

describe('AuthService', () => {
  const authService = new AuthService();

  describe('register', () => {
    it('should create a new user and return token', async () => {
      const data = {
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const result = await authService.register(data);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('john@example.com');
      expect(result.user.firstname).toBe('John');
      expect(result.user.lastname).toBe('Doe');
      expect(result.token).toBeDefined();
      expect(result.user.password).toBeUndefined();

      const user = await User.findByPk(result.user.id);
      expect(user).toBeDefined();
      if (user) {
        const isPasswordValid = await bcrypt.compare(
          'password123',
          user.password
        );
        expect(isPasswordValid).toBe(true);
      }
    });

    it('should throw error when email already exists', async () => {
      await User.create({
        firstname: 'Existing',
        lastname: 'User',
        email: 'existing@example.com',
        password: 'password123',
      });

      const data = {
        firstname: 'New',
        lastname: 'User',
        email: 'existing@example.com',
        password: 'password123',
      };

      await expect(authService.register(data)).rejects.toThrow(
        'User with this email already exists'
      );
    });

    it('should hash password before storing', async () => {
      const data = {
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const result = await authService.register(data);
      const user = await User.findByPk(result.user.id);

      expect(user).toBeDefined();
      if (user) {
        expect(user.password).not.toBe('password123');
        expect(user.password.length).toBeGreaterThan(20);
      }
    });

    it('should accept optional fields', async () => {
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

      const result = await authService.register(data);

      expect(result.user.mobilePhone).toBe('+1234567890');
      expect(result.user.country).toBe('USA');
      expect(result.user.city).toBe('New York');
      expect(result.user.address).toBe('123 Main St');
    });
  });

  describe('login', () => {
    it('should return user and token when credentials are valid', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await User.create({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        password: hashedPassword,
      });

      const result = await authService.login({
        email: 'john@example.com',
        password: 'password123',
      });

      expect(result.user.id).toBe(user.id);
      expect(result.user.email).toBe('john@example.com');
      expect(result.token).toBeDefined();
      expect(result.user.password).toBeUndefined();
    });

    it('should throw error when email does not exist', async () => {
      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error when password is incorrect', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        password: hashedPassword,
      });

      await expect(
        authService.login({
          email: 'john@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid email or password');
    });
  });
});
