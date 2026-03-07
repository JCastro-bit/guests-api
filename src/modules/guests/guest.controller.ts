import { FastifyRequest, FastifyReply } from 'fastify';
import { GuestService } from './guest.service';
import { CreateGuest, UpdateGuest, GuestParams, GuestQuery } from './guest.schema';
import { assertValidUUID } from '../../lib/uuid';

const GUEST_LIMITS: Record<string, number> = { free: 50, esencial: 150, premium: 500 };
const NEXT_PLAN: Record<string, string | null> = { free: 'esencial', esencial: 'premium', premium: null };

export class GuestController {
  constructor(private service: GuestService) {}

  async create(
    request: FastifyRequest<{ Body: CreateGuest }>,
    reply: FastifyReply
  ) {
    const userId = request.user.id;

    const user = await request.server.prisma.user.findFirst({
      where: { id: userId },
      select: { plan: true },
    });

    const plan = user?.plan ?? 'free';
    const limit = GUEST_LIMITS[plan] ?? 50;
    const count = await request.server.prisma.guest.count({
      where: { userId, deletedAt: null },
    });

    if (count >= limit) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'GUEST_LIMIT_EXCEEDED',
        message: 'Has alcanzado el límite de invitados de tu plan',
        currentCount: count,
        limit,
        requiredPlan: NEXT_PLAN[plan],
        upgradeUrl: 'https://app.lovepostal.studio/upgrade',
      });
    }

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
