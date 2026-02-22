import { FastifyRequest, FastifyReply } from 'fastify';
import { StatsService } from './stats.service';

export class StatsController {
  constructor(private statsService: StatsService) {}

  async getDashboard(request: FastifyRequest, reply: FastifyReply) {
    const stats = await this.statsService.getDashboardStats();
    return reply.send(stats);
  }

  async getTableStats(request: FastifyRequest, reply: FastifyReply) {
    const stats = await this.statsService.getTableStats();
    return reply.send(stats);
  }
}
