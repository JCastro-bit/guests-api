import { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import { FastifySwaggerUiOptions } from '@fastify/swagger-ui';

export const swaggerOptions: FastifyDynamicSwaggerOptions = {
  openapi: {
    info: {
      title: 'LOVEPOSTAL — Guests API',
      description: 'API REST para gestión de invitados, invitaciones y mesas de boda. Parte de la plataforma LOVEPOSTAL.',
      version: '1.0.0',
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
      { name: 'invitations', description: 'Gestión de invitaciones' },
      { name: 'guests', description: 'Gestión de invitados' },
      { name: 'tables', description: 'Gestión de mesas' },
      { name: 'stats', description: 'Estadísticas y dashboard' },
    ],
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
