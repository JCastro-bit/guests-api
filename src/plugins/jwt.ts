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
    async (request: FastifyRequest, _reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        throw new Error('Unauthorized');
      }
    }
  );
};

export default fp(jwtPlugin);
