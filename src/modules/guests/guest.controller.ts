import { FastifyRequest, FastifyReply } from 'fastify';
import { GuestService } from './guest.service';
import { CreateGuest, UpdateGuest, GuestParams, GuestQuery } from './guest.schema';

export class GuestController {
  constructor(private service: GuestService) {}

  async create(
    request: FastifyRequest<{ Body: CreateGuest }>,
    reply: FastifyReply
  ) {
    const guest = await this.service.createGuest(request.body);
    return reply.status(201).send(guest);
  }

  async getAll(
    request: FastifyRequest<{ Querystring: GuestQuery }>,
    reply: FastifyReply
  ) {
    const guests = await this.service.getAllGuests(request.query.invitationId);
    return reply.send(guests);
  }

  async getById(
    request: FastifyRequest<{ Params: GuestParams }>,
    reply: FastifyReply
  ) {
    const guest = await this.service.getGuestById(request.params.id);
    return reply.send(guest);
  }

  async update(
    request: FastifyRequest<{ Params: GuestParams; Body: UpdateGuest }>,
    reply: FastifyReply
  ) {
    const guest = await this.service.updateGuest(request.params.id, request.body);
    return reply.send(guest);
  }

  async delete(
    request: FastifyRequest<{ Params: GuestParams }>,
    reply: FastifyReply
  ) {
    await this.service.deleteGuest(request.params.id);
    return reply.status(204).send();
  }
}
