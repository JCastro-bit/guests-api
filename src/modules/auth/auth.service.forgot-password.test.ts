import { describe, it, expect, beforeEach, vi } from 'vitest';
import bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';

const mockRepository = {
  create: vi.fn(),
  findByEmail: vi.fn(),
  findById: vi.fn(),
  saveResetToken: vi.fn(),
  findByResetToken: vi.fn(),
  updatePassword: vi.fn(),
} as unknown as AuthRepository;

describe('AuthService — forgot/reset password', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService(mockRepository);
    vi.clearAllMocks();
  });

  describe('forgotPassword', () => {
    it('should return null when email does not exist', async () => {
      vi.mocked(mockRepository.findByEmail).mockResolvedValue(null);

      const result = await service.forgotPassword('nonexistent@example.com');

      expect(result).toBeNull();
      expect(mockRepository.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(mockRepository.saveResetToken).not.toHaveBeenCalled();
    });

    it('should save token and return data when email exists', async () => {
      vi.mocked(mockRepository.findByEmail).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed',
        name: 'Test User',
        role: 'user' as const,
        plan: 'free' as const,
        planStatus: 'inactive' as const,
        planActivatedAt: null,
        planExpiresAt: null,
        mpPaymentId: null,
        resetToken: null,
        resetTokenExpiry: null,
        createdAt: new Date(),
      });
      vi.mocked(mockRepository.saveResetToken).mockResolvedValue(undefined);

      const result = await service.forgotPassword('test@example.com');

      expect(result).not.toBeNull();
      expect(result!.email).toBe('test@example.com');
      expect(result!.name).toBe('Test User');
      expect(result!.token).toBeDefined();
      expect(typeof result!.token).toBe('string');
      expect(result!.token.length).toBe(64); // 32 bytes hex = 64 chars
      expect(mockRepository.saveResetToken).toHaveBeenCalledWith(
        'user-1',
        expect.any(String),
        expect.any(Date)
      );
    });

    it('should use "Usuario" as default name when user has no name', async () => {
      vi.mocked(mockRepository.findByEmail).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: 'hashed',
        name: null,
        role: 'user' as const,
        plan: 'free' as const,
        planStatus: 'inactive' as const,
        planActivatedAt: null,
        planExpiresAt: null,
        mpPaymentId: null,
        resetToken: null,
        resetTokenExpiry: null,
        createdAt: new Date(),
      });
      vi.mocked(mockRepository.saveResetToken).mockResolvedValue(undefined);

      const result = await service.forgotPassword('test@example.com');

      expect(result!.name).toBe('Usuario');
    });
  });

  describe('resetPassword', () => {
    it('should update password and clear token with valid token', async () => {
      vi.mocked(mockRepository.findByResetToken).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        password: 'old-hash',
        name: 'Test User',
        role: 'user' as const,
        plan: 'free' as const,
        planStatus: 'inactive' as const,
        planActivatedAt: null,
        planExpiresAt: null,
        mpPaymentId: null,
        resetToken: 'valid-token',
        resetTokenExpiry: new Date(Date.now() + 3600000),
        createdAt: new Date(),
      });
      vi.mocked(mockRepository.updatePassword).mockResolvedValue(undefined);

      const result = await service.resetPassword('valid-token', 'newPassword123');

      expect(result.message).toBe('Contrasena actualizada. Ahora puedes iniciar sesion.');
      expect(mockRepository.updatePassword).toHaveBeenCalledWith(
        'user-1',
        expect.any(String)
      );

      // Verify the new password was hashed
      const hashedPassword = vi.mocked(mockRepository.updatePassword).mock.calls[0][1];
      expect(await bcrypt.compare('newPassword123', hashedPassword)).toBe(true);
    });

    it('should throw 400 when token is expired or invalid', async () => {
      vi.mocked(mockRepository.findByResetToken).mockResolvedValue(null);

      await expect(
        service.resetPassword('expired-token', 'newPassword123')
      ).rejects.toThrow('El enlace es invalido o ha expirado.');

      expect(mockRepository.updatePassword).not.toHaveBeenCalled();
    });

    it('should throw error with statusCode 400 for invalid token', async () => {
      vi.mocked(mockRepository.findByResetToken).mockResolvedValue(null);

      try {
        await service.resetPassword('bad-token', 'newPassword123');
        expect.fail('Should have thrown');
      } catch (err: any) {
        expect(err.statusCode).toBe(400);
      }
    });
  });
});
