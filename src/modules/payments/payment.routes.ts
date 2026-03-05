import { FastifyPluginAsync } from 'fastify';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import {
  CreatePreferenceBodySchema,
  PreferenceResponseSchema,
  WebhookBodySchema,
  WebhookResponseSchema,
} from './payment.schema';
import { ErrorResponseSchema } from '../../schemas/error.schema';
import { Type } from '@sinclair/typebox';

const paymentRoutes: FastifyPluginAsync = async (fastify) => {
  const service = new PaymentService(fastify);
  const controller = new PaymentController(service);

  fastify.post('/create-preference', {
    schema: {
      tags: ['payments'],
      summary: 'Create MercadoPago payment preference',
      body: CreatePreferenceBodySchema,
      response: {
        201: PreferenceResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },
    preHandler: [fastify.authenticate],
    handler: controller.createPreference.bind(controller),
  });

  fastify.post('/webhook', {
    schema: {
      tags: ['payments'],
      summary: 'MercadoPago webhook notification',
      body: WebhookBodySchema,
      response: {
        200: WebhookResponseSchema,
        401: ErrorResponseSchema,
      },
    },
    handler: controller.webhook.bind(controller),
  });
};

export default paymentRoutes;
