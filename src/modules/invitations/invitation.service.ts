import { InvitationRepository } from './invitation.repository';
import { CreateInvitation, UpdateInvitation } from './invitation.schema';

export class InvitationService {
  constructor(private repository: InvitationRepository) {}

  async createInvitation(data: CreateInvitation) {
    return this.repository.create(data);
  }

  async getAllInvitations() {
    return this.repository.findAll();
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
