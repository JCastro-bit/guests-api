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
        409: ErrorResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },
    handler: controller.create.bind(controller),
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
        404: ErrorResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },
    handler: controller.update.bind(controller),
  });

  fastify.delete('/:id', {
    schema: {
      tags: ['guests'],
      summary: 'Delete a guest',
      params: GuestParamsSchema,
      response: {
        204: Type.Null(),
        404: ErrorResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },
    handler: controller.delete.bind(controller),
  });
};

export default guestRoutes;
