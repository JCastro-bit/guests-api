import { FastifyPluginAsync } from 'fastify';
import { TableController } from './table.controller';
import { TableService } from './table.service';
import { TableRepository } from './table.repository';
import {
  TableSchema,
  CreateTableSchema,
  UpdateTableSchema,
  TableParamsSchema,
  TableQuerySchema,
  PaginatedTablesSchema,
  TableWithStatsSchema,
} from './table.schema';
import { Type } from '@sinclair/typebox';

const tableRoutes: FastifyPluginAsync = async (fastify) => {
  const repository = new TableRepository(fastify.prisma);
  const service = new TableService(repository);
  const controller = new TableController(service);

  fastify.post('/', {
    schema: {
      tags: ['tables'],
      summary: 'Create a new table',
      body: CreateTableSchema,
      response: {
        201: TableSchema,
      },
    },
    handler: controller.create.bind(controller),
  });

  fastify.get('/', {
    schema: {
      tags: ['tables'],
      summary: 'Get all tables with stats (supports pagination)',
      querystring: TableQuerySchema,
      response: {
        200: Type.Union([
          Type.Array(Type.Object({
            id: Type.String({ format: 'uuid' }),
            name: Type.String(),
            capacity: Type.Integer(),
            location: Type.Union([Type.String(), Type.Null()]),
            notes: Type.Union([Type.String(), Type.Null()]),
            createdAt: Type.String({ format: 'date-time' }),
            guestCount: Type.Integer(),
            available: Type.Integer(),
          })),
          Type.Object({
            data: Type.Array(Type.Object({
              id: Type.String({ format: 'uuid' }),
              name: Type.String(),
              capacity: Type.Integer(),
              location: Type.Union([Type.String(), Type.Null()]),
              notes: Type.Union([Type.String(), Type.Null()]),
              createdAt: Type.String({ format: 'date-time' }),
              guestCount: Type.Integer(),
              available: Type.Integer(),
            })),
            total: Type.Integer(),
            page: Type.Integer(),
            limit: Type.Integer(),
          }),
        ]),
      },
    },
    handler: controller.getAll.bind(controller),
  });

  fastify.get('/:id', {
    schema: {
      tags: ['tables'],
      summary: 'Get table by ID with invitations and guests',
      params: TableParamsSchema,
      response: {
        200: TableWithStatsSchema,
      },
    },
    handler: controller.getById.bind(controller),
  });

  fastify.put('/:id', {
    schema: {
      tags: ['tables'],
      summary: 'Update a table',
      params: TableParamsSchema,
      body: UpdateTableSchema,
      response: {
        200: TableSchema,
      },
    },
    handler: controller.update.bind(controller),
  });

  fastify.delete('/:id', {
    schema: {
      tags: ['tables'],
      summary: 'Delete a table (only if no invitations assigned)',
      params: TableParamsSchema,
      response: {
        204: Type.Null(),
      },
    },
    handler: controller.delete.bind(controller),
  });
};

export default tableRoutes;
