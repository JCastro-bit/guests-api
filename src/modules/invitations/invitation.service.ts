import { InvitationRepository } from './invitation.repository';
import { CreateInvitation, UpdateInvitation } from './invitation.schema';
import { PrismaClient } from '@prisma/client';
import { CreateGuest } from '../guests/guest.schema';

export class InvitationService {
  constructor(
    private repository: InvitationRepository,
    private prisma?: PrismaClient
  ) {}

  async createInvitation(data: CreateInvitation) {
    // Verificar duplicado por nombre
    const existingByName = await this.repository.findByName(data.name);
    if (existingByName) {
      throw new Error('Invitation with this name already exists');
    }

    // Verificar duplicado por operationId si existe
    if (data.operationId) {
      const existingByOperationId = await this.repository.findByOperationId(data.operationId);
      if (existingByOperationId) {
        throw new Error('Invitation with this operationId already exists');
      }
    }

    return this.repository.create(data);
  }

  async createInvitationWithGuests(
    invitationData: CreateInvitation,
    guestsData: CreateGuest[]
  ) {
    if (!this.prisma) {
      throw new Error('PrismaClient is required for transaction operations');
    }

    // Verificar duplicado por nombre
    const existingByName = await this.repository.findByName(invitationData.name);
    if (existingByName) {
      throw new Error('Invitation with this name already exists');
    }

    // Verificar duplicado por operationId si existe
    if (invitationData.operationId) {
      const existingByOperationId = await this.repository.findByOperationId(invitationData.operationId);
      if (existingByOperationId) {
        throw new Error('Invitation with this operationId already exists');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // Crear la invitación
      const invitation = await tx.invitation.create({
        data: {
          ...invitationData,
          eventDate: invitationData.eventDate ? new Date(invitationData.eventDate) : null,
        },
      });

      // Crear los guests asociados
      const guests = await Promise.all(
        guestsData.map((guestData) =>
          tx.guest.create({
            data: {
              ...guestData,
              invitationId: invitation.id,
            },
          })
        )
      );

      return {
        ...invitation,
        guests,
      };
    });
  }

  async getAllInvitations(page?: number, limit?: number) {
    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit;

    const [data, total] = await Promise.all([
      this.repository.findAll(skip, take),
      this.repository.count(),
    ]);

    if (page && limit) {
      return {
        data,
        total,
        page,
        limit,
      };
    }

    return data;
  }

  async getDashboardStats() {
    const stats = await this.repository.getStatsCounts();
    const mostRecentEventDate = await this.repository.getMostRecentEventDate();

    let daysUntilWedding = 0;
    if (mostRecentEventDate) {
      const today = new Date();
      const eventDate = new Date(mostRecentEventDate);
      const diffTime = eventDate.getTime() - today.getTime();
      daysUntilWedding = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      ...stats,
      daysUntilWedding,
    };
  }

  async getInvitationById(id: string) {
    const invitation = await this.repository.findById(id);
    if (!invitation) {
      throw new Error('Invitation not found');
    }
    return invitation;
  }

  async updateInvitation(id: string, data: UpdateInvitation) {
    await this.getInvitationById(id);
    return this.repository.update(id, data);
  }

  async deleteInvitation(id: string) {
    await this.getInvitationById(id);
    return this.repository.delete(id);
  }
}
