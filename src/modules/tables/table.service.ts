import { TableRepository } from './table.repository';
import { CreateTable, UpdateTable } from './table.schema';

export class TableService {
  constructor(private repository: TableRepository) {}

  async createTable(data: CreateTable) {
    // Verificar que no exista una mesa con el mismo nombre
    const existingTable = await this.repository.findByName(data.name);
    if (existingTable) {
      throw new Error('Table with this name already exists');
    }

    return this.repository.create(data);
  }

  async getAllTables(page?: number, limit?: number) {
    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit;

    const [data, total] = await Promise.all([
      this.repository.findAllWithStats(skip, take),
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

  async getTableById(id: string) {
    const table = await this.repository.findByIdWithStats(id);
    if (!table) {
      throw new Error('Table not found');
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
        throw new Error('Table with this name already exists');
      }
    }

    // Si se está reduciendo la capacidad, verificar que no haya más invitados que la nueva capacidad
    if (data.capacity !== undefined) {
      const currentTable = await this.repository.findById(id);
      if (currentTable) {
        const guestCount = await this.repository.getGuestCountForTable(id);
        if (data.capacity < guestCount) {
          throw new Error(
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
      throw new Error('Cannot delete table with assigned invitations');
    }

    return this.repository.delete(id);
  }

  async validateTableCapacity(tableId: string, additionalGuests: number = 0): Promise<void> {
    const table = await this.repository.findById(tableId);
    if (!table) {
      throw new Error('Table not found');
    }

    const currentGuestCount = await this.repository.getGuestCountForTable(tableId);
    const totalGuests = currentGuestCount + additionalGuests;

    if (totalGuests > table.capacity) {
      throw new Error(
        `Table capacity exceeded (${totalGuests}/${table.capacity})`
      );
    }
  }
}
