import { FastifyRequest, FastifyReply } from 'fastify';
import { StatsService } from './stats.service';

export class StatsController {
  constructor(private statsService: StatsService) {}

  async getDashboard(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.id;
    const stats = await this.statsService.getDashboardStats(userId);
    return reply.send(stats);
  }

  async getTableStats(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.id;
    const stats = await this.statsService.getTableStats(userId);
    return reply.send(stats);
  }
}
