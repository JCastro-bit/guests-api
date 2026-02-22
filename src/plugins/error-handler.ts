import { FastifyPluginAsync, FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { AppError } from '../errors/app-error';

const errorHandlerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    fastify.log.error(error);

    // Si el error es un AppError, usar su statusCode directamente
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: {
          statusCode: error.statusCode,
          message: error.message,
        },
      });
    }

    // Si el error ya tiene statusCode (ej: errores de validación de Fastify), usarlo
    if (error.statusCode) {
      return reply.status(error.statusCode).send({
        error: {
          statusCode: error.statusCode,
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
