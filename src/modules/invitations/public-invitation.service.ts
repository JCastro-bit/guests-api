import { PrismaClient } from '@prisma/client';
import { InvitationRepository } from './invitation.repository';
import { EmailService } from '../email/email.service';
import { NotFoundError } from '../../errors/app-error';

export class PublicInvitationService {
  constructor(
    private readonly repository: InvitationRepository,
    private readonly prisma: PrismaClient,
    private readonly emailService: EmailService,
  ) {}

  async getBySlug(slug: string) {
    const invitation = await this.repository.findBySlug(slug);
    if (!invitation) {
      throw NotFoundError('Invitation');
    }

    // Fetch master invitation (oldest) for global wedding data
    const master = await this.prisma.invitation.findFirst({
      where: { userId: invitation.userId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: { name: true, message: true, eventDate: true, location: true, templateId: true, colorPalette: true },
    });

    return {
      slug: invitation.slug,
      coupleName: master?.name ?? invitation.name,
      message: master?.message ?? null,
      eventDate: master?.eventDate
        ? master.eventDate.toISOString().split('T')[0]
        : null,
      location: master?.location ?? null,
      templateId: master?.templateId ?? null,
      colorPalette: master?.colorPalette ?? null,
      ownerPlan: invitation.user?.plan ?? 'free',
      tableName: invitation.table?.name ?? null,
      guests: (invitation.guests ?? []).map((g) => ({
        id: g.id,
        name: g.name,
        status: g.status,
      })),
    };
  }

  async submitRsvp(
    slug: string,
    guestId: string,
    status: 'confirmed' | 'declined',
    message?: string,
  ) {
    const invitation = await this.repository.findBySlug(slug);
    if (!invitation) throw NotFoundError('Invitation');

    const guest = await this.prisma.guest.findFirst({
      where: {
        id: guestId,
        invitationId: invitation.id,
        deletedAt: null,
      },
    });
    if (!guest) throw NotFoundError('Guest');

    const updated = await this.prisma.guest.update({
      where: { id: guestId },
      data: {
        status,
        ...(message !== undefined ? { guestMessage: message } : {}),
      },
    });

    const owner = invitation.user;
    if (owner?.email) {
      this.emailService
        .sendRsvpNotification(
          owner.email,
          owner.name ?? 'Pareja',
          guest.name,
          status,
          invitation.name,
        )
        .catch((err: unknown) => {
          console.error('[RSVP] Email notification failed:', err);
        });
    }

    return {
      guestId: updated.id,
      status: updated.status,
      message:
        status === 'confirmed'
          ? 'Asistencia confirmada. La pareja ha sido notificada.'
          : 'Respuesta registrada. La pareja ha sido notificada.',
    };
  }
}
