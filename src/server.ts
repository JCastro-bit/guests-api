import { buildApp } from './app';
import { env } from './config/env';

const start = async () => {
  try {
    const app = await buildApp();

    await app.listen({ port: env.PORT, host: env.HOST });

    const signals = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        app.log.info(`Received ${signal}, closing server...`);
        await app.close();
        process.exit(0);
      });
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
