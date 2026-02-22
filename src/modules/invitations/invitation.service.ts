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

  async createInvitation(data: CreateInvitation) {
    // Verificar duplicado por nombre
    const existingByName = await this.repository.findByName(data.name);
    if (existingByName) {
      throw ConflictError('Invitation with this name already exists');
    }

    // Verificar duplicado por operationId si existe
    if (data.operationId) {
      const existingByOperationId = await this.repository.findByOperationId(data.operationId);
      if (existingByOperationId) {
        throw ConflictError('Invitation with this operationId already exists');
      }
    }

    // Validar capacidad de la mesa si se proporciona tableId
    if (data.tableId) {
      if (!this.tableService) {
        throw InternalError('TableService is required for table capacity validation');
      }
      await this.tableService.validateTableCapacity(data.tableId, 0);
    }

    return this.repository.create(data);
  }

  async createInvitationWithGuests(
    invitationData: CreateInvitation,
    guestsData: CreateGuest[]
  ) {
    if (!this.prisma) {
      throw InternalError('PrismaClient is required for transaction operations');
    }

    // Verificar duplicado por nombre
    const existingByName = await this.repository.findByName(invitationData.name);
    if (existingByName) {
      throw ConflictError('Invitation with this name already exists');
    }

    // Verificar duplicado por operationId si existe
    if (invitationData.operationId) {
      const existingByOperationId = await this.repository.findByOperationId(invitationData.operationId);
      if (existingByOperationId) {
        throw ConflictError('Invitation with this operationId already exists');
      }
    }

    // Validar capacidad de la mesa si se proporciona tableId
    if (invitationData.tableId) {
      if (!this.tableService) {
        throw InternalError('TableService is required for table capacity validation');
      }
      await this.tableService.validateTableCapacity(invitationData.tableId, guestsData.length);
    }

    return this.prisma.$transaction(async (tx: any) => {
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
    const { skip, take } = calcPaginationParams(page, limit);

    const [data, total] = await Promise.all([
      this.repository.findAll(skip, take),
      this.repository.count(),
    ]);

    return formatPaginatedResponse(data, total, page, limit);
  }

  async getInvitationById(id: string) {
    const invitation = await this.repository.findById(id);
    if (!invitation) {
      throw NotFoundError('Invitation');
    }
    return invitation;
  }

  async updateInvitation(id: string, data: UpdateInvitation) {
    const invitation = await this.getInvitationById(id);

    // Si se está actualizando el tableId, validar capacidad
    if (data.tableId !== undefined && data.tableId) {
      if (!this.tableService) {
        throw InternalError('TableService is required for table capacity validation');
      }
      // Contar los invitados de esta invitación
      const guestCount = invitation.guests?.length || 0;

      // Si está cambiando de mesa, validar la nueva mesa
      if (data.tableId !== invitation.tableId) {
        await this.tableService.validateTableCapacity(data.tableId, guestCount);
      }
    }

    return this.repository.update(id, data);
  }

  async deleteInvitation(id: string) {
    await this.getInvitationById(id);
    return this.repository.delete(id);
  }
}
