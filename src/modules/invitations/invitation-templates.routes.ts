import { FastifyPluginAsync } from 'fastify';
import { Type } from '@sinclair/typebox';
import { TEMPLATES, TemplateStyle } from './templates.constants';

const VALID_STYLES = ['romantico', 'moderno', 'rustico', 'minimalista'];

const invitationTemplatesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/templates', {
    schema: {
      tags: ['invitations'],
      summary: 'Get available invitation templates',
      querystring: Type.Object({
        style: Type.Optional(Type.String()),
      }),
      response: {
        200: Type.Object({
          templates: Type.Array(Type.Object({
            id: Type.String(),
            name: Type.String(),
            plan: Type.String(),
            style: Type.String(),
            previewUrl: Type.String(),
            defaultColorPalette: Type.String(),
          })),
          userPlan: Type.String(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { style } = request.query as { style?: string };

      let userPlan = 'free';
      try {
        await fastify.authenticate(request, reply);
        if (request.user?.id) {
          const user = await fastify.prisma.user.findFirst({
            where: { id: request.user.id },
            select: { plan: true },
          });
          if (user) userPlan = user.plan;
        }
      } catch {
        // No JWT or invalid — default to 'free'
      }

      let templates = TEMPLATES;
      if (style && VALID_STYLES.includes(style)) {
        templates = templates.filter((t) => t.style === (style as TemplateStyle));
      }

      return reply.send({ templates, userPlan });
    },
  });
};

export default invitationTemplatesRoutes;
