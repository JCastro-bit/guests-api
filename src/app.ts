import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { swaggerOptions, swaggerUiOptions } from './config/swagger';
import prismaPlugin from './plugins/prisma';
import errorHandlerPlugin from './plugins/error-handler';
import invitationRoutes from './modules/invitations/invitation.routes';
import guestRoutes from './modules/guests/guest.routes';

export const buildApp = async () => {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport: process.env.NODE_ENV !== 'production' ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      } : undefined,
    },
  });

  await fastify.register(helmet, { contentSecurityPolicy: false });
  await fastify.register(cors, { origin: true });
  await fastify.register(swagger, swaggerOptions);
  await fastify.register(swaggerUi, swaggerUiOptions);
  await fastify.register(prismaPlugin);
  await fastify.register(errorHandlerPlugin);

  await fastify.register(invitationRoutes, { prefix: '/api/v1/invitations' });
  await fastify.register(guestRoutes, { prefix: '/api/v1/guests' });

  fastify.get('/health', async () => ({ status: 'ok' }));

  return fastify;
};
