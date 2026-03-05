import { GuestRepository } from './guest.repository';
import { CreateGuest, UpdateGuest } from './guest.schema';
import { ConflictError, NotFoundError } from '../../errors/app-error';
import { calcPaginationParams, formatPaginatedResponse } from '../../utils/pagination';

export class GuestService {
  constructor(private repository: GuestRepository) {}

  async createGuest(data: CreateGuest, userId: string) {
    const existingByName = await this.repository.findByName(data.name, userId);
    if (existingByName) {
      throw ConflictError('Guest with this name already exists');
    }

    if (data.operationId) {
      const existingByOperationId = await this.repository.findByOperationId(data.operationId, userId);
      if (existingByOperationId) {
        throw ConflictError('Guest with this operationId already exists');
      }
    }

    return this.repository.create(data, userId);
  }

  async getAllGuests(userId: string, invitationId?: string, page?: number, limit?: number) {
    const { skip, take } = calcPaginationParams(page, limit);

    const [data, total] = await Promise.all([
      this.repository.findAll(userId, invitationId, skip, take),
      this.repository.count(userId, invitationId),
    ]);

    return formatPaginatedResponse(data, total, page, limit);
  }

  async getGuestById(id: string, userId: string) {
    const guest = await this.repository.findById(id, userId);
    if (!guest) {
      throw NotFoundError('Guest');
    }
    return guest;
  }

  async updateGuest(id: string, userId: string, data: UpdateGuest) {
    await this.getGuestById(id, userId);
    return this.repository.update(id, userId, data);
  }

  async deleteGuest(id: string, userId: string) {
    await this.getGuestById(id, userId);
    return this.repository.delete(id);
  }
}
