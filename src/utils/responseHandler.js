// utils/responseHandler.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const sendResponse = async (res, statusCode, message, data = null) => {
  const responsePayload = {
    message,
  };

  if (data) {
    responsePayload.data = data;
  }

  // Simpan log ke database jika status code bukan 200 (misalnya untuk status error atau informasi penting lainnya)
  if (statusCode === 200) {
    await prisma.errorLog.create({
      data: {
        message: message,
        detail: "sukses",
        statusCode: 200,
      },
    });
  }

  return res.status(statusCode).json(responsePayload);
};
