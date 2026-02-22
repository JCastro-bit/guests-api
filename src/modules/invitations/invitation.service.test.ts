import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InvitationService } from './invitation.service';
import { InvitationRepository } from './invitation.repository';
import { CreateInvitation, UpdateInvitation } from './invitation.schema';
import { PrismaClient } from '@prisma/client';

// Mock del repository
const mockRepository = {
  create: vi.fn(),
  findAll: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  count: vi.fn(),
  findByName: vi.fn(),
  findByOperationId: vi.fn(),
  getMostRecentEventDate: vi.fn(),
  getStatsCounts: vi.fn(),
} as unknown as InvitationRepository;

// Mock de PrismaClient
const mockPrisma = {
  $transaction: vi.fn(),
  invitation: {
    create: vi.fn(),
  },
  guest: {
    create: vi.fn(),
  },
} as unknown as PrismaClient;

// Mock de TableService
const mockTableService = {
  validateTableCapacity: vi.fn(),
} as unknown as import('../tables/table.service').TableService;

describe('InvitationService', () => {
  let service: InvitationService;

  beforeEach(() => {
    service = new InvitationService(mockRepository, mockPrisma);
    vi.clearAllMocks();
  });

  describe('createInvitation', () => {
    it('should create an invitation successfully', async () => {
      const createData: CreateInvitation = {
        name: 'Smith Family',
      };

      const expectedInvitation = {
        id: '123',
        ...createData,
        message: null,
        eventDate: null,
        location: null,
        qrCode: null,
        operationId: null,
        tableId: null,
        createdAt: new Date().toISOString(),
      };

      vi.mocked(mockRepository.findByName).mockResolvedValue(null);
      vi.mocked(mockRepository.create).mockResolvedValue(expectedInvitation);

      const result = await service.createInvitation(createData);

      expect(mockRepository.findByName).toHaveBeenCalledWith('Smith Family');
      expect(mockRepository.create).toHaveBeenCalledWith(createData);
      expect(result).toEqual(expectedInvitation);
    });

    it('should throw error when invitation name already exists', async () => {
      const createData: CreateInvitation = {
        name: 'Smith Family',
      };

      const existingInvitation = {
        id: '123',
        name: 'Smith Family',
        message: null,
        eventDate: null,
        location: null,
        qrCode: null,
        operationId: null,
        tableId: null,
        createdAt: new Date().toISOString(),
      };

      vi.mocked(mockRepository.findByName).mockResolvedValue(existingInvitation);

      await expect(service.createInvitation(createData)).rejects.toThrow(
        'Invitation with this name already exists'
      );

      expect(mockRepository.findByName).toHaveBeenCalledWith('Smith Family');
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error when operationId already exists', async () => {
      const createData: CreateInvitation = {
        name: 'Smith Family',
        operationId: 'OP123',
      };

      const existingInvitation = {
        id: '456',
        name: 'Jones Family',
        message: null,
        eventDate: null,
        location: null,
        qrCode: null,
        operationId: 'OP123',
        tableId: null,
        createdAt: new Date().toISOString(),
      };

      vi.mocked(mockRepository.findByName).mockResolvedValue(null);
      vi.mocked(mockRepository.findByOperationId).mockResolvedValue(existingInvitation);

      await expect(service.createInvitation(createData)).rejects.toThrow(
        'Invitation with this operationId already exists'
      );

      expect(mockRepository.findByName).toHaveBeenCalledWith('Smith Family');
      expect(mockRepository.findByOperationId).toHaveBeenCalledWith('OP123');
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should validate table capacity when tableId is provided', async () => {
      const createData: CreateInvitation = {
        name: 'Smith Family',
        tableId: 'table-1',
      };

      const expectedInvitation = {
        id: '123',
        ...createData,
        message: null,
        eventDate: null,
        location: null,
        qrCode: null,
        operationId: null,
        createdAt: new Date().toISOString(),
      };

      const serviceWithTable = new InvitationService(mockRepository, mockPrisma, mockTableService);

      vi.mocked(mockRepository.findByName).mockResolvedValue(null);
      vi.mocked(mockTableService.validateTableCapacity).mockResolvedValue(undefined);
      vi.mocked(mockRepository.create).mockResolvedValue(expectedInvitation);

      const result = await serviceWithTable.createInvitation(createData);

      expect(mockTableService.validateTableCapacity).toHaveBeenCalledWith('table-1', 0);
      expect(mockRepository.create).toHaveBeenCalledWith(createData);
      expect(result).toEqual(expectedInvitation);
    });

    it('should throw InternalError when tableId is provided but tableService is missing', async () => {
      const createData: CreateInvitation = {
        name: 'Smith Family',
        tableId: 'table-1',
      };

      const serviceWithoutTable = new InvitationService(mockRepository, mockPrisma);

      vi.mocked(mockRepository.findByName).mockResolvedValue(null);

      await expect(serviceWithoutTable.createInvitation(createData)).rejects.toThrow(
        'TableService is required for table capacity validation'
      );

      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('createInvitationWithGuests', () => {
    it('should create invitation with guests in a transaction', async () => {
      const invitationData: CreateInvitation = {
        name: 'Smith Family',
      };

      const guestsData = [
        { name: 'John Smith', side: 'groom' as const },
        { name: 'Jane Smith', side: 'bride' as const },
      ];

      const createdInvitation = {
        id: '123',
        name: 'Smith Family',
        message: null,
        eventDate: null,
        location: null,
        qrCode: null,
        operationId: null,
        tableId: null,
        createdAt: new Date(),
      };

      const createdGuests = [
        {
          id: '1',
          name: 'John Smith',
          side: 'groom' as const,
          phone: null,
          email: null,
          status: 'pending' as const,
          invitationId: '123',
          operationId: null,
          createdAt: new Date(),
        },
        {
          id: '2',
          name: 'Jane Smith',
          side: 'bride' as const,
          phone: null,
          email: null,
          status: 'pending' as const,
          invitationId: '123',
          operationId: null,
          createdAt: new Date(),
        },
      ];

      vi.mocked(mockRepository.findByName).mockResolvedValue(null);
      vi.mocked(mockPrisma.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          invitation: {
            create: vi.fn().mockResolvedValue(createdInvitation),
          },
          guest: {
            create: vi.fn()
              .mockResolvedValueOnce(createdGuests[0])
              .mockResolvedValueOnce(createdGuests[1]),
          },
        } as any);
      });

      const result = await service.createInvitationWithGuests(invitationData, guestsData);

      expect(mockRepository.findByName).toHaveBeenCalledWith('Smith Family');
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result.id).toBe('123');
      expect(result.guests).toHaveLength(2);
    });

    it('should throw error if PrismaClient is not available', async () => {
      const serviceWithoutPrisma = new InvitationService(mockRepository);

      await expect(
        serviceWithoutPrisma.createInvitationWithGuests(
          { name: 'Test' },
          [{ name: 'Guest', side: 'groom' }]
        )
      ).rejects.toThrow('PrismaClient is required for transaction operations');
    });
  });

  describe('getAllInvitations', () => {
    it('should return all invitations without pagination', async () => {
      const invitations = [
        {
          id: '1',
          name: 'Smith Family',
          message: null,
          eventDate: null,
          location: null,
          qrCode: null,
          operationId: null,
          tableId: null,
          createdAt: new Date().toISOString(),
        },
      ];

      vi.mocked(mockRepository.findAll).mockResolvedValue(invitations);
      vi.mocked(mockRepository.count).mockResolvedValue(1);

      const result = await service.getAllInvitations();

      expect(mockRepository.findAll).toHaveBeenCalledWith(undefined, undefined);
      expect(result).toEqual(invitations);
    });

    it('should return paginated invitations', async () => {
      const invitations = [
        {
          id: '1',
          name: 'Smith Family',
          message: null,
          eventDate: null,
          location: null,
          qrCode: null,
          operationId: null,
          tableId: null,
          createdAt: new Date().toISOString(),
        },
      ];

      vi.mocked(mockRepository.findAll).mockResolvedValue(invitations);
      vi.mocked(mockRepository.count).mockResolvedValue(100);

      const result = await service.getAllInvitations(1, 50);

      expect(mockRepository.findAll).toHaveBeenCalledWith(0, 50);
      expect(result).toEqual({
        data: invitations,
        total: 100,
        page: 1,
        limit: 50,
      });
    });
  });

  describe('getInvitationById', () => {
    it('should return an invitation by id', async () => {
      const invitation = {
        id: '123',
        name: 'Smith Family',
        message: null,
        eventDate: null,
        location: null,
        qrCode: null,
        operationId: null,
        tableId: null,
        createdAt: new Date().toISOString(),
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(invitation);

      const result = await service.getInvitationById('123');

      expect(mockRepository.findById).toHaveBeenCalledWith('123');
      expect(result).toEqual(invitation);
    });

    it('should throw error when invitation not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(service.getInvitationById('999')).rejects.toThrow(
        'Invitation not found'
      );
    });
  });

  describe('updateInvitation', () => {
    it('should update an invitation successfully', async () => {
      const existingInvitation = {
        id: '123',
        name: 'Smith Family',
        message: null,
        eventDate: null,
        location: null,
        qrCode: null,
        operationId: null,
        tableId: null,
        createdAt: new Date().toISOString(),
      };

      const updateData: UpdateInvitation = {
        message: 'Welcome to our wedding',
      };

      const updatedInvitation = {
        ...existingInvitation,
        message: 'Welcome to our wedding',
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(existingInvitation);
      vi.mocked(mockRepository.update).mockResolvedValue(updatedInvitation);

      const result = await service.updateInvitation('123', updateData);

      expect(mockRepository.findById).toHaveBeenCalledWith('123');
      expect(mockRepository.update).toHaveBeenCalledWith('123', updateData);
      expect(result).toEqual(updatedInvitation);
    });

    it('should validate table capacity when updating tableId to a new table', async () => {
      const existingInvitation = {
        id: '123',
        name: 'Smith Family',
        message: null,
        eventDate: null,
        location: null,
        qrCode: null,
        operationId: null,
        tableId: 'old-table',
        guests: [{ id: 'g1' }, { id: 'g2' }],
        createdAt: new Date().toISOString(),
      };

      const updateData: UpdateInvitation = { tableId: 'new-table' };
      const updatedInvitation = { ...existingInvitation, tableId: 'new-table' };

      const serviceWithTable = new InvitationService(mockRepository, mockPrisma, mockTableService);

      vi.mocked(mockRepository.findById).mockResolvedValue(existingInvitation);
      vi.mocked(mockTableService.validateTableCapacity).mockResolvedValue(undefined);
      vi.mocked(mockRepository.update).mockResolvedValue(updatedInvitation);

      const result = await serviceWithTable.updateInvitation('123', updateData);

      expect(mockTableService.validateTableCapacity).toHaveBeenCalledWith('new-table', 2);
      expect(mockRepository.update).toHaveBeenCalledWith('123', updateData);
      expect(result).toEqual(updatedInvitation);
    });

    it('should throw InternalError when updating tableId but tableService is missing', async () => {
      const existingInvitation = {
        id: '123',
        name: 'Smith Family',
        message: null,
        eventDate: null,
        location: null,
        qrCode: null,
        operationId: null,
        tableId: null,
        guests: [],
        createdAt: new Date().toISOString(),
      };

      const updateData: UpdateInvitation = { tableId: 'new-table' };
      const serviceWithoutTable = new InvitationService(mockRepository, mockPrisma);

      vi.mocked(mockRepository.findById).mockResolvedValue(existingInvitation);

      await expect(serviceWithoutTable.updateInvitation('123', updateData)).rejects.toThrow(
        'TableService is required for table capacity validation'
      );

      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteInvitation', () => {
    it('should delete an invitation successfully', async () => {
      const existingInvitation = {
        id: '123',
        name: 'Smith Family',
        message: null,
        eventDate: null,
        location: null,
        qrCode: null,
        operationId: null,
        tableId: null,
        createdAt: new Date().toISOString(),
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(existingInvitation);
      vi.mocked(mockRepository.delete).mockResolvedValue(existingInvitation);

      await service.deleteInvitation('123');

      expect(mockRepository.findById).toHaveBeenCalledWith('123');
      expect(mockRepository.delete).toHaveBeenCalledWith('123');
    });
  });

});
