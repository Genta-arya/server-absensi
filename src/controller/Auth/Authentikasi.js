import prisma from "../../config/prisma.js";
import { handleError } from "../../utils/errorHandler.js";
import bcrypt from "bcryptjs";
import { isValidRole } from "../../utils/roleValidator.js";
import { sendResponse } from "../../utils/responseHandler.js"; // Import utilitas baru
import { createToken } from "../../utils/createToken.js";

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
  const { nim, password } = req.body;

  // Validasi input NIM dan password
  if (!nim) {
    return sendResponse(res, 400, "Mohon lengkapi nim");
  }

  if (!password) {
    return sendResponse(res, 400, "Mohon lengkapi password");
  }

  try {
    // Cek apakah pengguna dengan NIM tersebut ada
    const user = await prisma.user.findUnique({
      where: { nim },
    });

    // Jika pengguna tidak ditemukan, kirim respons error
    if (!user) {
      return sendResponse(res, 404, "NIM atau password salah");
    }

    // Verifikasi password yang diinput dengan yang ada di database
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // Jika password tidak valid, kirim respons error
    if (!isPasswordValid) {
      return sendResponse(res, 401, "NIM atau password salah");
    }

    // Buat token JWT untuk autentikasi
    const token = createToken({ nim: user.nim, role: user.role });

    // cek apakah pengguna sudah punya token
    if (user.token ) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isLogin: true },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { token, isLogin: true },
      });
    }

    // AMBIL kembali data user setelah update
    const getUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        nim: true,
        name: true,
        email: true,
        isLogin: true,
        token: true,
        avatar: true,
        role: true,
      },
    })

 

    // Kirim respons sukses dengan data pengguna dan token
    return sendResponse(res, 200, "Login berhasil", getUser);
  } catch (error) {
    handleError(res, error);
  }
};
