import { GuestRepository } from './guest.repository';
import { CreateGuest, UpdateGuest } from './guest.schema';

export class GuestService {
  constructor(private repository: GuestRepository) {}

  async createGuest(data: CreateGuest) {
    // Verificar duplicado por nombre
    const existingByName = await this.repository.findByName(data.name);
    if (existingByName) {
      throw new Error('Guest with this name already exists');
    }

    // Verificar duplicado por operationId si existe
    if (data.operationId) {
      const existingByOperationId = await this.repository.findByOperationId(data.operationId);
      if (existingByOperationId) {
        throw new Error('Guest with this operationId already exists');
      }
    }

    return this.repository.create(data);
  }

  async getAllGuests(invitationId?: string, page?: number, limit?: number) {
    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit;

    const [data, total] = await Promise.all([
      this.repository.findAll(invitationId, skip, take),
      this.repository.count(invitationId),
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

  async getGuestById(id: string) {
    const guest = await this.repository.findById(id);
    if (!guest) {
      throw new Error('Guest not found');
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
