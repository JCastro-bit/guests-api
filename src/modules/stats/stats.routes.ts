import { FastifyPluginAsync } from 'fastify';
import { StatsController } from './stats.controller';
import { InvitationService } from '../invitations/invitation.service';
import { InvitationRepository } from '../invitations/invitation.repository';
import { DashboardStatsSchema } from './stats.schema';

const statsRoutes: FastifyPluginAsync = async (fastify) => {
  const repository = new InvitationRepository(fastify.prisma);
  const service = new InvitationService(repository, fastify.prisma);
  const controller = new StatsController(service);

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
};

export default statsRoutes;
