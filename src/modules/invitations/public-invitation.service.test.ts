import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PublicInvitationService } from './public-invitation.service';
import { InvitationRepository } from './invitation.repository';
import { EmailService } from '../email/email.service';
import { PrismaClient } from '@prisma/client';

const mockRepository = {
  findBySlug: vi.fn(),
} as unknown as InvitationRepository;

const mockPrisma = {
  invitation: {
    findFirst: vi.fn(),
  },
  guest: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
} as unknown as PrismaClient;

const mockEmailService = {
  sendRsvpNotification: vi.fn(),
} as unknown as EmailService;

const makeInvitation = (overrides = {}) => ({
  id: 'inv-1',
  name: 'Ana y Carlos',
  slug: 'ana-y-carlos-ab12',
  message: 'Te esperamos!',
  eventDate: new Date('2026-06-15'),
  location: 'Guadalajara',
  qrCode: null,
  operationId: null,
  tableId: null,
  userId: 'user-1',
  createdAt: new Date(),
  deletedAt: null,
  guests: [
    { id: 'guest-1', name: 'Juan', status: 'pending', side: 'groom', invitationId: 'inv-1' },
  ],
  table: null,
  user: { id: 'user-1', email: 'ana@test.com', name: 'Ana', plan: 'esencial', planStatus: 'active' },
  ...overrides,
});

describe('PublicInvitationService', () => {
  let service: PublicInvitationService;

  beforeEach(() => {
    service = new PublicInvitationService(mockRepository, mockPrisma, mockEmailService);
    vi.clearAllMocks();
  });

  describe('getBySlug', () => {
    const masterData = {
      name: 'Ana y Carlos',
      message: 'Te esperamos!',
      eventDate: new Date('2026-06-15'),
      location: 'Guadalajara',
    };

    it('returns public fields using master invitation data', async () => {
      vi.mocked(mockRepository.findBySlug).mockResolvedValue(makeInvitation({ name: 'Familia Garcia' }));
      vi.mocked(mockPrisma.invitation.findFirst).mockResolvedValue(masterData as any);

      const result = await service.getBySlug('ana-y-carlos-ab12');

      expect(result).toEqual({
        slug: 'ana-y-carlos-ab12',
        coupleName: 'Ana y Carlos',
        message: 'Te esperamos!',
        eventDate: '2026-06-15',
        location: 'Guadalajara',
        ownerPlan: 'esencial',
        tableName: null,
        guests: [{ id: 'guest-1', name: 'Juan', status: 'pending' }],
      });
    });

    it('uses coupleName from master, not group name', async () => {
      vi.mocked(mockRepository.findBySlug).mockResolvedValue(makeInvitation({ name: 'Companeros de Trabajo' }));
      vi.mocked(mockPrisma.invitation.findFirst).mockResolvedValue({ ...masterData, name: 'Maria y Pedro' } as any);

      const result = await service.getBySlug('test');
      expect(result.coupleName).toBe('Maria y Pedro');
    });

    it('returns null for optional absent fields from master', async () => {
      vi.mocked(mockRepository.findBySlug).mockResolvedValue(makeInvitation());
      vi.mocked(mockPrisma.invitation.findFirst).mockResolvedValue({
        name: 'Ana y Carlos', message: null, eventDate: null, location: null,
      } as any);

      const result = await service.getBySlug('test');
      expect(result.message).toBeNull();
      expect(result.eventDate).toBeNull();
      expect(result.location).toBeNull();
    });

    it('throws NotFoundError if slug does not exist', async () => {
      vi.mocked(mockRepository.findBySlug).mockResolvedValue(null);

      await expect(service.getBySlug('nonexistent')).rejects.toThrow('Invitation not found');
    });

    it('does NOT include userId or owner data in response (except ownerPlan)', async () => {
      vi.mocked(mockRepository.findBySlug).mockResolvedValue(makeInvitation());
      vi.mocked(mockPrisma.invitation.findFirst).mockResolvedValue(masterData as any);

      const result = await service.getBySlug('test');
      expect(result).not.toHaveProperty('userId');
      expect(result).not.toHaveProperty('user');
      expect(result).not.toHaveProperty('id');
      expect(result).toHaveProperty('ownerPlan');
      expect(result).toHaveProperty('guests');
      // guests should only expose id, name, status — no email, phone, side
      expect(result.guests[0]).not.toHaveProperty('email');
      expect(result.guests[0]).not.toHaveProperty('phone');
      expect(result.guests[0]).not.toHaveProperty('side');
    });
  });

  describe('submitRsvp', () => {
    it('updates guest status to confirmed', async () => {
      vi.mocked(mockRepository.findBySlug).mockResolvedValue(makeInvitation());
      vi.mocked(mockPrisma.guest.findFirst).mockResolvedValue({ id: 'guest-1', name: 'Juan' } as any);
      vi.mocked(mockPrisma.guest.update).mockResolvedValue({ id: 'guest-1', status: 'confirmed' } as any);
      vi.mocked(mockEmailService.sendRsvpNotification).mockResolvedValue(undefined);

      const result = await service.submitRsvp('ana-y-carlos-ab12', 'guest-1', 'confirmed');

      expect(mockPrisma.guest.update).toHaveBeenCalledWith({
        where: { id: 'guest-1' },
        data: { status: 'confirmed' },
      });
      expect(result.status).toBe('confirmed');
      expect(result.message).toContain('confirmada');
    });

    it('updates guest status to declined', async () => {
      vi.mocked(mockRepository.findBySlug).mockResolvedValue(makeInvitation());
      vi.mocked(mockPrisma.guest.findFirst).mockResolvedValue({ id: 'guest-1', name: 'Juan' } as any);
      vi.mocked(mockPrisma.guest.update).mockResolvedValue({ id: 'guest-1', status: 'declined' } as any);
      vi.mocked(mockEmailService.sendRsvpNotification).mockResolvedValue(undefined);

      const result = await service.submitRsvp('ana-y-carlos-ab12', 'guest-1', 'declined');

      expect(result.status).toBe('declined');
      expect(result.message).toContain('registrada');
    });

    it('saves guestMessage when provided', async () => {
      vi.mocked(mockRepository.findBySlug).mockResolvedValue(makeInvitation());
      vi.mocked(mockPrisma.guest.findFirst).mockResolvedValue({ id: 'guest-1', name: 'Juan' } as any);
      vi.mocked(mockPrisma.guest.update).mockResolvedValue({ id: 'guest-1', status: 'confirmed' } as any);
      vi.mocked(mockEmailService.sendRsvpNotification).mockResolvedValue(undefined);

      await service.submitRsvp('test', 'guest-1', 'confirmed', 'Felicidades!');

      expect(mockPrisma.guest.update).toHaveBeenCalledWith({
        where: { id: 'guest-1' },
        data: { status: 'confirmed', guestMessage: 'Felicidades!' },
      });
    });

    it('throws NotFoundError if slug does not exist', async () => {
      vi.mocked(mockRepository.findBySlug).mockResolvedValue(null);

      await expect(
        service.submitRsvp('bad-slug', 'guest-1', 'confirmed')
      ).rejects.toThrow('Invitation not found');
    });

    it('throws NotFoundError if guestId does not belong to the invitation', async () => {
      vi.mocked(mockRepository.findBySlug).mockResolvedValue(makeInvitation());
      vi.mocked(mockPrisma.guest.findFirst).mockResolvedValue(null);

      await expect(
        service.submitRsvp('test', 'wrong-guest', 'confirmed')
      ).rejects.toThrow('Guest not found');
    });

    it('sends email notification to owner (fire-and-forget)', async () => {
      vi.mocked(mockRepository.findBySlug).mockResolvedValue(makeInvitation());
      vi.mocked(mockPrisma.guest.findFirst).mockResolvedValue({ id: 'guest-1', name: 'Juan' } as any);
      vi.mocked(mockPrisma.guest.update).mockResolvedValue({ id: 'guest-1', status: 'confirmed' } as any);
      vi.mocked(mockEmailService.sendRsvpNotification).mockResolvedValue(undefined);

      await service.submitRsvp('test', 'guest-1', 'confirmed');

      expect(mockEmailService.sendRsvpNotification).toHaveBeenCalledWith(
        'ana@test.com',
        'Ana',
        'Juan',
        'confirmed',
        'Ana y Carlos',
      );
    });

    it('does not fail if email notification fails', async () => {
      vi.mocked(mockRepository.findBySlug).mockResolvedValue(makeInvitation());
      vi.mocked(mockPrisma.guest.findFirst).mockResolvedValue({ id: 'guest-1', name: 'Juan' } as any);
      vi.mocked(mockPrisma.guest.update).mockResolvedValue({ id: 'guest-1', status: 'confirmed' } as any);
      vi.mocked(mockEmailService.sendRsvpNotification).mockRejectedValue(new Error('SMTP down'));

      const result = await service.submitRsvp('test', 'guest-1', 'confirmed');
      expect(result.status).toBe('confirmed');
    });
  });
});
