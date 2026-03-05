import type { FastifyInstance } from 'fastify';
import { welcomeTemplate } from './templates/welcome';
import { resetPasswordTemplate } from './templates/reset-password';
import { paymentConfirmationTemplate } from './templates/payment-confirmation';
import { rsvpNotificationTemplate } from './templates/rsvp-notification';

export class EmailService {
  constructor(private readonly fastify: FastifyInstance) {}

  async sendWelcome(to: string, name: string): Promise<void> {
    const { subject, html } = welcomeTemplate(name);
    await this.send(to, subject, html);
  }

  async sendResetPassword(to: string, name: string, token: string): Promise<void> {
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;
    const { subject, html } = resetPasswordTemplate(name, resetUrl);
    await this.send(to, subject, html);
  }

  async sendPaymentConfirmation(
    to: string,
    name: string,
    plan: string,
    paymentId: string
  ): Promise<void> {
    const { subject, html } = paymentConfirmationTemplate(name, plan, paymentId);
    await this.send(to, subject, html);
  }

  async sendRsvpNotification(
    to: string,
    coupleName: string,
    guestName: string,
    status: 'confirmed' | 'declined',
    invitationName: string
  ): Promise<void> {
    const { subject, html } = rsvpNotificationTemplate(
      coupleName,
      guestName,
      status,
      invitationName
    );
    await this.send(to, subject, html);
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.fastify.mailer.sendMail({
        from: process.env.SMTP_FROM ?? 'LOVEPOSTAL <noreply@lovepostal.studio>',
        to,
        subject,
        html,
      });
      this.fastify.log.info({ to, subject }, 'Email sent');
    } catch (err) {
      this.fastify.log.error({ err, to, subject }, 'Email send failed');
    }
  }
}
