const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const parsedRounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
const BCRYPT_ROUNDS = Number.isNaN(parsedRounds) || parsedRounds < 4 || parsedRounds > 31 ? 10 : parsedRounds;

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log('ADMIN_EMAIL or ADMIN_PASSWORD not set, skipping admin seed.');
    return;
  }

  const prisma = new PrismaClient();

  try {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const admin = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        role: 'admin',
      },
      create: {
        email,
        password: hashedPassword,
        name: 'Admin',
        role: 'admin',
      },
    });

    console.log(`Admin user seeded: ${admin.email} (${admin.id})`);
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('Error during Prisma disconnect in seed:', disconnectError);
    }
  }
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
