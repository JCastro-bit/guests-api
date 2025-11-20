import { FastifyRequest, FastifyReply } from 'fastify';
import { InvitationService } from '../invitations/invitation.service';

export class StatsController {
  constructor(private invitationService: InvitationService) {}

  async getDashboard(request: FastifyRequest, reply: FastifyReply) {
    const stats = await this.invitationService.getDashboardStats();
    return reply.send(stats);
  }
}
