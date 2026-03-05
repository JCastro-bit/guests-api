import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { AuthRepository } from './auth.repository';
import { RegisterBody, LoginBody } from './auth.schema';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../errors/app-error';
import { AppError } from '../../errors/app-error';

const parsedRounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
const BCRYPT_ROUNDS = Number.isNaN(parsedRounds) || parsedRounds < 4 || parsedRounds > 31 ? 10 : parsedRounds;

interface SafeUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  plan: string;
  planStatus: string;
  createdAt: Date;
}

export class AuthService {
  constructor(private repository: AuthRepository) {}

  async register(data: RegisterBody): Promise<SafeUser> {
    // Verificar si el email ya existe
    const existing = await this.repository.findByEmail(data.email);
    if (existing) {
      throw ConflictError('Email already registered');
    }

    // Hashear password
    const hashedPassword = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    // Crear usuario
    const user = await this.repository.create({
      email: data.email,
      password: hashedPassword,
      name: data.name,
    });

    // Retornar sin password
    return this.toSafeUser(user);
  }

  async login(data: LoginBody): Promise<SafeUser> {
    // Buscar usuario por email
    const user = await this.repository.findByEmail(data.email);

    // Always run bcrypt.compare to prevent timing attacks even when user not found
    const dummyHash = '$2b$10$h.uYw3jwWjPrkM.kU8BdjegNr0zuwdBBmgnpUvahf6yooRnj3iBdy';
    const isValid = user
      ? await bcrypt.compare(data.password, user.password)
      : await bcrypt.compare(data.password, dummyHash).then(() => false);

    if (!user || !isValid) {
      throw UnauthorizedError('Invalid email or password');
    }

    return this.toSafeUser(user);
  }

  async getProfile(userId: string): Promise<SafeUser> {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw NotFoundError('User');
    }

    return this.toSafeUser(user);
  }

  async forgotPassword(email: string): Promise<{ token: string; email: string; name: string } | null> {
    const user = await this.repository.findByEmail(email);

    if (!user) {
      return null;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.repository.saveResetToken(user.id, token, expiry);

    return { token, email: user.email, name: user.name ?? 'Usuario' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.repository.findByResetToken(token);
    if (!user) {
      throw new AppError('El enlace es invalido o ha expirado.', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.repository.updatePassword(user.id, hashedPassword);

    return { message: 'Contrasena actualizada. Ahora puedes iniciar sesion.' };
  }

  private toSafeUser(user: { id: string; email: string; name: string | null; role: string; plan: string; planStatus: string; createdAt: Date }): SafeUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan: user.plan,
      planStatus: user.planStatus,
      createdAt: user.createdAt,
    };
  }
}
