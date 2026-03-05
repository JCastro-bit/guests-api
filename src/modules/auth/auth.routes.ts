import { FastifyPluginAsync } from 'fastify';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import {
  RegisterBodySchema,
  LoginBodySchema,
  AuthResponseSchema,
  UserResponseSchema,
  AuthErrorSchema,
  ForgotPasswordBodySchema,
  ResetPasswordBodySchema,
  MessageResponseSchema,
} from './auth.schema';
import { ErrorResponseSchema } from '../../schemas/error.schema';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const repository = new AuthRepository(fastify.prisma);
  const service = new AuthService(repository);
  const controller = new AuthController(service);

  fastify.post('/register', {
    schema: {
      tags: ['auth'],
      summary: 'Register a new user',
      body: RegisterBodySchema,
      response: {
        201: AuthResponseSchema,
        409: AuthErrorSchema,
      },
    },
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 hour',
        errorResponseBuilder: () => ({
          statusCode: 429,
          error: 'Demasiados registros desde esta IP. Intenta en una hora.',
        }),
      },
    },
    handler: controller.register.bind(controller),
  });

  fastify.post('/login', {
    schema: {
      tags: ['auth'],
      summary: 'Login with email and password',
      body: LoginBodySchema,
      response: {
        200: AuthResponseSchema,
        401: AuthErrorSchema,
      },
    },
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '15 minutes',
        errorResponseBuilder: () => ({
          statusCode: 429,
          error: 'Demasiados intentos de inicio de sesion. Espera 15 minutos.',
        }),
      },
    },
    handler: controller.login.bind(controller),
  });

  fastify.get('/me', {
    schema: {
      tags: ['auth'],
      summary: 'Get current user profile',
      response: {
        200: UserResponseSchema,
        401: AuthErrorSchema,
      },
      security: [{ bearerAuth: [] }],
    },
    preHandler: [fastify.authenticate],
    handler: controller.me.bind(controller),
  });

  fastify.post('/forgot-password', {
    schema: {
      tags: ['auth'],
      summary: 'Request password reset email',
      body: ForgotPasswordBodySchema,
      response: {
        200: MessageResponseSchema,
        400: ErrorResponseSchema,
      },
    },
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 hour',
        errorResponseBuilder: () => ({
          statusCode: 429,
          error: 'Demasiadas solicitudes. Intenta en una hora.',
        }),
      },
    },
    handler: controller.forgotPassword.bind(controller),
  });

  fastify.post('/reset-password', {
    schema: {
      tags: ['auth'],
      summary: 'Reset password with token',
      body: ResetPasswordBodySchema,
      response: {
        200: MessageResponseSchema,
        400: AuthErrorSchema,
      },
    },
    handler: controller.resetPassword.bind(controller),
  });
};

export default authRoutes;
