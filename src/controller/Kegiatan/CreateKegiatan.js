import prisma from "../../config/prisma.js";
import { handleError } from "../../utils/errorHandler.js";
import { generateRandomCode } from "../../utils/GenerateRandomCode.js";
import { sendResponse } from "../../utils/responseHandler.js";

export const CreateKegiatan = async (req, res) => {
  const { creatorId, nama, deskripsi, waktumulai, waktuselesai } = req.body;

  // Validasi
  if (!creatorId) {
    return sendResponse(res, 400, "Mohon lengkapi id creator");
  }

  if (!nama) {
    return sendResponse(res, 400, "Mohon lengkapi nama");
  }

  if (!deskripsi) {
    return sendResponse(res, 400, "Mohon lengkapi deskripsi");
  }

  if (!waktumulai) {
    return sendResponse(res, 400, "Mohon lengkapi waktu mulai");
  }

  if (!waktuselesai) {
    return sendResponse(res, 400, "Mohon lengkapi waktu selesai");
  }

  //   check apakah id ada di database
  const user = await prisma.user.findUnique({
    where: { id: creatorId },
  });

  if (!user) {
    return sendResponse(res, 404, "User not found");
  }

  //   check apakah id itu role dosen atau bukan
  if (user.role !== "DOSEN") {
    return sendResponse(res, 400, "User bukan dosen");
  }

  try {
    // Menghasilkan kode kegiatan acak
    const kodeKegiatan = generateRandomCode();

    // Membuat kegiatan baru
    const data = await prisma.kegiatan.create({
      data: {
        creatorId: creatorId, // Menggunakan ID dosen yang membuat kegiatan
        nama: nama,
        deskripsi: deskripsi,
        waktumulai: new Date(waktumulai), // Konversi ke format Date
        waktuselesai: new Date(waktuselesai), // Konversi ke format Date
        Kd_kegiatan: kodeKegiatan, // Menambahkan kode kegiatan acak
      },
    });

    return sendResponse(res, 201, "Kegiatan berhasil dibuat", data);
  } catch (error) {
    handleError(res, error);
  }
};
export const addMahasiswaGroup= async (req, res) => {
  const { id, mahasiswaId } = req.body;

  // Validasi
  if (!id) {
    return sendResponse(res, 400, "Mohon lengkapi id kegiatan");
  }
  if (!mahasiswaId || !Array.isArray(mahasiswaId)) {
    return sendResponse(res, 400, "Mohon lengkapi mahasiswaId sebagai array");
  }

  // Cek apakah kegiatan ada
  const kegiatan = await prisma.groupKegiatan.findUnique({
    where: { id },
    include: { mahasiswa: true }, // Termasuk mahasiswa yang terhubung
  });

  if (!kegiatan) {
    return sendResponse(res, 404, "Kegiatan tidak ditemukan");
  }

  // Cek mahasiswa yang sudah ada di kegiatan
  const existingMahasiswaIds = kegiatan.mahasiswa.map((mhs) => mhs.id);
  const newMahasiswaIds = mahasiswaId.filter(
    (mhsId) => !existingMahasiswaIds.includes(mhsId)
  );

  if (newMahasiswaIds.length === 0) {
    return sendResponse(
      res,
      400,
      "ops , ada mahasiswa yang sudah ada di grup ini"
    );
  }

  // Cek apakah semua mahasiswa ada
  const mahasiswaList = await prisma.user.findMany({
    where: {
      id: {
        in: newMahasiswaIds, // Mencari mahasiswa yang belum terdaftar di kegiatan
      },
    },
  });

  if (mahasiswaList.length !== newMahasiswaIds.length) {
    return sendResponse(
      res,
      404,
      "Salah satu atau lebih mahasiswa tidak ditemukan"
    );
  }

  try {
    const data = await prisma.groupKegiatan.update({
      where: { id },
      data: {
        mahasiswa: {
          connect: newMahasiswaIds.map((mhsId) => ({ id: mhsId })), // Menghubungkan mahasiswa yang baru
        },
      },
    });
    return sendResponse(
      res,
      201,
      "Mahasiswa berhasil ditambahkan ke kegiatan",
      data
    );
  } catch (error) {
    handleError(res, error);
  }
};
export const createGroupKegiatan = async (req, res) => {
  const { id_kegiatan, nama_grup } = req.body;

  // Validasi
  if (!id_kegiatan) {
    return sendResponse(res, 400, "Mohon lengkapi id kegiatan");
  }
  if (!nama_grup) {
    return sendResponse(res, 400, "Mohon lengkapi nama grup");
  }

  try {
    // Cek apakah kegiatan ada
    const kegiatan = await prisma.kegiatan.findUnique({
      where: { id: id_kegiatan },
    });

    if (!kegiatan) {
      return sendResponse(res, 404, "Kegiatan tidak ditemukan");
    }

    // Cek apakah grup dengan nama yang sama sudah ada di kegiatan ini
    const existingGroup = await prisma.groupKegiatan.findFirst({
      where: {
        nama_grup: nama_grup,
        kegiatan: {
          some: { id: id_kegiatan }
        }
      },
    });

    if (existingGroup) {
      return sendResponse(res, 409, "Nama grup sudah digunakan dalam kegiatan ini");
    }

    // Buat grup kegiatan baru
    const newGroup = await prisma.groupKegiatan.create({
      data: {
        nama_grup: nama_grup,
        kegiatan: {
          connect: { id: id_kegiatan }
        }
      },
    });

    return sendResponse(
      res,
      201,
      "Group kegiatan berhasil dibuat",
      newGroup
    );
  } catch (error) {
    handleError(res, error);
  }
};
