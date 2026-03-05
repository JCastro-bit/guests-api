import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';

const rateLimitPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: (_request, context) => ({
      statusCode: 429,
      error: `Demasiadas solicitudes. Intenta en ${Math.ceil(context.ttl / 1000)} segundos.`,
      retryAfter: Math.ceil(context.ttl / 1000),
    }),
    keyGenerator: (request) => {
      const user = request.user as { id?: string } | undefined;
      return user?.id ?? request.ip;
    },
  });
};

export default fp(rateLimitPlugin);
