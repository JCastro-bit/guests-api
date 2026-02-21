import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  // Solo hacer seed si ambas variables están presentes
  if (!email || !password) {
    console.log('ADMIN_EMAIL or ADMIN_PASSWORD not set, skipping admin seed.');
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

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
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
