import { TableRepository } from './table.repository';
import { CreateTable, UpdateTable } from './table.schema';
import { ConflictError, NotFoundError } from '../../errors/app-error';
import { calcPaginationParams, formatPaginatedResponse } from '../../utils/pagination';

export class TableService {
  constructor(private repository: TableRepository) {}

  async createTable(data: CreateTable, userId: string) {
    const existingTable = await this.repository.findByName(data.name, userId);
    if (existingTable) {
      throw ConflictError('Table with this name already exists');
    }

    return this.repository.create(data, userId);
  }

  async getAllTables(userId: string, page?: number, limit?: number) {
    if (page !== undefined && limit !== undefined) {
      const { skip, take } = calcPaginationParams(page, limit);
      const [data, total] = await Promise.all([
        this.repository.findAllWithStats(userId, skip, take),
        this.repository.count(userId),
      ]);
      return formatPaginatedResponse(data, total, page, limit);
    }

    return this.repository.findAllWithStats(userId);
  }

  async getTableById(id: string, userId: string) {
    const table = await this.repository.findByIdWithStats(id, userId);
    if (!table) {
      throw NotFoundError('Table');
    }
    return table;
  }

  async updateTable(id: string, userId: string, data: UpdateTable) {
    await this.getTableById(id, userId);

    if (data.name) {
      const existingTable = await this.repository.findByName(data.name, userId);
      if (existingTable && existingTable.id !== id) {
        throw ConflictError('Table with this name already exists');
      }
    }

    if (data.capacity !== undefined) {
      const currentTable = await this.repository.findById(id, userId);
      if (currentTable) {
        const guestCount = await this.repository.getGuestCountForTable(id);
        if (data.capacity < guestCount) {
          throw ConflictError(
            `Cannot reduce capacity below current guest count (${guestCount} guests)`
          );
        }
      }
    }

    return this.repository.update(id, data);
  }

  async deleteTable(id: string, userId: string) {
    await this.getTableById(id, userId);

    const hasInvitations = await this.repository.hasInvitations(id);
    if (hasInvitations) {
      throw ConflictError('Cannot delete table with assigned invitations');
    }

    return this.repository.delete(id);
  }

  async validateTableCapacity(tableId: string, userId: string, additionalGuests: number = 0): Promise<void> {
    const table = await this.repository.findById(tableId, userId);
    if (!table) {
      throw NotFoundError('Table');
    }

    const currentGuestCount = await this.repository.getGuestCountForTable(tableId);
    const totalGuests = currentGuestCount + additionalGuests;

    if (totalGuests > table.capacity) {
      throw ConflictError(
        `Table capacity exceeded (${totalGuests}/${table.capacity})`
      );
    }
  }
}
