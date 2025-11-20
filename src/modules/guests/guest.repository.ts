import { PrismaClient } from '@prisma/client';
import { CreateGuest, UpdateGuest } from './guest.schema';

export class GuestRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateGuest) {
    return this.prisma.guest.create({
      data,
    });
  }

  async findAll(invitationId?: string, skip?: number, take?: number) {
    return this.prisma.guest.findMany({
      where: invitationId ? { invitationId } : undefined,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async count(invitationId?: string) {
    return this.prisma.guest.count({
      where: invitationId ? { invitationId } : undefined,
    });
  }

  async findByName(name: string) {
    return this.prisma.guest.findFirst({
      where: { name },
    });
  }

  async findByOperationId(operationId: string) {
    return this.prisma.guest.findFirst({
      where: { operationId },
    });
  }

  async findById(id: string) {
    return this.prisma.guest.findUnique({
      where: { id },
      include: { invitation: true },
    });
  }

  async update(id: string, data: UpdateGuest) {
    return this.prisma.guest.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.guest.delete({
      where: { id },
    });
  }
}
