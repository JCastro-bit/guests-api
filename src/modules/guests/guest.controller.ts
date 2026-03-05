import { FastifyRequest, FastifyReply } from 'fastify';
import { GuestService } from './guest.service';
import { CreateGuest, UpdateGuest, GuestParams, GuestQuery } from './guest.schema';
import { assertValidUUID } from '../../lib/uuid';

export class GuestController {
  constructor(private service: GuestService) {}

  async create(
    request: FastifyRequest<{ Body: CreateGuest }>,
    reply: FastifyReply
  ) {
    const userId = request.user.id;
    const guest = await this.service.createGuest(request.body, userId);
    return reply.status(201).send(guest);
  }

  async getAll(
    request: FastifyRequest<{ Querystring: GuestQuery }>,
    reply: FastifyReply
  ) {
    const userId = request.user.id;
    const { invitationId, page, limit } = request.query;
    const guests = await this.service.getAllGuests(userId, invitationId, page, limit);
    return reply.send(guests);
  }

  async getById(
    request: FastifyRequest<{ Params: GuestParams }>,
    reply: FastifyReply
  ) {
    const userId = request.user.id;
    assertValidUUID(request.params.id);
    const guest = await this.service.getGuestById(request.params.id, userId);
    return reply.send(guest);
  }

  async update(
    request: FastifyRequest<{ Params: GuestParams; Body: UpdateGuest }>,
    reply: FastifyReply
  ) {
    const userId = request.user.id;
    assertValidUUID(request.params.id);
    const guest = await this.service.updateGuest(request.params.id, userId, request.body);
    return reply.send(guest);
  }

  async delete(
    request: FastifyRequest<{ Params: GuestParams }>,
    reply: FastifyReply
  ) {
    const userId = request.user.id;
    assertValidUUID(request.params.id);
    await this.service.deleteGuest(request.params.id, userId);
    return reply.status(204).send();
  }
}
