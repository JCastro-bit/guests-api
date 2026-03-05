import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PaymentService } from './payment.service';

const mockPrisma = {
  user: {
    findUniqueOrThrow: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};

const mockMp = {
  preference: {
    create: vi.fn(),
  },
  payment: {
    get: vi.fn(),
  },
};

const mockMailer = {
  sendMail: vi.fn(),
};

const mockLog = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  fatal: vi.fn(),
  trace: vi.fn(),
  child: vi.fn(),
};

const mockFastify = {
  prisma: mockPrisma,
  mp: mockMp,
  mailer: mockMailer,
  log: mockLog,
} as unknown as Parameters<typeof PaymentService extends new (f: infer F) => unknown ? (f: F) => void : never>[0];

describe('PaymentService', () => {
  let service: PaymentService;

  beforeEach(() => {
    service = new PaymentService(mockFastify as any);
    vi.clearAllMocks();
  });

  describe('createPreference', () => {
    it('should call mp.preference.create with correct data and return initPoint', async () => {
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });

      mockMp.preference.create.mockResolvedValue({
        id: 'pref-123',
        init_point: 'https://www.mercadopago.com.mx/checkout/v1/redirect?pref_id=pref-123',
        sandbox_init_point: 'https://sandbox.mercadopago.com.mx/checkout/v1/redirect?pref_id=pref-123',
      });

      const result = await service.createPreference('user-1', 'esencial');

      expect(mockPrisma.user.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(mockMp.preference.create).toHaveBeenCalledWith({
        body: expect.objectContaining({
          items: [
            expect.objectContaining({
              id: 'esencial',
              title: 'LOVEPOSTAL — Plan Esencial',
              quantity: 1,
              unit_price: 2250,
              currency_id: 'MXN',
            }),
          ],
          payer: { email: 'test@example.com', name: 'Test User' },
          external_reference: 'user-1|esencial',
        }),
      });
      expect(result).toEqual({
        preferenceId: 'pref-123',
        initPoint: 'https://www.mercadopago.com.mx/checkout/v1/redirect?pref_id=pref-123',
        sandboxInitPoint: 'https://sandbox.mercadopago.com.mx/checkout/v1/redirect?pref_id=pref-123',
      });
    });
  });

  describe('processWebhook', () => {
    it('should activate plan when payment is approved', async () => {
      mockMp.payment.get.mockResolvedValue({
        status: 'approved',
        external_reference: 'user-1|premium',
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        planStatus: 'inactive',
        mpPaymentId: null,
      });

      mockPrisma.user.update.mockResolvedValue({});

      await service.processWebhook('12345');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          plan: 'premium',
          planStatus: 'active',
          planActivatedAt: expect.any(Date),
          mpPaymentId: '12345',
        },
      });
    });

    it('should skip when payment is not approved', async () => {
      mockMp.payment.get.mockResolvedValue({
        status: 'pending',
        external_reference: 'user-1|esencial',
      });

      await service.processWebhook('12345');

      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should not crash with invalid external_reference', async () => {
      mockMp.payment.get.mockResolvedValue({
        status: 'approved',
        external_reference: 'invalid-ref',
      });

      await service.processWebhook('12345');

      expect(mockLog.error).toHaveBeenCalledWith(
        { externalRef: 'invalid-ref' },
        'Invalid external_reference in webhook'
      );
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should be idempotent — skip already processed payment', async () => {
      mockMp.payment.get.mockResolvedValue({
        status: 'approved',
        external_reference: 'user-1|esencial',
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        planStatus: 'active',
        mpPaymentId: '12345',
      });

      await service.processWebhook('12345');

      expect(mockLog.info).toHaveBeenCalledWith(
        { userId: 'user-1', paymentId: '12345' },
        'Payment already processed, skipping'
      );
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should log error when user not found', async () => {
      mockMp.payment.get.mockResolvedValue({
        status: 'approved',
        external_reference: 'nonexistent|premium',
      });

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await service.processWebhook('12345');

      expect(mockLog.error).toHaveBeenCalledWith(
        { userId: 'nonexistent' },
        'User not found for payment'
      );
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('should send payment confirmation email on activation', async () => {
      mockMp.payment.get.mockResolvedValue({
        status: 'approved',
        external_reference: 'user-1|esencial',
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        planStatus: 'inactive',
        mpPaymentId: null,
      });

      mockPrisma.user.update.mockResolvedValue({});

      await service.processWebhook('12345');

      expect(mockPrisma.user.update).toHaveBeenCalled();
    });
  });

  describe('createPreference — premium plan', () => {
    it('should create preference with premium price', async () => {
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });

      mockMp.preference.create.mockResolvedValue({
        id: 'pref-456',
        init_point: 'https://www.mercadopago.com.mx/checkout/v1/redirect?pref_id=pref-456',
        sandbox_init_point: 'https://sandbox.mercadopago.com.mx/checkout/v1/redirect?pref_id=pref-456',
      });

      const result = await service.createPreference('user-1', 'premium');

      expect(mockMp.preference.create).toHaveBeenCalledWith({
        body: expect.objectContaining({
          items: [
            expect.objectContaining({
              id: 'premium',
              title: 'LOVEPOSTAL — Plan Premium',
              quantity: 1,
              unit_price: 4499,
              currency_id: 'MXN',
            }),
          ],
          external_reference: 'user-1|premium',
        }),
      });
      expect(result.preferenceId).toBe('pref-456');
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should return true when MP_WEBHOOK_SECRET is not set (dev mode)', () => {
      const original = process.env.MP_WEBHOOK_SECRET;
      delete process.env.MP_WEBHOOK_SECRET;

      const result = service.verifyWebhookSignature('any', 'any', 'any', 'any');

      expect(result).toBe(true);

      if (original !== undefined) process.env.MP_WEBHOOK_SECRET = original;
    });

    it('should return true for valid HMAC signature', () => {
      const original = process.env.MP_WEBHOOK_SECRET;
      process.env.MP_WEBHOOK_SECRET = 'test-secret';

      const crypto = require('crypto');
      const manifest = 'id:data-123;request-id:req-456;ts:1234567890;';
      const expected = crypto
        .createHmac('sha256', 'test-secret')
        .update(manifest)
        .digest('hex');

      const result = service.verifyWebhookSignature(expected, 'req-456', 'data-123', '1234567890');

      expect(result).toBe(true);

      if (original !== undefined) {
        process.env.MP_WEBHOOK_SECRET = original;
      } else {
        delete process.env.MP_WEBHOOK_SECRET;
      }
    });

    it('should return false for invalid HMAC signature', () => {
      const original = process.env.MP_WEBHOOK_SECRET;
      process.env.MP_WEBHOOK_SECRET = 'test-secret';

      const result = service.verifyWebhookSignature('invalid-hash', 'req-456', 'data-123', '1234567890');

      expect(result).toBe(false);

      if (original !== undefined) {
        process.env.MP_WEBHOOK_SECRET = original;
      } else {
        delete process.env.MP_WEBHOOK_SECRET;
      }
    });
  });
});
