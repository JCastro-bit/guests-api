import { FastifyRequest, FastifyReply } from 'fastify';
import { PublicInvitationService } from './public-invitation.service';
import { PublicSlugParams, RsvpBody } from './public-invitation.schema';

export class PublicInvitationController {
  constructor(private readonly service: PublicInvitationService) {}

  async getBySlug(
    request: FastifyRequest<{ Params: PublicSlugParams }>,
    reply: FastifyReply,
  ) {
    const result = await this.service.getBySlug(request.params.slug);
    return reply.status(200).send(result);
  }

  async submitRsvp(
    request: FastifyRequest<{ Params: PublicSlugParams; Body: RsvpBody }>,
    reply: FastifyReply,
  ) {
    const { slug } = request.params;
    const { guestId, status, message } = request.body;
    const result = await this.service.submitRsvp(slug, guestId, status, message);
    return reply.status(200).send(result);
  }
}
