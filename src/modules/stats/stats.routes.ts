import { FastifyPluginAsync } from 'fastify';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { InvitationRepository } from '../invitations/invitation.repository';
import { TableService } from '../tables/table.service';
import { TableRepository } from '../tables/table.repository';
import { DashboardStatsSchema, TableStatsSchema } from './stats.schema';

const statsRoutes: FastifyPluginAsync = async (fastify) => {
  const invitationRepository = new InvitationRepository(fastify.prisma);

  const tableRepository = new TableRepository(fastify.prisma);
  const tableService = new TableService(tableRepository);

  const statsService = new StatsService(invitationRepository, tableService);
  const controller = new StatsController(statsService);

  fastify.get('/dashboard', {
    schema: {
      tags: ['stats'],
      summary: 'Get dashboard statistics',
      response: {
        200: DashboardStatsSchema,
      },
    },
    handler: controller.getDashboard.bind(controller),
  });

  fastify.get('/tables', {
    schema: {
      tags: ['stats'],
      summary: 'Get table statistics',
      response: {
        200: TableStatsSchema,
      },
    },
    handler: controller.getTableStats.bind(controller),
  });
};

export default statsRoutes;
