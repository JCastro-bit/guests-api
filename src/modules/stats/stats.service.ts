import { InvitationRepository } from '../invitations/invitation.repository';
import { TableService } from '../tables/table.service';

export class StatsService {
  constructor(
    private invitationRepository: InvitationRepository,
    private tableService: TableService
  ) {}

  async getDashboardStats() {
    const stats = await this.invitationRepository.getStatsCounts();
    const mostRecentEventDate = await this.invitationRepository.getMostRecentEventDate();

    let daysUntilWedding = 0;
    if (mostRecentEventDate) {
      const today = new Date();
      const eventDate = new Date(mostRecentEventDate);
      const diffTime = eventDate.getTime() - today.getTime();
      daysUntilWedding = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    return {
      ...stats,
      daysUntilWedding,
    };
  }

  async getTableStats() {
    const tables = await this.tableService.getAllTables();
    const tablesArray = Array.isArray(tables) ? tables : tables.data;

    const totalCapacity = tablesArray.reduce((sum: number, table: any) => sum + table.capacity, 0);
    const totalOccupied = tablesArray.reduce((sum: number, table: any) => sum + table.guestCount, 0);
    const totalAvailable = totalCapacity - totalOccupied;

    const tableStats = tablesArray.map((table: any) => ({
      id: table.id,
      name: table.name,
      capacity: table.capacity,
      location: table.location,
      guestCount: table.guestCount,
      available: table.available,
      invitationCount: table.invitationCount ?? 0,
    }));

    return {
      tables: tableStats,
      totalTables: tablesArray.length,
      totalCapacity,
      totalOccupied,
      totalAvailable,
    };
  }
}
