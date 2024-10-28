import prisma from "../../config/prisma.js";
import { handleError } from "../../utils/errorHandler.js";
import { sendResponse } from "../../utils/responseHandler.js";

export const createAgenda = async (req, res) => {
  const { id, name, grupId, deskripsi } = req.body;
  // validate
  if (!id) {
    return sendResponse(res, 400, "Mohon lengkapi id");
  }
  if (!name) {
    return sendResponse(res, 400, "Mohon lengkapi name");
  }
  if (!grupId) {
    return sendResponse(res, 400, "Mohon lengkapi grupId");
  }
  if (!deskripsi) {
    return sendResponse(res, 400, "Mohon lengkapi deskripsi");
  }
  if (!grupId) {
    return sendResponse(res, 400, "Mohon lengkapi grupId");
  }

  // check name
  const agenda = await prisma.agenda.findFirst({
    where: { nama: name },
  });

  if (agenda) {
    return sendResponse(res, 400, "Nama agenda sudah digunakan");
  }

  // check id ada dan role nya DOSEN
  const user = await prisma.user.findFirst({
    where: { id },
  });

  if (!user) {
    return sendResponse(res, 400, "Id tidak ditemukan");
  }

  if (user.role !== "DOSEN") {
    return sendResponse(res, 400, "Id bukan dosen");
  }

  try {
    const newAgenda = await prisma.agenda.create({
      data: {
        nama: name,
        createdId: id,
        groupId: grupId,
      },
    });
    return sendResponse(res, 200, "Agenda berhasil dibuat", newAgenda);
  } catch (error) {
    handleError(res, error);
  }
};

export const getAgendaByGroup = async (req, res) => {
  const { groupId, userId } = req.body;

  // Validasi input

 
  if (!groupId || !userId) {
    return res.status(400).json({ message: "Group ID & user ID harus diisi." });
  }

  try {
    // Periksa apakah grup kegiatan dengan ID tersebut ada
    const group = await prisma.groupKegiatan.findUnique({
      where: { id: groupId },
      include: {
        mahasiswa: {
          where: { id: userId },
        },
      },
    });

    if (!group) {
      return res
        .status(404)
        .json({ message: "Grup kegiatan tidak ditemukan." });
    }

    if (group.mahasiswa.length === 0) {
        return res.status(403).json({ message: "Anda tidak berhak mengakses agenda grup ini." });
    }

    // Dapatkan agenda berdasarkan groupId DAN TAMPILKAN JUGA NAMA GRUP NYA DI IDGRUP DI TABLE grup
    const agendas = await prisma.agenda.findMany({
      where: { groupId: groupId },
      include: { group: true },
    });
    // Periksa apakah ada agenda yang dibuat oleh user ini
   


    res.status(200).json({
      message: "Daftar agenda berhasil diambil.",
      agendas: agendas,
    });
  } catch (error) {
    console.error("Error fetching agendas:", error);
    res
      .status(500)
      .json({ message: "Terjadi kesalahan saat mengambil agenda." });
  }
};
