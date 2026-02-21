import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { swaggerOptions, swaggerUiOptions } from './config/swagger';
import prismaPlugin from './plugins/prisma';
import jwtPlugin from './plugins/jwt';
import errorHandlerPlugin from './plugins/error-handler';
import authRoutes from './modules/auth/auth.routes';
import invitationRoutes from './modules/invitations/invitation.routes';
import guestRoutes from './modules/guests/guest.routes';
import statsRoutes from './modules/stats/stats.routes';
import tableRoutes from './modules/tables/table.routes';

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

  // Security & CORS
  await fastify.register(helmet, { contentSecurityPolicy: false });
  await fastify.register(cors, { origin: true });

  // Documentation
  await fastify.register(swagger, swaggerOptions);
  await fastify.register(swaggerUi, swaggerUiOptions);

  // Database
  await fastify.register(prismaPlugin);

  // JWT (DEBE ir antes de las rutas que usan fastify.authenticate)
  await fastify.register(jwtPlugin);

  // Error handling
  await fastify.register(errorHandlerPlugin);

  // Routes
  await fastify.register(authRoutes, { prefix: '/api/v1/auth' });
  await fastify.register(invitationRoutes, { prefix: '/api/v1/invitations' });
  await fastify.register(guestRoutes, { prefix: '/api/v1/guests' });
  await fastify.register(statsRoutes, { prefix: '/api/v1/stats' });
  await fastify.register(tableRoutes, { prefix: '/api/v1/tables' });

  // Health check
  fastify.get('/health', async () => ({ status: 'ok' }));

  return fastify;
};
