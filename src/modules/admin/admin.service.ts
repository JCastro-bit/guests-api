import { PrismaClient } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { NotFoundError } from '../../errors/app-error';

export class AdminService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly emailService: EmailService,
  ) {}

  async activatePlan(userId: string, plan: 'esencial' | 'premium') {
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
    });
    if (!user) throw NotFoundError('User');

    const now = new Date();
    const mpPaymentId = `manual-${Date.now()}`;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        plan,
        planStatus: 'active',
        planActivatedAt: now,
        mpPaymentId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        planStatus: true,
        planActivatedAt: true,
      },
    });

    this.emailService
      .sendPaymentConfirmation(updated.email, updated.name ?? '', plan, mpPaymentId)
      .catch((err: unknown) => {
        console.error('[Admin] Payment confirmation email failed:', err);
      });

    return {
      userId: updated.id,
      email: updated.email,
      plan: updated.plan,
      planStatus: updated.planStatus,
      planActivatedAt: updated.planActivatedAt!.toISOString(),
    };
  }
}
