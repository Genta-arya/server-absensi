// src/prisma.ts
import { PrismaClient } from '@prisma/client';

// Membuat satu instance Prisma Client
const prisma = new PrismaClient({
  // log: ['query', 'info', 'warn', 'error'], // Log untuk membantu debug
});

// Pastikan untuk menutup koneksi saat aplikasi ditutup
const shutDownGracefully = async () => {
  await prisma.$disconnect();
};

// Menangani SIGINT dan SIGTERM
process.on('SIGINT', shutDownGracefully);
process.on('SIGTERM', shutDownGracefully);

export default prisma;
