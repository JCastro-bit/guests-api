import fp from 'fastify-plugin';
import nodemailer from 'nodemailer';
import type { FastifyPluginAsync } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    mailer: nodemailer.Transporter;
  }
}

const mailerPlugin: FastifyPluginAsync = async (fastify) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  if (process.env.NODE_ENV !== 'production') {
    try {
      await transporter.verify();
      fastify.log.info('SMTP connection verified');
    } catch (err) {
      fastify.log.warn({ err }, 'SMTP connection failed — emails disabled');
    }
  }

  fastify.decorate('mailer', transporter);
};

export default fp(mailerPlugin);
