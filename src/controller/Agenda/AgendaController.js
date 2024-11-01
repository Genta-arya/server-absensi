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
        deskripsi: deskripsi,
        groupId: grupId,
      },
    });
    return sendResponse(res, 200, "Agenda berhasil dibuat", newAgenda);
  } catch (error) {
    handleError(res, error);
  }
};

export const getAgendaByGroup = async (req, res) => {
  const { groupId, userId, creatorId } = req.body;

  

  // Validasi input

  if (!groupId) {
    return res
      .status(400)
      .json({ message: "Group ID, user ID, dan creator ID harus diisi." });
  }

  try {
    // Periksa apakah grup kegiatan dengan ID tersebut ada dan creator bisakan mengaksesnya

    // ambil creator grup

    // JIKA ADA CREATOR ID NYA MAKA  PAKE DI WHERE
    let grup;
    if (creatorId) {
      grup = await prisma.groupKegiatan.findFirst({
        where: {
          creatorId: creatorId,
        },
      });

      if (!grup) {
        return res
          .status(403)
          .json({ message: "Anda tidak berhak mengakses agenda grup ini." });
      }
    } else {
      if (!userId) {
        return res.status(400).json({ message: "User ID harus diisi." });
      }
      grup = await prisma.groupKegiatan.findFirst({
        where: { id: groupId },
        include: {
          mahasiswa: {
            where: { id: userId },
          },
        },
      });
      if (grup.mahasiswa.length === 0) {
        return res
          .status(403)
          .json({ message: "Anda tidak berhak mengakses agenda grup ini." });
      }
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

export const ambilAgenda = async (req, res) => {
  const { idAgenda, idUser, status = true } = req.body;
  console.log(idAgenda, idUser, status);
  // validate
  if (!idAgenda) {
    return sendResponse(res, 400, "Mohon lengkapi idAgenda");
  }
  if (!idUser) {
    return sendResponse(res, 400, "Mohon lengkapi idUser");
  }

  try {
    // check id agenda
    const agenda = await prisma.agenda.findFirst({
      where: { id: idAgenda },
    });

    // check id user
    const user = await prisma.user.findFirst({
      where: { id: idUser },
    });

    if (!agenda) {
      return sendResponse(res, 400, "Id agenda tidak ditemukan");
    }

    if (!user) {
      return sendResponse(res, 400, "Id user tidak ditemukan");
    }
    // cek agenda hanya bisa diambil 1 m
    const form = await prisma.agenda.findFirst({
      where: {
        idUser: idUser,
        groupId: agenda.groupId,
      },
    });

    if (form) {
      return sendResponse(
        res,
        400,
        "Tidak boleh mengambil agenda lebih dari 1"
      );
    } else {
      await prisma.agenda.update({
        where: { id: idAgenda },
        data: {
          status: status,
          idUser: idUser,
        },
      });
    }

    // create data form  cek 1 agenda hanya bisa 1 mahasiswa
    const checkForm = await prisma.formAgenda.findFirst({
      where: {
        agendaId: idAgenda,
        mhsId: idUser,
      },
    });

    if (checkForm) {
      return sendResponse(res, 400, "Agenda sudah digunakan");
    } else {
      await prisma.formAgenda.create({
        data: {
          agendaId: idAgenda,
          mhsId: idUser,
        },
      });
    }

    return sendResponse(res, 200, "Agenda berhasil diambil");
  } catch (error) {
    handleError(res, error);
  }
};
