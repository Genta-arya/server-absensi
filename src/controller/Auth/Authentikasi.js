import prisma from "../../config/prisma.js";
import { handleError } from "../../utils/errorHandler.js";
import bcrypt from "bcryptjs";
import { isValidRole } from "../../utils/roleValidator.js";
import { sendResponse } from "../../utils/responseHandler.js"; // Import utilitas baru
import { createToken } from "../../utils/createToken.js";
import jwt from "jsonwebtoken";
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
      "Role tidak valid. Pilih antara MHS atau DOSEN."
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
      "Role tidak valid. Pilih antara MHS atau DOSEN."
    );
  }

  try {
    // Enkripsi password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 adalah jumlah salt rounds

    // Buat pengguna baru
    await prisma.user.create({
      data: {
        nim,
        password: hashedPassword, // Simpan password yang telah dienkripsi
        role,
        avatar: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
      },
    });

    // Kirim respons sukses dengan data pengguna baru
    return sendResponse(res, 201, "Pendaftaran berhasil");
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
    if (user.token) {
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
    });

    // Kirim respons sukses dengan data pengguna dan token
    return sendResponse(res, 200, "Login berhasil", getUser);
  } catch (error) {
    handleError(res, error);
  }
};
export const getLogin = async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return sendResponse(res, 400, "Mohon lengkapi token");
  }

  // Fungsi untuk memeriksa apakah token sudah kedaluwarsa
  const isTokenExpired = (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_KEY);
      const currentTime = Date.now() / 1000;
      return decoded.exp <= currentTime; // Jika expired, return true
    } catch (error) {
      return true; // Anggap token tidak valid jika ada error saat verifikasi
    }
  };

  // Periksa apakah token kedaluwarsa
  if (isTokenExpired(token)) {
    try {
      // Cek apakah token ada di database
      const user = await prisma.user.findFirst({
        where: { token },
      });

      // Jika tidak ditemukan, kirimkan respons 401 dengan pesan token tidak valid
      if (!user) {
        return sendResponse(res, 401, "Token tidak valid");
      }

      // Jika token kedaluwarsa, set token di database menjadi null
      await prisma.user.updateMany({
        where: { token },
        data: { token: null, isLogin: false },
      });

      return sendResponse(res, 401, "Token expired. Silakan login kembali.");
    } catch (error) {
      return handleError(res, error);
    }
  }

  try {
    // Cek apakah token ada di database
    const user = await prisma.user.findFirst({
      where: { token },
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
    });

    if (!user) {
      return sendResponse(res, 401, "Token tidak valid");
    }

    // Jika token masih valid, kembalikan data pengguna
    return sendResponse(res, 200, "succes", user);
  } catch (error) {
    handleError(res, error);
  }
};

export const handleLogout = async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return sendResponse(res, 400, "Mohon lengkapi id");
  }

  // check apakah id ada di database
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    return sendResponse(res, 404, "User not found");
  }

  try {
    await prisma.user.updateMany({
      where: { id },
      data: { token: null, isLogin: false },
    });

    return sendResponse(res, 200, "Berhasil logout");
  } catch (error) {
    handleError(res, error);
  }
};

export const getAlluser = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: "MHS" },
      select: {
        id: true,
        nim: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        kegiatan: true,
      },
    });
    return sendResponse(res, 200, "succes", users);
  } catch (error) {
    handleError(res, error);
  }
};
