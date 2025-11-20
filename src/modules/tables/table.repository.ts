import { PrismaClient } from '@prisma/client';
import { CreateTable, UpdateTable } from './table.schema';

export class TableRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateTable) {
    return this.prisma.table.create({
      data,
    });
  }

  async findAll(skip?: number, take?: number) {
    return this.prisma.table.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async findAllWithStats(skip?: number, take?: number) {
    const tables = await this.prisma.table.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        invitations: {
          include: {
            guests: true,
          },
        },
      },
    });

    return tables.map((table: any) => {
      const guestCount = table.invitations.reduce(
        (sum: number, inv: any) => sum + inv.guests.length,
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
      };
    });
  }

  async count() {
    return this.prisma.table.count();
  }

  async findByName(name: string) {
    return this.prisma.table.findUnique({
      where: { name },
    });
  }

  async findById(id: string) {
    return this.prisma.table.findUnique({
      where: { id },
      include: {
        invitations: {
          include: {
            guests: true,
          },
        },
      },
    });
  }

  async findByIdWithStats(id: string) {
    const table = await this.findById(id);
    if (!table) return null;

    const guestCount = table.invitations.reduce(
      (sum: number, inv: any) => sum + inv.guests.length,
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
    return this.prisma.table.delete({
      where: { id },
    });
  }

  async hasInvitations(id: string): Promise<boolean> {
    const count = await this.prisma.invitation.count({
      where: { tableId: id },
    });
    return count > 0;
  }

  async getGuestCountForTable(tableId: string): Promise<number> {
    const invitations = await this.prisma.invitation.findMany({
      where: { tableId },
      include: {
        guests: true,
      },
    });

    return invitations.reduce((sum: number, inv: any) => sum + inv.guests.length, 0);
  }
}
