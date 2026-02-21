import { FastifyPluginAsync, FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

// Mapeo de mensajes de error conocidos a status codes HTTP
const ERROR_STATUS_MAP: Record<string, number> = {
  // Auth errors
  'Email already registered': 409,
  'Invalid email or password': 401,
  'User not found': 404,
  'No autorizado': 401,

  // Guest errors
  'Guest not found': 404,
  'Guest with this name already exists': 409,
  'Guest with this operationId already exists': 409,

  // Invitation errors
  'Invitation not found': 404,
  'Invitation with this name already exists': 409,
  'Invitation with this operationId already exists': 409,
  'PrismaClient is required for transaction operations': 500,

  // Table errors
  'Table not found': 404,
  'Table with this name already exists': 409,
  'Cannot delete table with assigned invitations': 409,
};

const errorHandlerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    fastify.log.error(error);

    // Si el error ya tiene statusCode (ej: errores de validación de Fastify), usarlo
    if (error.statusCode) {
      return reply.status(error.statusCode).send({
        error: {
          statusCode: error.statusCode,
          message: error.message,
        },
      });
    }

    // Buscar en el mapeo de errores conocidos
    const mappedStatus = ERROR_STATUS_MAP[error.message];
    if (mappedStatus) {
      return reply.status(mappedStatus).send({
        error: {
          statusCode: mappedStatus,
          message: error.message,
        },
      });
    }

    // Errores con "capacity exceeded" o "Cannot reduce capacity" (mensajes dinámicos)
    if (error.message.includes('capacity exceeded') || error.message.includes('Cannot reduce capacity')) {
      return reply.status(409).send({
        error: {
          statusCode: 409,
          message: error.message,
        },
      });
    }

    // Default: 500
    const statusCode = 500;
    const message = 'Internal Server Error';

    reply.status(statusCode).send({
      error: {
        statusCode,
        message: process.env.NODE_ENV !== 'production' ? error.message : message,
        ...(fastify.log.level === 'debug' && { stack: error.stack }),
      },
    });
  });
};

export default fp(errorHandlerPlugin);
