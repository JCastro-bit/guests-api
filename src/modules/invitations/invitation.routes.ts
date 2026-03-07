import { FastifyPluginAsync } from 'fastify';
import { InvitationController } from './invitation.controller';
import { InvitationService } from './invitation.service';
import { InvitationRepository } from './invitation.repository';
import { TableRepository } from '../tables/table.repository';
import { TableService } from '../tables/table.service';
import {
  InvitationSchema,
  CreateInvitationSchema,
  UpdateInvitationSchema,
  InvitationParamsSchema,
  InvitationQuerySchema,
  PaginatedInvitationsSchema,
  CreateInvitationWithGuestsSchema,
} from './invitation.schema';
import { ErrorResponseSchema } from '../../schemas/error.schema';

import { Type } from '@sinclair/typebox';

const invitationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', fastify.authenticate);

  const repository = new InvitationRepository(fastify.prisma);
  const tableRepository = new TableRepository(fastify.prisma);
  const tableService = new TableService(tableRepository);
  const service = new InvitationService(repository, fastify.prisma, tableService);
  const controller = new InvitationController(service);

  fastify.post('/', {

    schema: {
      tags: ['invitations'],
      summary: 'Create a new invitation',
      body: CreateInvitationSchema,
      response: {
        201: InvitationSchema,
        403: ErrorResponseSchema,
        409: ErrorResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },
    handler: (req, reply) => controller.create(req as any, reply),
  });

  fastify.post('/with-guests', {

    schema: {
      tags: ['invitations'],
      summary: 'Create a new invitation with guests (atomic transaction)',
      body: CreateInvitationWithGuestsSchema,
      response: {
        201: Type.Object({
          ...InvitationSchema.properties,
          guests: Type.Array(Type.Object({
            id: Type.String({ format: 'uuid' }),
            name: Type.String(),
            side: Type.Union([Type.Literal('bride'), Type.Literal('groom')]),
            phone: Type.Union([Type.String(), Type.Null()]),
            email: Type.Union([Type.String(), Type.Null()]),
            status: Type.Union([Type.Literal('pending'), Type.Literal('confirmed'), Type.Literal('declined')]),
            invitationId: Type.Union([Type.String({ format: 'uuid' }), Type.Null()]),
            createdAt: Type.String({ format: 'date-time' }),
          })),
        }),
        403: ErrorResponseSchema,
        409: ErrorResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },
    handler: (req, reply) => controller.createWithGuests(req as any, reply),
  });

  fastify.get('/', {
    schema: {
      tags: ['invitations'],
      summary: 'Get all invitations (supports pagination)',
      querystring: InvitationQuerySchema,
      response: {
        200: Type.Union([Type.Array(InvitationSchema), PaginatedInvitationsSchema]),
      },
      security: [{ bearerAuth: [] }],
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
          guests: Type.Array(Type.Object({
            id: Type.String({ format: 'uuid' }),
            name: Type.String(),
            side: Type.Union([Type.Literal('bride'), Type.Literal('groom')]),
            phone: Type.Union([Type.String(), Type.Null()]),
            email: Type.Union([Type.String(), Type.Null()]),
            status: Type.Union([Type.Literal('pending'), Type.Literal('confirmed'), Type.Literal('declined')]),
            invitationId: Type.Union([Type.String({ format: 'uuid' }), Type.Null()]),
            createdAt: Type.String({ format: 'date-time' }),
          })),
        }),
        404: ErrorResponseSchema,
      },
      security: [{ bearerAuth: [] }],
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
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        409: ErrorResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },
    handler: (req, reply) => controller.update(req as any, reply),
  });

  fastify.delete('/:id', {

    schema: {
      tags: ['invitations'],
      summary: 'Delete an invitation',
      params: InvitationParamsSchema,
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

export default invitationRoutes;
