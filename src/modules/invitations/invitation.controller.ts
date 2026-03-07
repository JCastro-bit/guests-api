import { FastifyRequest, FastifyReply } from 'fastify';
import { InvitationService } from './invitation.service';
import {
  CreateInvitation,
  UpdateInvitation,
  InvitationParams,
  InvitationQuery,
  CreateInvitationWithGuests,
} from './invitation.schema';
import { assertValidUUID } from '../../lib/uuid';

export class InvitationController {
  constructor(private service: InvitationService) {}

  async create(
    request: FastifyRequest<{ Body: CreateInvitation }>,
    reply: FastifyReply
  ) {
    const userId = request.user.id;

    const limitError = await this.checkFreeInvitationLimit(request, userId);
    if (limitError) return reply.status(403).send(limitError);

    const invitation = await this.service.createInvitation(request.body, userId);
    return reply.status(201).send(invitation);
  }

  async createWithGuests(
    request: FastifyRequest<{ Body: CreateInvitationWithGuests }>,
    reply: FastifyReply
  ) {
    const userId = request.user.id;

    const limitError = await this.checkFreeInvitationLimit(request, userId);
    if (limitError) return reply.status(403).send(limitError);

    const { invitation, guests } = request.body;
    const result = await this.service.createInvitationWithGuests(invitation, guests, userId);
    return reply.status(201).send(result);
  }

  private async checkFreeInvitationLimit(request: FastifyRequest, userId: string) {
    const user = await request.server.prisma.user.findFirst({
      where: { id: userId },
      select: { plan: true },
    });

    if (user?.plan === 'free') {
      const count = await request.server.prisma.invitation.count({
        where: { userId, deletedAt: null },
      });
      if (count >= 1) {
        return {
          statusCode: 403,
          error: 'INVITATION_LIMIT_EXCEEDED',
          message: 'El plan gratuito permite 1 invitación. Actualiza al Plan Esencial para invitaciones ilimitadas.',
          requiredPlan: 'esencial',
          upgradeUrl: 'https://app.lovepostal.studio/upgrade',
        };
      }
    }
    return null;
  }

  async getAll(
    request: FastifyRequest<{ Querystring: InvitationQuery }>,
    reply: FastifyReply
  ) {
    const userId = request.user.id;
    const { page, limit } = request.query;
    const invitations = await this.service.getAllInvitations(userId, page, limit);
    return reply.send(invitations);
  }

  async getById(
    request: FastifyRequest<{ Params: InvitationParams }>,
    reply: FastifyReply
  ) {
    const userId = request.user.id;
    assertValidUUID(request.params.id);
    const invitation = await this.service.getInvitationById(request.params.id, userId);
    return reply.send(invitation);
  }

  async update(
    request: FastifyRequest<{ Params: InvitationParams; Body: UpdateInvitation }>,
    reply: FastifyReply
  ) {
    const userId = request.user.id;
    assertValidUUID(request.params.id);
    const invitation = await this.service.updateInvitation(request.params.id, userId, request.body);
    return reply.send(invitation);
  }

  async delete(
    request: FastifyRequest<{ Params: InvitationParams }>,
    reply: FastifyReply
  ) {
    const userId = request.user.id;
    assertValidUUID(request.params.id);
    await this.service.deleteInvitation(request.params.id, userId);
    return reply.status(204).send();
  }
}
