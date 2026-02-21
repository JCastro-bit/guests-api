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
} from './auth.schema';

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
};

export default authRoutes;
