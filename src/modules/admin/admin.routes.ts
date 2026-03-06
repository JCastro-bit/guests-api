import { FastifyPluginAsync } from 'fastify';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { EmailService } from '../email/email.service';
import {
  ActivatePlanBodySchema,
  ActivatePlanResponseSchema,
  ActivatePlanBody,
} from './admin.schema';
import { ErrorResponseSchema } from '../../schemas/error.schema';

const adminRoutes: FastifyPluginAsync = async (fastify) => {
  const service = new AdminService(fastify.prisma, new EmailService(fastify));
  const controller = new AdminController(service);

  fastify.post<{ Body: ActivatePlanBody }>(
    '/activate-plan',
    {
      preHandler: [
        fastify.authenticate,
        async (request, reply) => {
          if (request.user?.role !== 'admin') {
            return reply.status(403).send({
              error: {
                statusCode: 403,
                message: 'Solo administradores pueden realizar esta accion.',
              },
            });
          }
        },
      ],
      schema: {
        tags: ['Admin'],
        summary: 'Activar plan manualmente (pago en efectivo/manual)',
        security: [{ bearerAuth: [] }],
        body: ActivatePlanBodySchema,
        response: {
          200: ActivatePlanResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    (req, reply) => controller.activatePlan(req, reply),
  );
};

export default adminRoutes;
