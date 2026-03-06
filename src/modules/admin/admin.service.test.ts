import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdminService } from './admin.service';
import { EmailService } from '../email/email.service';
import { PrismaClient } from '@prisma/client';

const mockPrisma = {
  user: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
} as unknown as PrismaClient;

const mockEmailService = {
  sendPaymentConfirmation: vi.fn(),
} as unknown as EmailService;

describe('AdminService', () => {
  let service: AdminService;

  beforeEach(() => {
    service = new AdminService(mockPrisma, mockEmailService);
    vi.clearAllMocks();
  });

  describe('activatePlan', () => {
    it('activates esencial plan correctly', async () => {
      vi.mocked(mockPrisma.user.findFirst).mockResolvedValue({ id: 'u1' } as any);
      vi.mocked(mockPrisma.user.update).mockResolvedValue({
        id: 'u1',
        email: 'test@test.com',
        name: 'Test',
        plan: 'esencial',
        planStatus: 'active',
        planActivatedAt: new Date('2026-03-05'),
      } as any);
      vi.mocked(mockEmailService.sendPaymentConfirmation).mockResolvedValue(undefined);

      const result = await service.activatePlan('u1', 'esencial');

      expect(result.plan).toBe('esencial');
      expect(result.planStatus).toBe('active');
      expect(result.userId).toBe('u1');
    });

    it('activates premium plan correctly', async () => {
      vi.mocked(mockPrisma.user.findFirst).mockResolvedValue({ id: 'u1' } as any);
      vi.mocked(mockPrisma.user.update).mockResolvedValue({
        id: 'u1',
        email: 'test@test.com',
        name: 'Test',
        plan: 'premium',
        planStatus: 'active',
        planActivatedAt: new Date('2026-03-05'),
      } as any);
      vi.mocked(mockEmailService.sendPaymentConfirmation).mockResolvedValue(undefined);

      const result = await service.activatePlan('u1', 'premium');

      expect(result.plan).toBe('premium');
    });

    it('sets mpPaymentId with prefix "manual-"', async () => {
      vi.mocked(mockPrisma.user.findFirst).mockResolvedValue({ id: 'u1' } as any);
      vi.mocked(mockPrisma.user.update).mockResolvedValue({
        id: 'u1',
        email: 'test@test.com',
        name: 'Test',
        plan: 'esencial',
        planStatus: 'active',
        planActivatedAt: new Date(),
      } as any);
      vi.mocked(mockEmailService.sendPaymentConfirmation).mockResolvedValue(undefined);

      await service.activatePlan('u1', 'esencial');

      const updateCall = vi.mocked(mockPrisma.user.update).mock.calls[0][0];
      expect((updateCall.data as any).mpPaymentId).toMatch(/^manual-\d+$/);
    });

    it('throws NotFoundError if userId does not exist', async () => {
      vi.mocked(mockPrisma.user.findFirst).mockResolvedValue(null);

      await expect(service.activatePlan('bad-id', 'esencial')).rejects.toThrow('User not found');
    });

    it('sends payment confirmation email (fire-and-forget)', async () => {
      vi.mocked(mockPrisma.user.findFirst).mockResolvedValue({ id: 'u1' } as any);
      vi.mocked(mockPrisma.user.update).mockResolvedValue({
        id: 'u1',
        email: 'test@test.com',
        name: 'Test',
        plan: 'esencial',
        planStatus: 'active',
        planActivatedAt: new Date(),
      } as any);
      vi.mocked(mockEmailService.sendPaymentConfirmation).mockResolvedValue(undefined);

      await service.activatePlan('u1', 'esencial');

      expect(mockEmailService.sendPaymentConfirmation).toHaveBeenCalledWith(
        'test@test.com',
        'Test',
        'esencial',
        expect.stringMatching(/^manual-\d+$/),
      );
    });

    it('does not fail if email fails', async () => {
      vi.mocked(mockPrisma.user.findFirst).mockResolvedValue({ id: 'u1' } as any);
      vi.mocked(mockPrisma.user.update).mockResolvedValue({
        id: 'u1',
        email: 'test@test.com',
        name: 'Test',
        plan: 'esencial',
        planStatus: 'active',
        planActivatedAt: new Date(),
      } as any);
      vi.mocked(mockEmailService.sendPaymentConfirmation).mockRejectedValue(new Error('SMTP down'));

      const result = await service.activatePlan('u1', 'esencial');
      expect(result.planStatus).toBe('active');
    });
  });
});
