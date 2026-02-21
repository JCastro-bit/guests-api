import { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import { FastifySwaggerUiOptions } from '@fastify/swagger-ui';

export const swaggerOptions: FastifyDynamicSwaggerOptions = {
  openapi: {
    info: {
      title: 'LOVEPOSTAL — Guests API',
      description: 'API REST para gestión de invitados, invitaciones y mesas de boda. Parte de la plataforma LOVEPOSTAL.',
      version: '1.1.0',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development',
      },
      {
        url: 'https://api.lovepostal.studio',
        description: 'Production',
      },
    ],
    tags: [
      { name: 'auth', description: 'Autenticación y registro de usuarios' },
      { name: 'invitations', description: 'Gestión de invitaciones' },
      { name: 'guests', description: 'Gestión de invitados' },
      { name: 'tables', description: 'Gestión de mesas' },
      { name: 'stats', description: 'Estadísticas y dashboard' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtenido de /api/v1/auth/login o /api/v1/auth/register',
        },
      },
    },
  },
};

export const swaggerUiOptions: FastifySwaggerUiOptions = {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: false,
  },
  staticCSP: true,
};
