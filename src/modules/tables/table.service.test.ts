import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TableService } from './table.service';
import { TableRepository } from './table.repository';
import { CreateTable, UpdateTable } from './table.schema';

const mockRepository = {
  create: vi.fn(),
  findAll: vi.fn(),
  findAllWithStats: vi.fn(),
  findById: vi.fn(),
  findByIdWithStats: vi.fn(),
  findByName: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  count: vi.fn(),
  hasInvitations: vi.fn(),
  getGuestCountForTable: vi.fn(),
} as unknown as TableRepository;

const userId = 'user-123';

describe('TableService', () => {
  let service: TableService;

  beforeEach(() => {
    service = new TableService(mockRepository);
    vi.clearAllMocks();
  });

  describe('createTable', () => {
    it('should create a table successfully', async () => {
      // Arrange
      const createData: CreateTable = { name: 'Mesa 1', capacity: 8 };
      const expectedTable = {
        id: 'table-1',
        ...createData,
        location: null,
        notes: null,
        userId,
        createdAt: new Date(),
        deletedAt: null,
      };

      vi.mocked(mockRepository.findByName).mockResolvedValue(null);
      vi.mocked(mockRepository.create).mockResolvedValue(expectedTable);

      // Act
      const result = await service.createTable(createData, userId);

      // Assert
      expect(mockRepository.findByName).toHaveBeenCalledWith('Mesa 1', userId);
      expect(mockRepository.create).toHaveBeenCalledWith(createData, userId);
      expect(result).toEqual(expectedTable);
    });

    it('should throw ConflictError when name already exists', async () => {
      // Arrange
      const createData: CreateTable = { name: 'Mesa 1' };
      vi.mocked(mockRepository.findByName).mockResolvedValue({
        id: 'table-1',
        name: 'Mesa 1',
        capacity: 8,
        location: null,
        notes: null,
        userId,
        createdAt: new Date(),
        deletedAt: null,
      });

      // Act & Assert
      await expect(service.createTable(createData, userId)).rejects.toThrow(
        'Table with this name already exists'
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getAllTables', () => {
    it('should return all tables without pagination', async () => {
      // Arrange
      const tablesWithStats = [
        {
          id: 'table-1',
          name: 'Mesa 1',
          capacity: 8,
          location: null,
          notes: null,
          createdAt: new Date(),
          guestCount: 3,
          available: 5,
          invitationCount: 1,
        },
      ];
      vi.mocked(mockRepository.findAllWithStats).mockResolvedValue(tablesWithStats);

      // Act
      const result = await service.getAllTables(userId);

      // Assert
      expect(mockRepository.findAllWithStats).toHaveBeenCalledWith(userId);
      expect(result).toEqual(tablesWithStats);
    });

    it('should return paginated tables', async () => {
      // Arrange
      const tablesWithStats = [
        {
          id: 'table-1',
          name: 'Mesa 1',
          capacity: 8,
          location: null,
          notes: null,
          createdAt: new Date(),
          guestCount: 3,
          available: 5,
          invitationCount: 1,
        },
      ];
      vi.mocked(mockRepository.findAllWithStats).mockResolvedValue(tablesWithStats);
      vi.mocked(mockRepository.count).mockResolvedValue(10);

      // Act
      const result = await service.getAllTables(userId, 1, 5);

      // Assert
      expect(mockRepository.findAllWithStats).toHaveBeenCalledWith(userId, 0, 5);
      expect(mockRepository.count).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        data: tablesWithStats,
        total: 10,
        page: 1,
        limit: 5,
      });
    });
  });

  describe('getTableById', () => {
    it('should return a table by id with stats', async () => {
      // Arrange
      const tableWithStats = {
        id: 'table-1',
        name: 'Mesa 1',
        capacity: 8,
        location: null,
        notes: null,
        userId,
        createdAt: new Date(),
        deletedAt: null,
        invitations: [],
        guestCount: 0,
        available: 8,
      };
      vi.mocked(mockRepository.findByIdWithStats).mockResolvedValue(tableWithStats);

      // Act
      const result = await service.getTableById('table-1', userId);

      // Assert
      expect(mockRepository.findByIdWithStats).toHaveBeenCalledWith('table-1', userId);
      expect(result).toEqual(tableWithStats);
    });

    it('should throw NotFoundError when table not found', async () => {
      // Arrange
      vi.mocked(mockRepository.findByIdWithStats).mockResolvedValue(null);

      // Act & Assert
      await expect(service.getTableById('nonexistent', userId)).rejects.toThrow(
        'Table not found'
      );
    });
  });

  describe('updateTable', () => {
    it('should update a table successfully', async () => {
      // Arrange
      const tableWithStats = {
        id: 'table-1',
        name: 'Mesa 1',
        capacity: 8,
        location: null,
        notes: null,
        userId,
        createdAt: new Date(),
        deletedAt: null,
        invitations: [],
        guestCount: 0,
        available: 8,
      };
      const updateData: UpdateTable = { name: 'Mesa Renovada' };
      const updatedTable = { ...tableWithStats, name: 'Mesa Renovada' };

      vi.mocked(mockRepository.findByIdWithStats).mockResolvedValue(tableWithStats);
      vi.mocked(mockRepository.findByName).mockResolvedValue(null);
      vi.mocked(mockRepository.update).mockResolvedValue(updatedTable);

      // Act
      const result = await service.updateTable('table-1', userId, updateData);

      // Assert
      expect(mockRepository.findByIdWithStats).toHaveBeenCalledWith('table-1', userId);
      expect(mockRepository.findByName).toHaveBeenCalledWith('Mesa Renovada', userId);
      expect(mockRepository.update).toHaveBeenCalledWith('table-1', updateData);
      expect(result).toEqual(updatedTable);
    });

    it('should throw ConflictError when reducing capacity below guest count', async () => {
      // Arrange
      const tableWithStats = {
        id: 'table-1',
        name: 'Mesa 1',
        capacity: 8,
        location: null,
        notes: null,
        userId,
        createdAt: new Date(),
        deletedAt: null,
        invitations: [],
        guestCount: 5,
        available: 3,
      };
      vi.mocked(mockRepository.findByIdWithStats).mockResolvedValue(tableWithStats);
      vi.mocked(mockRepository.findById).mockResolvedValue(tableWithStats);
      vi.mocked(mockRepository.getGuestCountForTable).mockResolvedValue(5);

      // Act & Assert
      await expect(
        service.updateTable('table-1', userId, { capacity: 3 })
      ).rejects.toThrow('Cannot reduce capacity below current guest count (5 guests)');
    });
  });

  describe('deleteTable', () => {
    it('should delete a table successfully', async () => {
      // Arrange
      const tableWithStats = {
        id: 'table-1',
        name: 'Mesa 1',
        capacity: 8,
        location: null,
        notes: null,
        userId,
        createdAt: new Date(),
        deletedAt: null,
        invitations: [],
        guestCount: 0,
        available: 8,
      };
      vi.mocked(mockRepository.findByIdWithStats).mockResolvedValue(tableWithStats);
      vi.mocked(mockRepository.hasInvitations).mockResolvedValue(false);
      vi.mocked(mockRepository.delete).mockResolvedValue(tableWithStats);

      // Act
      await service.deleteTable('table-1', userId);

      // Assert
      expect(mockRepository.findByIdWithStats).toHaveBeenCalledWith('table-1', userId);
      expect(mockRepository.hasInvitations).toHaveBeenCalledWith('table-1');
      expect(mockRepository.delete).toHaveBeenCalledWith('table-1');
    });

    it('should throw ConflictError when table has assigned invitations', async () => {
      // Arrange
      const tableWithStats = {
        id: 'table-1',
        name: 'Mesa 1',
        capacity: 8,
        location: null,
        notes: null,
        userId,
        createdAt: new Date(),
        deletedAt: null,
        invitations: [],
        guestCount: 0,
        available: 8,
      };
      vi.mocked(mockRepository.findByIdWithStats).mockResolvedValue(tableWithStats);
      vi.mocked(mockRepository.hasInvitations).mockResolvedValue(true);

      // Act & Assert
      await expect(service.deleteTable('table-1', userId)).rejects.toThrow(
        'Cannot delete table with assigned invitations'
      );
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when table does not exist', async () => {
      // Arrange
      vi.mocked(mockRepository.findByIdWithStats).mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteTable('nonexistent', userId)).rejects.toThrow(
        'Table not found'
      );
    });
  });

  describe('validateTableCapacity', () => {
    it('should pass when capacity is sufficient', async () => {
      // Arrange
      const table = {
        id: 'table-1',
        name: 'Mesa 1',
        capacity: 8,
        location: null,
        notes: null,
        userId,
        createdAt: new Date(),
        deletedAt: null,
        invitations: [],
      };
      vi.mocked(mockRepository.findById).mockResolvedValue(table);
      vi.mocked(mockRepository.getGuestCountForTable).mockResolvedValue(3);

      // Act & Assert
      await expect(
        service.validateTableCapacity('table-1', userId, 2)
      ).resolves.toBeUndefined();
    });

    it('should throw ConflictError when capacity exceeded', async () => {
      // Arrange
      const table = {
        id: 'table-1',
        name: 'Mesa 1',
        capacity: 8,
        location: null,
        notes: null,
        userId,
        createdAt: new Date(),
        deletedAt: null,
        invitations: [],
      };
      vi.mocked(mockRepository.findById).mockResolvedValue(table);
      vi.mocked(mockRepository.getGuestCountForTable).mockResolvedValue(6);

      // Act & Assert
      await expect(
        service.validateTableCapacity('table-1', userId, 5)
      ).rejects.toThrow('Table capacity exceeded (11/8)');
    });

    it('should throw NotFoundError when table not found', async () => {
      // Arrange
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.validateTableCapacity('nonexistent', userId, 0)
      ).rejects.toThrow('Table not found');
    });
  });
});
