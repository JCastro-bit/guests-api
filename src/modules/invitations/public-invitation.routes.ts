import { FastifyPluginAsync } from 'fastify';
import { InvitationRepository } from './invitation.repository';
import { EmailService } from '../email/email.service';
import { PublicInvitationService } from './public-invitation.service';
import { PublicInvitationController } from './public-invitation.controller';
import {
  PublicInvitationResponseSchema,
  PublicSlugParamsSchema,
  RsvpBodySchema,
  RsvpResponseSchema,
  PublicSlugParams,
  RsvpBody,
} from './public-invitation.schema';
import { ErrorResponseSchema } from '../../schemas/error.schema';

const publicInvitationRoutes: FastifyPluginAsync = async (fastify) => {
  const repository = new InvitationRepository(fastify.prisma);
  const emailService = new EmailService(fastify);
  const service = new PublicInvitationService(repository, fastify.prisma, emailService);
  const controller = new PublicInvitationController(service);

  fastify.get<{ Params: PublicSlugParams }>(
    '/:slug',
    {
      schema: {
        tags: ['Public'],
        summary: 'Obtener datos publicos de una invitacion por slug',
        params: PublicSlugParamsSchema,
        response: {
          200: PublicInvitationResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    (req, reply) => controller.getBySlug(req, reply),
  );

  fastify.patch<{ Params: PublicSlugParams; Body: RsvpBody }>(
    '/:slug/rsvp',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '5 minutes',
          errorResponseBuilder: () => ({
            statusCode: 429,
            error: 'Demasiadas solicitudes. Intenta en unos minutos.',
          }),
        },
      },
      schema: {
        tags: ['Public'],
        summary: 'Confirmar o declinar asistencia a una boda',
        params: PublicSlugParamsSchema,
        body: RsvpBodySchema,
        response: {
          200: RsvpResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    (req, reply) => controller.submitRsvp(req, reply),
  );
};

export default publicInvitationRoutes;
