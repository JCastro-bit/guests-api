import { FastifyPluginAsync } from 'fastify';
import { InvitationController } from './invitation.controller';
import { InvitationService } from './invitation.service';
import { InvitationRepository } from './invitation.repository';
import {
  InvitationSchema,
  CreateInvitationSchema,
  UpdateInvitationSchema,
  InvitationParamsSchema,
} from './invitation.schema';
import { Type } from '@sinclair/typebox';

const invitationRoutes: FastifyPluginAsync = async (fastify) => {
  const repository = new InvitationRepository(fastify.prisma);
  const service = new InvitationService(repository);
  const controller = new InvitationController(service);

  fastify.post('/', {
    schema: {
      tags: ['invitations'],
      summary: 'Create a new invitation',
      body: CreateInvitationSchema,
      response: {
        201: InvitationSchema,
      },
    },
    handler: controller.create.bind(controller),
  });

  fastify.get('/', {
    schema: {
      tags: ['invitations'],
      summary: 'Get all invitations',
      response: {
        200: Type.Array(InvitationSchema),
      },
    },
    handler: controller.getAll.bind(controller),
  });

  fastify.get('/:id', {
    schema: {
      tags: ['invitations'],
      summary: 'Get invitation by ID',
      params: InvitationParamsSchema,
      response: {
        200: Type.Object({
          ...InvitationSchema.properties,
          guests: Type.Array(Type.Any()),
        }),
      },
    },
    handler: controller.getById.bind(controller),
  });

  fastify.put('/:id', {
    schema: {
      tags: ['invitations'],
      summary: 'Update an invitation',
      params: InvitationParamsSchema,
      body: UpdateInvitationSchema,
      response: {
        200: InvitationSchema,
      },
    },
    handler: controller.update.bind(controller),
  });

  fastify.delete('/:id', {
    schema: {
      tags: ['invitations'],
      summary: 'Delete an invitation',
      params: InvitationParamsSchema,
      response: {
        204: Type.Null(),
      },
    },
    handler: controller.delete.bind(controller),
  });
};

export default invitationRoutes;
