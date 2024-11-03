import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const handleError = async (
  res,
  error,
  customMessage = "Terjadi kesalahan pada server"
) => {
  console.error(error);

  // Simpan log error ke database
  await prisma.errorLog.create({
    data: {
      message: customMessage,
      statusCode: 500,
      detail: error,
    },
  });

  return res.status(500).json({ message: customMessage, Detail: error });
};
