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

  // find grup id

  const group = await prisma.groupKegiatan.findUnique({
    where: { id: grupId },
  });

  if (!group) {
    return sendResponse(res, 400, "Grup kegiatan tidak ditemukan");
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
  let grup;
  try {
    if (creatorId) {
      if (!creatorId) {
        return res.status(400).json({ message: "Creator ID harus diisi." });
      }
      grup = await prisma.groupKegiatan.findFirst({
        where: {
          creatorId: creatorId,
        },
        include: {
          kegiatan: true,
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

    // ambil data waktu mulai di grup

    const expired = await prisma.groupKegiatan.findFirst({
      where: { id: groupId },
      select: {
        kegiatan: {
          select: {
            waktuselesai: true,
          },
        },
      },
    });

    const agendas = await prisma.agenda.findMany({
      where: { groupId: groupId },
      include: { group: true },
    });

    const toWIBTime = () => {
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const wib = new Date(utc + 7 * 3600000);
      return wib;
    };

    console.log(expired.kegiatan.waktuselesai, toWIBTime());
    const isExpired = toWIBTime() > new Date(expired.kegiatan.waktuselesai);

    console.log("Apakah expired?", isExpired);

    res.status(200).json({
      message: "Daftar agenda berhasil diambil.",
      agendas: agendas,

      // jika waktu selesai melewati waktu sekarang maka expired false
      // jika waktu selesai belum melewati waktu sekarang maka expired true

      // comapre dengan iso

      expired: isExpired,
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
