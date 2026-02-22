import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StatsService } from './stats.service';
import { InvitationRepository } from '../invitations/invitation.repository';
import { TableService } from '../tables/table.service';

// Mock del invitation repository
const mockInvitationRepository = {
  getMostRecentEventDate: vi.fn(),
  getStatsCounts: vi.fn(),
} as unknown as InvitationRepository;

// Mock del table service
const mockTableService = {
  getAllTables: vi.fn(),
} as unknown as TableService;

describe('StatsService', () => {
  let service: StatsService;

  beforeEach(() => {
    service = new StatsService(mockInvitationRepository, mockTableService);
    vi.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics with days until wedding', async () => {
      const statsData = {
        totalInvitations: 50,
        totalGuests: 150,
        confirmed: 100,
        pending: 30,
        declined: 20,
      };

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      vi.mocked(mockInvitationRepository.getStatsCounts).mockResolvedValue(statsData);
      vi.mocked(mockInvitationRepository.getMostRecentEventDate).mockResolvedValue(futureDate);

      const result = await service.getDashboardStats();

      expect(mockInvitationRepository.getStatsCounts).toHaveBeenCalled();
      expect(mockInvitationRepository.getMostRecentEventDate).toHaveBeenCalled();
      expect(result).toEqual({
        ...statsData,
        daysUntilWedding: expect.any(Number),
      });
      expect(result.daysUntilWedding).toBeGreaterThan(0);
    });

    it('should return 0 days when no event date exists', async () => {
      const statsData = {
        totalInvitations: 50,
        totalGuests: 150,
        confirmed: 100,
        pending: 30,
        declined: 20,
      };

      vi.mocked(mockInvitationRepository.getStatsCounts).mockResolvedValue(statsData);
      vi.mocked(mockInvitationRepository.getMostRecentEventDate).mockResolvedValue(null);

      const result = await service.getDashboardStats();

      expect(result.daysUntilWedding).toBe(0);
    });
  });

  describe('getTableStats', () => {
    it('should return table statistics', async () => {
      const tables = [
        {
          id: '1',
          name: 'Mesa 1',
          capacity: 10,
          location: 'Salón A',
          notes: null,
          createdAt: new Date().toISOString(),
          guestCount: 6,
          available: 4,
          invitationCount: 3,
        },
        {
          id: '2',
          name: 'Mesa 2',
          capacity: 8,
          location: null,
          notes: null,
          createdAt: new Date().toISOString(),
          guestCount: 3,
          available: 5,
          invitationCount: 1,
        },
      ];

      vi.mocked(mockTableService.getAllTables).mockResolvedValue(tables);

      const result = await service.getTableStats();

      expect(mockTableService.getAllTables).toHaveBeenCalled();
      expect(result.totalTables).toBe(2);
      expect(result.totalCapacity).toBe(18);
      expect(result.totalOccupied).toBe(9);
      expect(result.totalAvailable).toBe(9);
      expect(result.tables).toHaveLength(2);
      expect(result.tables[0]).toEqual({
        id: '1',
        name: 'Mesa 1',
        capacity: 10,
        location: 'Salón A',
        guestCount: 6,
        available: 4,
        invitationCount: 3,
      });
    });

    it('should handle empty tables array', async () => {
      vi.mocked(mockTableService.getAllTables).mockResolvedValue([]);

      const result = await service.getTableStats();

      expect(result.totalTables).toBe(0);
      expect(result.totalCapacity).toBe(0);
      expect(result.totalOccupied).toBe(0);
      expect(result.totalAvailable).toBe(0);
      expect(result.tables).toHaveLength(0);
    });
  });
});
