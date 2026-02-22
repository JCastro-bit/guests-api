import { GuestRepository } from './guest.repository';
import { CreateGuest, UpdateGuest } from './guest.schema';
import { ConflictError, NotFoundError } from '../../errors/app-error';
import { calcPaginationParams, formatPaginatedResponse } from '../../utils/pagination';

export class GuestService {
  constructor(private repository: GuestRepository) {}

  async createGuest(data: CreateGuest) {
    // Verificar duplicado por nombre
    const existingByName = await this.repository.findByName(data.name);
    if (existingByName) {
      throw ConflictError('Guest with this name already exists');
    }

    // Verificar duplicado por operationId si existe
    if (data.operationId) {
      const existingByOperationId = await this.repository.findByOperationId(data.operationId);
      if (existingByOperationId) {
        throw ConflictError('Guest with this operationId already exists');
      }
    }

    return this.repository.create(data);
  }

  async getAllGuests(invitationId?: string, page?: number, limit?: number) {
    const { skip, take } = calcPaginationParams(page, limit);

    const [data, total] = await Promise.all([
      this.repository.findAll(invitationId, skip, take),
      this.repository.count(invitationId),
    ]);

    return formatPaginatedResponse(data, total, page, limit);
  }

  async getGuestById(id: string) {
    const guest = await this.repository.findById(id);
    if (!guest) {
      throw NotFoundError('Guest');
    }
    return guest;
  }

  async updateGuest(id: string, data: UpdateGuest) {
    await this.getGuestById(id);
    return this.repository.update(id, data);
  }

  async deleteGuest(id: string) {
    await this.getGuestById(id);
    return this.repository.delete(id);
  }
}
