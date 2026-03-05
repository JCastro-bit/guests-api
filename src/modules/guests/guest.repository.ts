import { PrismaClient } from '@prisma/client';
import { CreateGuest, UpdateGuest } from './guest.schema';

export class GuestRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateGuest, userId: string) {
    return this.prisma.guest.create({
      data: { ...data, userId },
    });
  }

  async findAll(userId: string, invitationId?: string, skip?: number, take?: number) {
    const where = { userId, deletedAt: null, ...(invitationId ? { invitationId } : {}) };
    return this.prisma.guest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async count(userId: string, invitationId?: string) {
    const where = { userId, deletedAt: null, ...(invitationId ? { invitationId } : {}) };
    return this.prisma.guest.count({ where });
  }

  async findByName(name: string, userId: string) {
    return this.prisma.guest.findFirst({
      where: { name, userId, deletedAt: null },
    });
  }

  async findByOperationId(operationId: string, userId: string) {
    return this.prisma.guest.findFirst({
      where: { operationId, userId, deletedAt: null },
    });
  }

  async findById(id: string, userId: string) {
    return this.prisma.guest.findFirst({
      where: { id, userId, deletedAt: null },
      include: { invitation: true },
    });
  }

  async update(id: string, userId: string, data: UpdateGuest) {
    return this.prisma.guest.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.guest.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
