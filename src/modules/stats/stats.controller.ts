import { FastifyRequest, FastifyReply } from 'fastify';
import { InvitationService } from '../invitations/invitation.service';
import { TableService } from '../tables/table.service';

export class StatsController {
  constructor(
    private invitationService: InvitationService,
    private tableService?: TableService
  ) {}

  async getDashboard(request: FastifyRequest, reply: FastifyReply) {
    const stats = await this.invitationService.getDashboardStats();
    return reply.send(stats);
  }

  async getTableStats(request: FastifyRequest, reply: FastifyReply) {
    if (!this.tableService) {
      return reply.status(503).send({ error: 'Table service not available' });
    }

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
      invitationCount: 0, // Will be populated if needed
    }));

    return reply.send({
      tables: tableStats,
      totalTables: tablesArray.length,
      totalCapacity,
      totalOccupied,
      totalAvailable,
    });
  }
}
