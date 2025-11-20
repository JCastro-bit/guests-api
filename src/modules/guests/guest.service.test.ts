import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GuestService } from './guest.service';
import { GuestRepository } from './guest.repository';
import { CreateGuest, UpdateGuest } from './guest.schema';

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
} as unknown as GuestRepository;

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
        createdAt: new Date().toISOString(),
      };

      vi.mocked(mockRepository.findByName).mockResolvedValue(null);
      vi.mocked(mockRepository.create).mockResolvedValue(expectedGuest);

      const result = await service.createGuest(createData);

      expect(mockRepository.findByName).toHaveBeenCalledWith('John Doe');
      expect(mockRepository.create).toHaveBeenCalledWith(createData);
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
        createdAt: new Date().toISOString(),
      };

      vi.mocked(mockRepository.findByName).mockResolvedValue(existingGuest);

      await expect(service.createGuest(createData)).rejects.toThrow(
        'Guest with this name already exists'
      );

      expect(mockRepository.findByName).toHaveBeenCalledWith('John Doe');
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
        createdAt: new Date().toISOString(),
      };

      vi.mocked(mockRepository.findByName).mockResolvedValue(null);
      vi.mocked(mockRepository.findByOperationId).mockResolvedValue(existingGuest);

      await expect(service.createGuest(createData)).rejects.toThrow(
        'Guest with this operationId already exists'
      );

      expect(mockRepository.findByName).toHaveBeenCalledWith('John Doe');
      expect(mockRepository.findByOperationId).toHaveBeenCalledWith('OP123');
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
          createdAt: new Date().toISOString(),
        },
      ];

      vi.mocked(mockRepository.findAll).mockResolvedValue(guests);
      vi.mocked(mockRepository.count).mockResolvedValue(1);

      const result = await service.getAllGuests();

      expect(mockRepository.findAll).toHaveBeenCalledWith(undefined, undefined, undefined);
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
          createdAt: new Date().toISOString(),
        },
      ];

      vi.mocked(mockRepository.findAll).mockResolvedValue(guests);
      vi.mocked(mockRepository.count).mockResolvedValue(100);

      const result = await service.getAllGuests(undefined, 1, 50);

      expect(mockRepository.findAll).toHaveBeenCalledWith(undefined, 0, 50);
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
        createdAt: new Date().toISOString(),
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(guest);

      const result = await service.getGuestById('123');

      expect(mockRepository.findById).toHaveBeenCalledWith('123');
      expect(result).toEqual(guest);
    });

    it('should throw error when guest not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      await expect(service.getGuestById('999')).rejects.toThrow('Guest not found');
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
        createdAt: new Date().toISOString(),
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

      const result = await service.updateGuest('123', updateData);

      expect(mockRepository.findById).toHaveBeenCalledWith('123');
      expect(mockRepository.update).toHaveBeenCalledWith('123', updateData);
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
        createdAt: new Date().toISOString(),
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(existingGuest);
      vi.mocked(mockRepository.delete).mockResolvedValue(existingGuest);

      await service.deleteGuest('123');

      expect(mockRepository.findById).toHaveBeenCalledWith('123');
      expect(mockRepository.delete).toHaveBeenCalledWith('123');
    });
  });
});
