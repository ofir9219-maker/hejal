import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || process.argv[2];
  const password = process.env.ADMIN_PASSWORD || process.argv[3];
  const nombre = process.env.ADMIN_NOMBRE || process.argv[4] || 'Admin';
  if (!email || !password) {
    console.error('Uso: tsx scripts/create-admin.ts <email> <password> [nombre]');
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.usuario.upsert({
    where: { email },
    update: { passwordHash, nombre },
    create: { email, passwordHash, nombre, rol: 'admin' },
  });
  console.log(`Usuario ${email} creado/actualizado`);
}

main().finally(() => prisma.$disconnect());
