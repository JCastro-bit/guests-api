import { TableRepository } from './table.repository';
import { CreateTable, UpdateTable } from './table.schema';
import { ConflictError, NotFoundError } from '../../errors/app-error';
import { calcPaginationParams, formatPaginatedResponse } from '../../utils/pagination';

export class TableService {
  constructor(private repository: TableRepository) {}

  async createTable(data: CreateTable) {
    // Verificar que no exista una mesa con el mismo nombre
    const existingTable = await this.repository.findByName(data.name);
    if (existingTable) {
      throw ConflictError('Table with this name already exists');
    }

    return this.repository.create(data);
  }

  async getAllTables(page?: number, limit?: number) {
    if (page !== undefined && limit !== undefined) {
      const { skip, take } = calcPaginationParams(page, limit);
      const [data, total] = await Promise.all([
        this.repository.findAllWithStats(skip, take),
        this.repository.count(),
      ]);
      return formatPaginatedResponse(data, total, page, limit);
    }

    return this.repository.findAllWithStats();
  }

  async getTableById(id: string) {
    const table = await this.repository.findByIdWithStats(id);
    if (!table) {
      throw NotFoundError('Table');
    }
    return table;
  }

  async updateTable(id: string, data: UpdateTable) {
    // Verificar que la mesa exista
    await this.getTableById(id);

    // Si se está actualizando el nombre, verificar que no exista otra mesa con ese nombre
    if (data.name) {
      const existingTable = await this.repository.findByName(data.name);
      if (existingTable && existingTable.id !== id) {
        throw ConflictError('Table with this name already exists');
      }
    }

    // Si se está reduciendo la capacidad, verificar que no haya más invitados que la nueva capacidad
    if (data.capacity !== undefined) {
      const currentTable = await this.repository.findById(id);
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

  async deleteTable(id: string) {
    // Verificar que la mesa exista
    await this.getTableById(id);

    // Verificar que no tenga invitaciones asignadas
    const hasInvitations = await this.repository.hasInvitations(id);
    if (hasInvitations) {
      throw ConflictError('Cannot delete table with assigned invitations');
    }

    return this.repository.delete(id);
  }

  async validateTableCapacity(tableId: string, additionalGuests: number = 0): Promise<void> {
    const table = await this.repository.findById(tableId);
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
