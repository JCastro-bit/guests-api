import crypto from 'crypto';
import type { FastifyInstance } from 'fastify';
import { EmailService } from '../email/email.service';

const PLAN_PRICES = {
  esencial: {
    amount: 1499,
    label: 'LOVEPOSTAL — Plan Esencial',
    description: 'LOVEPOSTAL Plan Esencial - Invitaciones digitales para boda',
  },
  premium: {
    amount: 2999,
    label: 'LOVEPOSTAL — Plan Premium',
    description: 'LOVEPOSTAL Plan Premium - Invitaciones digitales para boda',
  },
} as const;

type PlanKey = keyof typeof PLAN_PRICES;

export class PaymentService {
  private emailService: EmailService;

  constructor(private readonly fastify: FastifyInstance) {
    this.emailService = new EmailService(fastify);
  }

  async createPreference(userId: string, plan: PlanKey) {
    const user = await this.fastify.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const { amount, label, description } = PLAN_PRICES[plan];
    const nameParts = (user.name ?? '').trim().split(/\s+/);
    const firstName = nameParts[0] || undefined;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined;

    const preference = await this.fastify.mp.preference.create({
      body: {
        items: [
          {
            id: `plan-${plan}`,
            title: label,
            description,
            category_id: 'services',
            quantity: 1,
            unit_price: amount,
            currency_id: 'MXN',
          },
        ],
        payment_methods: {
          installments: 24,
          default_installments: 1,
          excluded_payment_types: [],
        },
        payer: {
          email: user.email,
          first_name: firstName,
          last_name: lastName,
        },
        back_urls: {
          success: `${process.env.APP_URL}/upgrade/success`,
          failure: `${process.env.APP_URL}/upgrade/failure`,
          pending: `${process.env.APP_URL}/upgrade/pending`,
        },
        auto_return: 'approved',
        external_reference: `${userId}:${plan}:${Date.now()}`,
        notification_url: `${process.env.API_URL ?? 'https://api.lovepostal.studio'}/api/v1/payments/webhook`,
        statement_descriptor: 'LOVEPOSTAL',
      },
    });

    return {
      preferenceId: preference.id ?? '',
      initPoint: preference.init_point ?? '',
      sandboxInitPoint: preference.sandbox_init_point ?? '',
    };
  }

  async processWebhook(paymentId: string): Promise<void> {
    const payment = await this.fastify.mp.payment.get({ id: Number(paymentId) });

    if (payment.status !== 'approved') {
      this.fastify.log.info({ paymentId, status: payment.status }, 'Payment not approved, skipping');
      return;
    }

    const externalRef = payment.external_reference ?? '';
    const [userId, plan] = externalRef.split(':');

    if (!userId || !plan) {
      this.fastify.log.error({ externalRef }, 'Invalid external_reference in webhook');
      return;
    }

    const user = await this.fastify.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      this.fastify.log.error({ userId }, 'User not found for payment');
      return;
    }

    if (user.planStatus === 'active' && user.mpPaymentId === String(paymentId)) {
      this.fastify.log.info({ userId, paymentId }, 'Payment already processed, skipping');
      return;
    }

    await this.fastify.prisma.user.update({
      where: { id: userId },
      data: {
        plan: plan as 'esencial' | 'premium',
        planStatus: 'active',
        planActivatedAt: new Date(),
        mpPaymentId: String(paymentId),
      },
    });

    this.fastify.log.info({ userId, plan, paymentId }, 'Plan activated');

    this.emailService
      .sendPaymentConfirmation(user.email, user.name ?? 'Usuario', plan, String(paymentId))
      .catch(() => {});
  }

  verifyWebhookSignature(
    xSignature: string,
    xRequestId: string,
    dataId: string,
    ts: string
  ): boolean {
    const secret = process.env.MP_WEBHOOK_SECRET;
    if (!secret) return true;

    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(manifest)
      .digest('hex');

    return expected === xSignature;
  }
}
