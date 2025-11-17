import { User } from '../models';
import bcrypt from 'bcrypt';
import type { UserAttributes } from '../models/User.model';
import { generateToken } from '../auth/jwt';

export interface RegisterData {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  mobilePhone?: string | null;
  country?: string | null;
  city?: string | null;
  address?: string | null;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<UserAttributes, 'password'>;
  token: string;
}

export class AuthService {
  async register(data: RegisterData): Promise<AuthResponse> {
    const existingUser = await User.findOne({ where: { email: data.email } });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await User.create({
      firstname: data.firstname,
      lastname: data.lastname,
      email: data.email,
      password: hashedPassword,
      mobilePhone: data.mobilePhone || null,
      country: data.country || null,
      city: data.city || null,
      address: data.address || null,
    });

    /* eslint-disable @typescript-eslint/no-unused-vars */
    const { password: _password, ...userWithoutPassword } = user.toJSON();
    const userData = userWithoutPassword as Omit<UserAttributes, 'password'>;
    const token = generateToken(userData);

    return {
      user: userData,
      token,
    };
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const user = await User.findOne({ where: { email: data.email } });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    /* eslint-disable @typescript-eslint/no-unused-vars */
    const { password: _password, ...userWithoutPassword } = user.toJSON();
    const userData = userWithoutPassword as Omit<UserAttributes, 'password'>;
    const token = generateToken(userData);

    return {
      user: userData,
      token,
    };
  }
}
