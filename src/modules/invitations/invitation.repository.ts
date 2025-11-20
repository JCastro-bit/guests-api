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
    });
  }

  async findAll() {
    return this.prisma.invitation.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.invitation.findUnique({
      where: { id },
      include: { guests: true },
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
    });
  }

  async delete(id: string) {
    return this.prisma.invitation.delete({
      where: { id },
    });
  }
}
