import prisma from "../../config/prisma.js";
import { handleError } from "../../utils/errorHandler.js";
import bcrypt from "bcryptjs";
import { isValidRole } from "../../utils/roleValidator.js";
import { sendResponse } from "../../utils/responseHandler.js"; // Import utilitas baru

export const handleRegister = async (req, res) => {
  const { nim, password, role } = req.body;

  // Validasi nim
  if (!nim) {
    return sendResponse(res, 400, "Mohon lengkapi nim");
  }

  // Validasi password
  if (!password) {
    return sendResponse(res, 400, "Mohon lengkapi password");
  }

  // Validasi role
  if (!role) {
    return sendResponse(
      res,
      400,
      "Role tidak valid. Pilih antara MHS, DOSEN, atau ADMIN."
    );
  }

  // Cek apakah pengguna sudah ada
  const user = await prisma.user.findUnique({
    where: { nim },
  });

  if (user) {
    return sendResponse(res, 409, "NIM sudah terdaftar");
  }

  // Cek role
  if (!isValidRole(role)) {
    return sendResponse(
      res,
      400,
      "Role tidak valid. Pilih antara MHS, DOSEN, atau ADMIN."
    );
  }

  try {
    // Enkripsi password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 adalah jumlah salt rounds

    // Buat pengguna baru
    const newUser = await prisma.user.create({
      data: {
        nim,
        password: hashedPassword, // Simpan password yang telah dienkripsi
        role,
      },
    });

    // Kirim respons sukses dengan data pengguna baru
    return sendResponse(res, 201, "Pendaftaran berhasil", newUser);
  } catch (error) {
    handleError(res, error);
  }
};


export const handleLogin = async (req, res) => { 
    try {
        
    } catch (error) {
        handleError(res, error);
    }
}