import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmailService } from './email.service';

const mockSendMail = vi.fn();
const mockLog = {
  info: vi.fn(),
  error: vi.fn(),
};

const mockFastify = {
  mailer: { sendMail: mockSendMail },
  log: mockLog,
} as unknown as ConstructorParameters<typeof EmailService>[0];

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(() => {
    service = new EmailService(mockFastify);
    vi.clearAllMocks();
    process.env.APP_URL = 'https://app.lovepostal.studio';
    process.env.SMTP_FROM = 'LOVEPOSTAL <noreply@lovepostal.studio>';
  });

  describe('sendWelcome', () => {
    it('should send welcome email with correct params', async () => {
      mockSendMail.mockResolvedValue(undefined);

      await service.sendWelcome('test@example.com', 'María');

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          from: 'LOVEPOSTAL <noreply@lovepostal.studio>',
        })
      );
      const call = mockSendMail.mock.calls[0][0];
      expect(call.subject).toBeDefined();
      expect(call.html).toContain('María');
      expect(mockLog.info).toHaveBeenCalledWith(
        { to: 'test@example.com', subject: call.subject },
        'Email sent'
      );
    });

    it('should log error and not throw when sendMail fails', async () => {
      mockSendMail.mockRejectedValue(new Error('SMTP down'));

      await expect(service.sendWelcome('test@example.com', 'Test')).resolves.toBeUndefined();

      expect(mockLog.error).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'test@example.com' }),
        'Email send failed'
      );
    });
  });

  describe('sendResetPassword', () => {
    it('should send reset password email with reset URL', async () => {
      mockSendMail.mockResolvedValue(undefined);

      await service.sendResetPassword('test@example.com', 'María', 'abc123token');

      const call = mockSendMail.mock.calls[0][0];
      expect(call.to).toBe('test@example.com');
      expect(call.html).toContain('https://app.lovepostal.studio/reset-password?token=abc123token');
      expect(call.subject).toBeDefined();
    });
  });

  describe('sendPaymentConfirmation', () => {
    it('should send payment confirmation email', async () => {
      mockSendMail.mockResolvedValue(undefined);

      await service.sendPaymentConfirmation('test@example.com', 'María', 'premium', 'pay-123');

      const call = mockSendMail.mock.calls[0][0];
      expect(call.to).toBe('test@example.com');
      expect(call.html).toContain('María');
      expect(call.subject).toBeDefined();
    });
  });

  describe('sendRsvpNotification', () => {
    it('should send RSVP notification email for confirmed guest', async () => {
      mockSendMail.mockResolvedValue(undefined);

      await service.sendRsvpNotification(
        'couple@example.com',
        'María y Juan',
        'Carlos',
        'confirmed',
        'Boda Principal'
      );

      const call = mockSendMail.mock.calls[0][0];
      expect(call.to).toBe('couple@example.com');
      expect(call.subject).toBeDefined();
      expect(call.html).toBeDefined();
    });

    it('should send RSVP notification email for declined guest', async () => {
      mockSendMail.mockResolvedValue(undefined);

      await service.sendRsvpNotification(
        'couple@example.com',
        'María y Juan',
        'Carlos',
        'declined',
        'Boda Principal'
      );

      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });
  });

  describe('fallback SMTP_FROM', () => {
    it('should use default from when SMTP_FROM is not set', async () => {
      delete process.env.SMTP_FROM;
      mockSendMail.mockResolvedValue(undefined);

      await service.sendWelcome('test@example.com', 'Test');

      const call = mockSendMail.mock.calls[0][0];
      expect(call.from).toBe('LOVEPOSTAL <noreply@lovepostal.studio>');
    });
  });
});
