import { FastifyRequest, FastifyReply } from 'fastify';
import { InvitationService } from './invitation.service';
import { CreateInvitation, UpdateInvitation, InvitationParams } from './invitation.schema';

export class InvitationController {
  constructor(private service: InvitationService) {}

  async create(
    request: FastifyRequest<{ Body: CreateInvitation }>,
    reply: FastifyReply
  ) {
    const invitation = await this.service.createInvitation(request.body);
    return reply.status(201).send(invitation);
  }

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const invitations = await this.service.getAllInvitations();
    return reply.send(invitations);
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
