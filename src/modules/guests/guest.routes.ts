import { FastifyPluginAsync } from 'fastify';
import { GuestController } from './guest.controller';
import { GuestService } from './guest.service';
import { GuestRepository } from './guest.repository';
import {
  GuestSchema,
  CreateGuestSchema,
  UpdateGuestSchema,
  GuestParamsSchema,
  GuestQuerySchema,
  PaginatedGuestsSchema,
} from './guest.schema';
import { ErrorResponseSchema } from '../../schemas/error.schema';

import { Type } from '@sinclair/typebox';

const GuestLimitErrorSchema = Type.Object({
  error: Type.Object({
    statusCode: Type.Integer(),
    message: Type.String(),
    code: Type.Optional(Type.String()),
    currentCount: Type.Optional(Type.Integer()),
    limit: Type.Optional(Type.Integer()),
    requiredPlan: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    upgradeUrl: Type.Optional(Type.String()),
  }),
});

const guestRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', fastify.authenticate);

  const repository = new GuestRepository(fastify.prisma);
  const service = new GuestService(repository);
  const controller = new GuestController(service);

  fastify.post('/', {

    schema: {
      tags: ['guests'],
      summary: 'Create a new guest',
      body: CreateGuestSchema,
      response: {
        201: GuestSchema,
        403: GuestLimitErrorSchema,
        409: ErrorResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },
    handler: (req, reply) => controller.create(req as any, reply),
  });

  fastify.get('/', {
    schema: {
      tags: ['guests'],
      summary: 'Get all guests or filter by invitation (supports pagination)',
      querystring: GuestQuerySchema,
      response: {
        200: Type.Union([Type.Array(GuestSchema), PaginatedGuestsSchema]),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: controller.getAll.bind(controller),
  });

  fastify.get('/:id', {
    schema: {
      tags: ['guests'],
      summary: 'Get guest by ID',
      params: GuestParamsSchema,
      response: {
        200: Type.Object({
          ...GuestSchema.properties,
          invitation: Type.Union([
            Type.Object({
              id: Type.String({ format: 'uuid' }),
              name: Type.String(),
              message: Type.Union([Type.String(), Type.Null()]),
              eventDate: Type.Union([Type.String({ format: 'date' }), Type.Null()]),
              location: Type.Union([Type.String(), Type.Null()]),
              tableId: Type.Union([Type.String({ format: 'uuid' }), Type.Null()]),
              createdAt: Type.String({ format: 'date-time' }),
            }),
            Type.Null(),
          ]),
        }),
        404: ErrorResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },
    handler: controller.getById.bind(controller),
  });

  fastify.put('/:id', {

    schema: {
      tags: ['guests'],
      summary: 'Update a guest',
      params: GuestParamsSchema,
      body: UpdateGuestSchema,
      response: {
        200: GuestSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },
    handler: (req, reply) => controller.update(req as any, reply),
  });

  fastify.delete('/:id', {

    schema: {
      tags: ['guests'],
      summary: 'Delete a guest',
      params: GuestParamsSchema,
      response: {
        204: Type.Null(),
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },
    handler: (req, reply) => controller.delete(req as any, reply),
  });
};

export default guestRoutes;
