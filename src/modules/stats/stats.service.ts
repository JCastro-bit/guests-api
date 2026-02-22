import { InvitationRepository } from '../invitations/invitation.repository';
import { TableService } from '../tables/table.service';
import { TableStatsItem, TableStats } from './stats.schema';
import { PaginatedResult } from '../../utils/pagination';

interface TableWithStatsData {
  id: string;
  name: string;
  capacity: number;
  location: string | null;
  guestCount: number;
  available: number;
  invitationCount: number;
}

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

  async getTableStats(): Promise<TableStats> {
    const tables = await this.tableService.getAllTables();
    const tablesArray: TableWithStatsData[] = Array.isArray(tables)
      ? (tables as TableWithStatsData[])
      : (tables as PaginatedResult<TableWithStatsData>).data;

    const totalCapacity = tablesArray.reduce((sum, table) => sum + table.capacity, 0);
    const totalOccupied = tablesArray.reduce((sum, table) => sum + table.guestCount, 0);
    const totalAvailable = totalCapacity - totalOccupied;

    const tableStats: TableStatsItem[] = tablesArray.map((table) => ({
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
