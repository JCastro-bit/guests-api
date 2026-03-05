import { PrismaClient } from '@prisma/client';
import { CreateTable, UpdateTable } from './table.schema';

export class TableRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateTable, userId: string) {
    return this.prisma.table.create({
      data: { ...data, userId },
    });
  }

  async findAll(userId: string, skip?: number, take?: number) {
    return this.prisma.table.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async findAllWithStats(userId: string, skip?: number, take?: number) {
    const tables = await this.prisma.table.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        invitations: {
          where: { deletedAt: null },
          include: {
            guests: { where: { deletedAt: null } },
          },
        },
      },
    });

    return tables.map((table) => {
      const guestCount = table.invitations.reduce(
        (sum, inv) => sum + inv.guests.length,
        0
      );
      return {
        id: table.id,
        name: table.name,
        capacity: table.capacity,
        location: table.location,
        notes: table.notes,
        createdAt: table.createdAt,
        guestCount,
        available: table.capacity - guestCount,
        invitationCount: table.invitations.length,
      };
    });
  }

  async count(userId: string) {
    return this.prisma.table.count({
      where: { userId, deletedAt: null },
    });
  }

  async findByName(name: string, userId: string) {
    return this.prisma.table.findFirst({
      where: { userId, name, deletedAt: null },
    });
  }

  async findById(id: string, userId: string) {
    return this.prisma.table.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        invitations: {
          where: { deletedAt: null },
          include: {
            guests: { where: { deletedAt: null } },
          },
        },
      },
    });
  }

  async findByIdWithStats(id: string, userId: string) {
    const table = await this.findById(id, userId);
    if (!table) return null;

    const guestCount = table.invitations.reduce(
      (sum, inv) => sum + inv.guests.length,
      0
    );

    return {
      ...table,
      guestCount,
      available: table.capacity - guestCount,
    };
  }

  async update(id: string, data: UpdateTable) {
    return this.prisma.table.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.table.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async hasInvitations(id: string): Promise<boolean> {
    const count = await this.prisma.invitation.count({
      where: { tableId: id, deletedAt: null },
    });
    return count > 0;
  }

  async getGuestCountForTable(tableId: string): Promise<number> {
    const invitations = await this.prisma.invitation.findMany({
      where: { tableId, deletedAt: null },
      include: {
        guests: { where: { deletedAt: null } },
      },
    });

    return invitations.reduce((sum, inv) => sum + inv.guests.length, 0);
  }
}
