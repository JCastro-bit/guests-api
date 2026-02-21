import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import fjwt from '@fastify/jwt';
import { env } from '../config/env';

const jwtPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fjwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: '7d',
    },
  });

  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.code(401).send({
          error: {
            statusCode: 401,
            message: 'No autorizado',
          },
        });
      }
    }
  );
};

export default fp(jwtPlugin);
