import { PrismaClient } from '@prisma/client';
import { CreateInvitation, UpdateInvitation } from './invitation.schema';

export class InvitationRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateInvitation, userId: string) {
    return this.prisma.invitation.create({
      data: {
        ...data,
        userId,
        eventDate: data.eventDate ? new Date(data.eventDate) : null,
      },
      include: { table: true },
    });
  }

  async findAll(userId: string, skip?: number, take?: number) {
    return this.prisma.invitation.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { table: true },
    });
  }

  async count(userId: string) {
    return this.prisma.invitation.count({
      where: { userId, deletedAt: null },
    });
  }

  async findByName(name: string, userId: string) {
    return this.prisma.invitation.findFirst({
      where: { name, userId, deletedAt: null },
    });
  }

  async findByOperationId(operationId: string, userId: string) {
    return this.prisma.invitation.findFirst({
      where: { operationId, userId, deletedAt: null },
    });
  }

  async getMostRecentEventDate(userId: string) {
    const result = await this.prisma.invitation.findFirst({
      where: { userId, deletedAt: null, eventDate: { not: null } },
      orderBy: { eventDate: 'desc' },
      select: { eventDate: true },
    });
    return result?.eventDate || null;
  }

  async getStatsCounts(userId: string) {
    const [totalInvitations, guestStats] = await Promise.all([
      this.prisma.invitation.count({ where: { userId, deletedAt: null } }),
      this.prisma.guest.groupBy({
        by: ['status'],
        where: { userId, deletedAt: null },
        _count: true,
      }),
    ]);

    const totalGuests = guestStats.reduce((sum, stat) => sum + stat._count, 0);
    const confirmed = guestStats.find((s) => s.status === 'confirmed')?._count || 0;
    const pending = guestStats.find((s) => s.status === 'pending')?._count || 0;
    const declined = guestStats.find((s) => s.status === 'declined')?._count || 0;

    return {
      totalInvitations,
      totalGuests,
      confirmed,
      pending,
      declined,
    };
  }

  async findById(id: string, userId: string) {
    return this.prisma.invitation.findFirst({
      where: { id, userId, deletedAt: null },
      include: { guests: { where: { deletedAt: null } }, table: true },
    });
  }

  async update(id: string, data: UpdateInvitation) {
    return this.prisma.invitation.update({
      where: { id },
      data: {
        ...data,
        eventDate: data.eventDate !== undefined
          ? data.eventDate ? new Date(data.eventDate) : null
          : undefined,
      },
      include: { table: true },
    });
  }

  async delete(id: string) {
    return this.prisma.invitation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
