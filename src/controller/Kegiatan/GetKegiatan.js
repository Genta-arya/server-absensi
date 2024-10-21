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
    // Mendapatkan kegiatan yang dibuat oleh user atau kegiatan di mana user ada di grup
    const kegiatan = await prisma.kegiatan.findMany({
      where: {
        AND: [
          { creatorId: id }, // Kegiatan yang dibuat oleh user
          // { groups: { some: { mahasiswa: { some: { id: id } } } } }, // Kegiatan di mana user ada di grup
          { visible: true },
        ],
      },
    });

    return sendResponse(res, 200, "Berhasil ditemukan", kegiatan);
  } catch (error) {
    handleError(res, error);
  }
};

export const getGrups = async (req, res) => {
  const { id } = req.params;

  // Validasi ID
  if (!id) {
    return sendResponse(res, 400, "Mohon lengkapi id");
  }
  //  find kegiatan by id

  const data = await prisma.kegiatan.findUnique({
    where: { id },
  });

  if (!data) {
    return sendResponse(res, 404, "Kegiatan tidak ditemukan");
  }
  try {
    // ambil yang visbile true
    const data = await prisma.kegiatan.findUnique({
      where: { id },
      select: {
        groups: {
          select: {
            id: true,
            nama_grup: true,
            mahasiswa:{
              select:{
                id:true,
                nim:true,
                name:true,
                email:true,
                avatar:true
              }
            }
          },

        },
      },
    });

    return sendResponse(res, 200, "Berhasil ditemukan", data);
  } catch (error) {
    handleError(res, error);
  }
};
