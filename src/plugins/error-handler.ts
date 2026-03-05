import { FastifyPluginAsync, FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { AppError } from '../errors/app-error';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';

const PRISMA_ERROR_MAP: Record<string, { statusCode: number; message: string }> = {
  P2002: { statusCode: 409, message: 'Ya existe un registro con ese valor.' },
  P2025: { statusCode: 404, message: 'El recurso solicitado no existe o fue eliminado.' },
  P2003: { statusCode: 400, message: 'La operacion viola una restriccion de integridad.' },
  P2007: { statusCode: 400, message: 'El valor proporcionado esta fuera del rango permitido.' },
  P2006: { statusCode: 400, message: 'El formato de los datos no es valido.' },
  P2012: { statusCode: 400, message: 'Faltan campos requeridos.' },
  P1001: { statusCode: 503, message: 'No se puede conectar a la base de datos. Intenta mas tarde.' },
  P1002: { statusCode: 503, message: 'La base de datos no esta disponible. Intenta mas tarde.' },
};

const errorHandlerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    // AppError — nuestros errores de negocio
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: {
          statusCode: error.statusCode,
          message: error.message,
        },
      });
    }

    // Prisma — errores conocidos con código
    if (error instanceof PrismaClientKnownRequestError) {
      const mapped = PRISMA_ERROR_MAP[error.code];
      if (mapped) {
        return reply.status(mapped.statusCode).send({
          error: {
            statusCode: mapped.statusCode,
            message: mapped.message,
            code: error.code,
          },
        });
      }
      request.log.error({ prismaCode: error.code }, 'Unmapped Prisma error');
      return reply.status(500).send({
        error: {
          statusCode: 500,
          message: 'Error de base de datos inesperado.',
          code: error.code,
        },
      });
    }

    // Prisma — errores de validación (tipos incorrectos en queries)
    if (error instanceof PrismaClientValidationError) {
      return reply.status(400).send({
        error: {
          statusCode: 400,
          message: 'Los datos enviados no son validos.',
        },
      });
    }

    // Rate limit (429)
    if (error.statusCode === 429) {
      return reply.status(429).send({
        error: {
          statusCode: 429,
          message: error.message || 'Demasiadas solicitudes. Espera un momento.',
        },
      });
    }

    // Errores con statusCode definido (validación de Fastify, JWT, etc.)
    if (error.statusCode) {
      return reply.status(error.statusCode).send({
        error: {
          statusCode: error.statusCode,
          message: error.message,
        },
      });
    }

    // Default: 500
    request.log.error({ err: error }, 'Unhandled error');
    const isProduction = process.env.NODE_ENV === 'production';
    reply.status(500).send({
      error: {
        statusCode: 500,
        message: isProduction ? 'Error interno del servidor.' : error.message,
      },
    });
  });
};

export default fp(errorHandlerPlugin);
