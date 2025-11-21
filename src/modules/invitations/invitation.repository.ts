import { PrismaClient } from '@prisma/client';
import { CreateInvitation, UpdateInvitation } from './invitation.schema';

export class InvitationRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateInvitation) {
    return this.prisma.invitation.create({
      data: {
        ...data,
        eventDate: data.eventDate ? new Date(data.eventDate) : null,
      },
      include: { table: true },
    });
  }

  async findAll(skip?: number, take?: number) {
    return this.prisma.invitation.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { table: true },
    });
  }

  async count() {
    return this.prisma.invitation.count();
  }

  async findByName(name: string) {
    return this.prisma.invitation.findFirst({
      where: { name },
    });
  }

  async findByOperationId(operationId: string) {
    return this.prisma.invitation.findFirst({
      where: { operationId },
    });
  }

  async getMostRecentEventDate() {
    const result = await this.prisma.invitation.findFirst({
      where: { eventDate: { not: null } },
      orderBy: { eventDate: 'desc' },
      select: { eventDate: true },
    });
    return result?.eventDate || null;
  }

  async getStatsCounts() {
    const [totalInvitations, guestStats] = await Promise.all([
      this.prisma.invitation.count(),
      this.prisma.guest.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    const totalGuests = guestStats.reduce((sum: number, stat: any) => sum + stat._count, 0);
    const confirmed = guestStats.find((s: any) => s.status === 'confirmed')?._count || 0;
    const pending = guestStats.find((s: any) => s.status === 'pending')?._count || 0;
    const declined = guestStats.find((s: any) => s.status === 'declined')?._count || 0;

    return {
      totalInvitations,
      totalGuests,
      confirmed,
      pending,
      declined,
    };
  }

  async findById(id: string) {
    return this.prisma.invitation.findUnique({
      where: { id },
      include: { guests: true, table: true },
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
    return this.prisma.invitation.delete({
      where: { id },
    });
  }
}
