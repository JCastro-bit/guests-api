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
} from './guest.schema';
import { Type } from '@sinclair/typebox';

const guestRoutes: FastifyPluginAsync = async (fastify) => {
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
      },
    },
    handler: controller.create.bind(controller),
  });

  fastify.get('/', {
    schema: {
      tags: ['guests'],
      summary: 'Get all guests or filter by invitation',
      querystring: GuestQuerySchema,
      response: {
        200: Type.Array(GuestSchema),
      },
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
          invitation: Type.Union([Type.Any(), Type.Null()]),
        }),
      },
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
      },
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
      },
    },
    handler: controller.delete.bind(controller),
  });
};

export default guestRoutes;
