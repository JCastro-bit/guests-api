import type { FastifyRequest, FastifyReply } from 'fastify';
import { PaymentService } from './payment.service';

export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  async createPreference(request: FastifyRequest, reply: FastifyReply) {
    const { plan } = request.body as { plan: 'esencial' | 'premium' };
    const userId = request.user.id;

    const result = await this.service.createPreference(userId, plan);
    return reply.status(201).send(result);
  }

  async webhook(request: FastifyRequest, reply: FastifyReply) {
    const headers = request.headers;
    const body = request.body as { type: string; data: { id: string } };

    const xSignature = (headers['x-signature'] as string) ?? '';
    const xRequestId = (headers['x-request-id'] as string) ?? '';
    const ts = xSignature.split(',').find((p) => p.startsWith('ts='))?.split('=')[1] ?? '';
    const v1 = xSignature.split(',').find((p) => p.startsWith('v1='))?.split('=')[1] ?? '';

    if (!this.service.verifyWebhookSignature(v1, xRequestId, body.data.id, ts)) {
      return reply.status(401).send({ error: 'Invalid webhook signature' });
    }

    if (body.type !== 'payment') {
      return reply.status(200).send({ received: true });
    }

    reply.status(200).send({ received: true });

    await this.service.processWebhook(body.data.id).catch((err) => {
      request.log.error({ err }, 'Webhook processing failed');
    });
  }
}
