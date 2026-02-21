import { describe, it, expect, beforeEach, vi } from 'vitest';
import bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';

// Mock del repository
const mockRepository = {
  create: vi.fn(),
  findByEmail: vi.fn(),
  findById: vi.fn(),
} as unknown as AuthRepository;

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService(mockRepository);
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should register a user successfully', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      vi.mocked(mockRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(mockRepository.create).mockImplementation(async (data: any) => ({
        id: '123',
        email: data.email,
        password: data.password,
        name: data.name,
        role: 'user' as const,
        createdAt: new Date(),
      }));

      const result = await service.register(registerData);

      expect(mockRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          name: 'Test User',
        })
      );
      // Verify password was hashed (not stored as plain text)
      const createCall = vi.mocked(mockRepository.create).mock.calls[0][0];
      expect(createCall.password).not.toBe('password123');
      expect(await bcrypt.compare('password123', createCall.password)).toBe(true);

      // Verify response doesn't include password
      expect(result).toEqual({
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        createdAt: expect.any(Date),
      });
      expect((result as any).password).toBeUndefined();
    });

    it('should throw error when email already exists', async () => {
      vi.mocked(mockRepository.findByEmail).mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        password: 'hashed',
        name: 'Existing',
        role: 'user' as const,
        createdAt: new Date(),
      });

      await expect(
        service.register({ email: 'test@example.com', password: 'password123' })
      ).rejects.toThrow('Email already registered');

      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);

      vi.mocked(mockRepository.findByEmail).mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        role: 'user' as const,
        createdAt: new Date(),
      });

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        createdAt: expect.any(Date),
      });
      expect((result as any).password).toBeUndefined();
    });

    it('should throw generic error when email not found', async () => {
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(null);

      await expect(
        service.login({ email: 'nonexistent@example.com', password: 'password123' })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw generic error when password is wrong', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);

      vi.mocked(mockRepository.findByEmail).mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        role: 'user' as const,
        createdAt: new Date(),
      });

      await expect(
        service.login({ email: 'test@example.com', password: 'wrongpassword' })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should use same error message for email not found and wrong password', async () => {
      // Test que ambos errores son indistinguibles (prevención de enumeración de emails)
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(null);

      try {
        await service.login({ email: 'x@x.com', password: 'y' });
      } catch (e1: any) {
        const hashedPassword = await bcrypt.hash('correct', 10);
        vi.mocked(mockRepository.findByEmail).mockResolvedValue({
          id: '1',
          email: 'x@x.com',
          password: hashedPassword,
          name: null,
          role: 'user' as const,
          createdAt: new Date(),
        });

        try {
          await service.login({ email: 'x@x.com', password: 'wrong' });
        } catch (e2: any) {
          expect(e1.message).toBe(e2.message);
        }
      }
    });
  });

  describe('getProfile', () => {
    it('should return user profile without password', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        role: 'user' as const,
        createdAt: new Date(),
      });

      const result = await service.getProfile('123');

      expect(result).toEqual({
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        createdAt: expect.any(Date),
      });
      expect((result as any).password).toBeUndefined();
    });

    it('should throw error when user not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(service.getProfile('nonexistent')).rejects.toThrow('User not found');
    });
  });
});
