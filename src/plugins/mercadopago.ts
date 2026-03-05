import fp from 'fastify-plugin';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import type { FastifyPluginAsync } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    mp: {
      preference: Preference;
      payment: Payment;
    };
  }
}

const mercadopagoPlugin: FastifyPluginAsync = async (fastify) => {
  const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN ?? '',
    options: { timeout: 5000 },
  });

  fastify.decorate('mp', {
    preference: new Preference(client),
    payment: new Payment(client),
  });
};

export default fp(mercadopagoPlugin);
