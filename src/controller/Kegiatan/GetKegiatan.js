import prisma from "../../config/prisma.js";
import { handleError } from "../../utils/errorHandler.js";
import { sendResponse } from "../../utils/responseHandler.js";

export const getKegiatan = async (req, res) => {
    const { id } = req.body;
  
    // Validasi ID
    if (!id) {
      return sendResponse(res, 400, "Mohon lengkapi id");
    }
  
    // Cek apakah user ada
    const user = await prisma.user.findUnique({
      where: { id },
    });
  
    if (!user) {
      return sendResponse(res, 404, "User tidak ditemukan");
    }
  
    try {
      let kegiatan;
  
      // Cek jika user adalah mahasiswa
      if (user.role === 'MHS') {
        // Ambil kegiatan berdasarkan mahasiswa
        kegiatan = await prisma.kegiatan.findMany({
          where: {
            mahasiswa: {
              some: { id: user.id }, // Mencari kegiatan yang diikuti oleh mahasiswa
            },
          },
          include: {
            mahasiswa: {
              select: { // Hanya ambil field yang diperlukan
                id: true,
                nim: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
              },
            },
            creator: {
              select: { // Hanya ambil field yang diperlukan
                id: true,
                nim: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
              },
            },
          },
        });
      } else {
        // Jika user adalah creator, ambil kegiatan yang dibuat oleh creator
        kegiatan = await prisma.kegiatan.findMany({
          where: {
            creatorId: user.id,
          },
          include: {
            mahasiswa: {
              select: { // Hanya ambil field yang diperlukan
                id: true,
                nim: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
              },
            },
          },
        });
      }
  
      return sendResponse(res, 200, "Sukses", kegiatan);
    } catch (error) {
      handleError(res, error);
    }
  };
  