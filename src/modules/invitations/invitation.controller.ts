import { FastifyRequest, FastifyReply } from 'fastify';
import { InvitationService } from './invitation.service';
import {
  CreateInvitation,
  UpdateInvitation,
  InvitationParams,
  InvitationQuery,
  CreateInvitationWithGuests,
} from './invitation.schema';

export class InvitationController {
  constructor(private service: InvitationService) {}

  async create(
    request: FastifyRequest<{ Body: CreateInvitation }>,
    reply: FastifyReply
  ) {
    const invitation = await this.service.createInvitation(request.body);
    return reply.status(201).send(invitation);
  }

  async createWithGuests(
    request: FastifyRequest<{ Body: CreateInvitationWithGuests }>,
    reply: FastifyReply
  ) {
    const { invitation, guests } = request.body;
    const result = await this.service.createInvitationWithGuests(invitation, guests);
    return reply.status(201).send(result);
  }

  async getAll(
    request: FastifyRequest<{ Querystring: InvitationQuery }>,
    reply: FastifyReply
  ) {
    const { page, limit } = request.query;
    const invitations = await this.service.getAllInvitations(page, limit);
    return reply.send(invitations);
  }

  async getDashboardStats(request: FastifyRequest, reply: FastifyReply) {
    const stats = await this.service.getDashboardStats();
    return reply.send(stats);
  }

  async getById(
    request: FastifyRequest<{ Params: InvitationParams }>,
    reply: FastifyReply
  ) {
    const invitation = await this.service.getInvitationById(request.params.id);
    return reply.send(invitation);
  }

  async update(
    request: FastifyRequest<{ Params: InvitationParams; Body: UpdateInvitation }>,
    reply: FastifyReply
  ) {
    const invitation = await this.service.updateInvitation(request.params.id, request.body);
    return reply.send(invitation);
  }

  async delete(
    request: FastifyRequest<{ Params: InvitationParams }>,
    reply: FastifyReply
  ) {
    await this.service.deleteInvitation(request.params.id);
    return reply.status(204).send();
  }
}
