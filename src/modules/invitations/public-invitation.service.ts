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

    return {
      slug: invitation.slug,
      coupleName: invitation.name,
      message: invitation.message ?? null,
      eventDate: invitation.eventDate
        ? invitation.eventDate.toISOString().split('T')[0]
        : null,
      location: invitation.location ?? null,
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
