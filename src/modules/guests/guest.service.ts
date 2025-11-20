import { GuestRepository } from './guest.repository';
import { CreateGuest, UpdateGuest } from './guest.schema';

export class GuestService {
  constructor(private repository: GuestRepository) {}

  async createGuest(data: CreateGuest) {
    return this.repository.create(data);
  }

  async getAllGuests(invitationId?: string) {
    return this.repository.findAll(invitationId);
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
