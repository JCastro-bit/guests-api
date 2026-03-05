import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GuestService } from './guest.service';
import { GuestRepository } from './guest.repository';
import { CreateGuest, UpdateGuest } from './guest.schema';

const mockRepository = {
  create: vi.fn(),
  findAll: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  count: vi.fn(),
  findByName: vi.fn(),
  findByOperationId: vi.fn(),
} as unknown as GuestRepository;

const userId = 'user-123';

describe('GuestService', () => {
  let service: GuestService;

  beforeEach(() => {
    service = new GuestService(mockRepository);
    vi.clearAllMocks();
  });

  describe('createGuest', () => {
    it('should create a guest successfully', async () => {
      const createData: CreateGuest = {
        name: 'John Doe',
        side: 'groom',
        email: 'john@example.com',
      };

      const expectedGuest = {
        id: '123',
        ...createData,
        phone: null,
        status: 'pending' as const,
        invitationId: null,
        operationId: null,
        userId,
        createdAt: new Date().toISOString(),
        deletedAt: null,
      };

      vi.mocked(mockRepository.findByName).mockResolvedValue(null);
      vi.mocked(mockRepository.create).mockResolvedValue(expectedGuest);

      const result = await service.createGuest(createData, userId);

      expect(mockRepository.findByName).toHaveBeenCalledWith('John Doe', userId);
      expect(mockRepository.create).toHaveBeenCalledWith(createData, userId);
      expect(result).toEqual(expectedGuest);
    });

    it('should throw error when guest name already exists', async () => {
      const createData: CreateGuest = {
        name: 'John Doe',
        side: 'groom',
      };

      const existingGuest = {
        id: '123',
        name: 'John Doe',
        side: 'groom' as const,
        phone: null,
        email: null,
        status: 'pending' as const,
        invitationId: null,
        operationId: null,
        userId,
        createdAt: new Date().toISOString(),
        deletedAt: null,
      };

      vi.mocked(mockRepository.findByName).mockResolvedValue(existingGuest);

      await expect(service.createGuest(createData, userId)).rejects.toThrow(
        'Guest with this name already exists'
      );

      expect(mockRepository.findByName).toHaveBeenCalledWith('John Doe', userId);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error when operationId already exists', async () => {
      const createData: CreateGuest = {
        name: 'John Doe',
        side: 'groom',
        operationId: 'OP123',
      };

      const existingGuest = {
        id: '456',
        name: 'Jane Doe',
        side: 'bride' as const,
        phone: null,
        email: null,
        status: 'pending' as const,
        invitationId: null,
        operationId: 'OP123',
        userId,
        createdAt: new Date().toISOString(),
        deletedAt: null,
      };

      vi.mocked(mockRepository.findByName).mockResolvedValue(null);
      vi.mocked(mockRepository.findByOperationId).mockResolvedValue(existingGuest);

      await expect(service.createGuest(createData, userId)).rejects.toThrow(
        'Guest with this operationId already exists'
      );

      expect(mockRepository.findByName).toHaveBeenCalledWith('John Doe', userId);
      expect(mockRepository.findByOperationId).toHaveBeenCalledWith('OP123', userId);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getAllGuests', () => {
    it('should return all guests without pagination', async () => {
      const guests = [
        {
          id: '1',
          name: 'John Doe',
          side: 'groom' as const,
          phone: null,
          email: null,
          status: 'pending' as const,
          invitationId: null,
          operationId: null,
          userId,
          createdAt: new Date().toISOString(),
          deletedAt: null,
        },
      ];

      vi.mocked(mockRepository.findAll).mockResolvedValue(guests);
      vi.mocked(mockRepository.count).mockResolvedValue(1);

      const result = await service.getAllGuests(userId);

      expect(mockRepository.findAll).toHaveBeenCalledWith(userId, undefined, undefined, undefined);
      expect(result).toEqual(guests);
    });

    it('should return paginated guests', async () => {
      const guests = [
        {
          id: '1',
          name: 'John Doe',
          side: 'groom' as const,
          phone: null,
          email: null,
          status: 'pending' as const,
          invitationId: null,
          operationId: null,
          userId,
          createdAt: new Date().toISOString(),
          deletedAt: null,
        },
      ];

      vi.mocked(mockRepository.findAll).mockResolvedValue(guests);
      vi.mocked(mockRepository.count).mockResolvedValue(100);

      const result = await service.getAllGuests(userId, undefined, 1, 50);

      expect(mockRepository.findAll).toHaveBeenCalledWith(userId, undefined, 0, 50);
      expect(result).toEqual({
        data: guests,
        total: 100,
        page: 1,
        limit: 50,
      });
    });
  });

  describe('getGuestById', () => {
    it('should return a guest by id', async () => {
      const guest = {
        id: '123',
        name: 'John Doe',
        side: 'groom' as const,
        phone: null,
        email: null,
        status: 'pending' as const,
        invitationId: null,
        operationId: null,
        userId,
        createdAt: new Date().toISOString(),
        deletedAt: null,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(guest);

      const result = await service.getGuestById('123', userId);

      expect(mockRepository.findById).toHaveBeenCalledWith('123', userId);
      expect(result).toEqual(guest);
    });

    it('should throw error when guest not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(service.getGuestById('999', userId)).rejects.toThrow('Guest not found');
    });
  });

  describe('updateGuest', () => {
    it('should update a guest successfully', async () => {
      const existingGuest = {
        id: '123',
        name: 'John Doe',
        side: 'groom' as const,
        phone: null,
        email: null,
        status: 'pending' as const,
        invitationId: null,
        operationId: null,
        userId,
        createdAt: new Date().toISOString(),
        deletedAt: null,
      };

      const updateData: UpdateGuest = {
        status: 'confirmed',
      };

      const updatedGuest = {
        ...existingGuest,
        status: 'confirmed' as const,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(existingGuest);
      vi.mocked(mockRepository.update).mockResolvedValue(updatedGuest);

      const result = await service.updateGuest('123', userId, updateData);

      expect(mockRepository.findById).toHaveBeenCalledWith('123', userId);
      expect(mockRepository.update).toHaveBeenCalledWith('123', userId, updateData);
      expect(result).toEqual(updatedGuest);
    });
  });

  describe('deleteGuest', () => {
    it('should delete a guest successfully', async () => {
      const existingGuest = {
        id: '123',
        name: 'John Doe',
        side: 'groom' as const,
        phone: null,
        email: null,
        status: 'pending' as const,
        invitationId: null,
        operationId: null,
        userId,
        createdAt: new Date().toISOString(),
        deletedAt: null,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(existingGuest);
      vi.mocked(mockRepository.delete).mockResolvedValue(existingGuest);

      await service.deleteGuest('123', userId);

      expect(mockRepository.findById).toHaveBeenCalledWith('123', userId);
      expect(mockRepository.delete).toHaveBeenCalledWith('123');
    });
  });
});
