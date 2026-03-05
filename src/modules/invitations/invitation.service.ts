import { InvitationRepository } from './invitation.repository';
import { CreateInvitation, UpdateInvitation } from './invitation.schema';
import { PrismaClient } from '@prisma/client';
import { CreateGuest } from '../guests/guest.schema';
import { TableService } from '../tables/table.service';
import { ConflictError, NotFoundError, InternalError } from '../../errors/app-error';
import { calcPaginationParams, formatPaginatedResponse } from '../../utils/pagination';

export class InvitationService {
  constructor(
    private repository: InvitationRepository,
    private prisma?: PrismaClient,
    private tableService?: TableService
  ) {}

  async createInvitation(data: CreateInvitation, userId: string) {
    const existingByName = await this.repository.findByName(data.name, userId);
    if (existingByName) {
      throw ConflictError('Invitation with this name already exists');
    }

    if (data.operationId) {
      const existingByOperationId = await this.repository.findByOperationId(data.operationId, userId);
      if (existingByOperationId) {
        throw ConflictError('Invitation with this operationId already exists');
      }
    }

    if (data.tableId) {
      if (!this.tableService) {
        throw InternalError('TableService is required for table capacity validation');
      }
      await this.tableService.validateTableCapacity(data.tableId, userId, 0);
    }

    return this.repository.create(data, userId);
  }

  async createInvitationWithGuests(
    invitationData: CreateInvitation,
    guestsData: CreateGuest[],
    userId: string
  ) {
    if (!this.prisma) {
      throw InternalError('PrismaClient is required for transaction operations');
    }

    const existingByName = await this.repository.findByName(invitationData.name, userId);
    if (existingByName) {
      throw ConflictError('Invitation with this name already exists');
    }

    if (invitationData.operationId) {
      const existingByOperationId = await this.repository.findByOperationId(invitationData.operationId, userId);
      if (existingByOperationId) {
        throw ConflictError('Invitation with this operationId already exists');
      }
    }

    if (invitationData.tableId) {
      if (!this.tableService) {
        throw InternalError('TableService is required for table capacity validation');
      }
      await this.tableService.validateTableCapacity(invitationData.tableId, userId, guestsData.length);
    }

    return this.prisma.$transaction(async (tx) => {
      const invitation = await tx.invitation.create({
        data: {
          ...invitationData,
          userId,
          eventDate: invitationData.eventDate ? new Date(invitationData.eventDate) : null,
        },
      });

      const guests = await Promise.all(
        guestsData.map((guestData) =>
          tx.guest.create({
            data: {
              ...guestData,
              userId,
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

  async getAllInvitations(userId: string, page?: number, limit?: number) {
    const { skip, take } = calcPaginationParams(page, limit);

    const [data, total] = await Promise.all([
      this.repository.findAll(userId, skip, take),
      this.repository.count(userId),
    ]);

    return formatPaginatedResponse(data, total, page, limit);
  }

  async getInvitationById(id: string, userId: string) {
    const invitation = await this.repository.findById(id, userId);
    if (!invitation) {
      throw NotFoundError('Invitation');
    }
    return invitation;
  }

  async updateInvitation(id: string, userId: string, data: UpdateInvitation) {
    const invitation = await this.getInvitationById(id, userId);

    if (data.tableId !== undefined && data.tableId) {
      if (!this.tableService) {
        throw InternalError('TableService is required for table capacity validation');
      }
      const guestCount = invitation.guests?.length || 0;

      if (data.tableId !== invitation.tableId) {
        await this.tableService.validateTableCapacity(data.tableId, userId, guestCount);
      }
    }

    return this.repository.update(id, data);
  }

  async deleteInvitation(id: string, userId: string) {
    await this.getInvitationById(id, userId);
    return this.repository.delete(id);
  }
}
