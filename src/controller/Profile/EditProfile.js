import { uploadSingle } from "../../config/multer.js";
import prisma from "../../config/prisma.js";
import { handleError } from "../../utils/errorHandler.js";
import { sendResponse } from "../../utils/responseHandler.js";
import fs from "fs";
import path from "path";

export const handleEditProfile = async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  // validate
  if (!id) {
    return sendResponse(res, 400, "Mohon lengkapi id");
  }

  if (!name) {
    return sendResponse(res, 400, "Mohon lengkapi name");
  }

  if (!email) {
    return sendResponse(res, 400, "Mohon lengkapi email");
  }
  // find user jika ada
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    return sendResponse(res, 404, "User not found");
  }

  //   find email uniq jika bukan user itu
  const emailUniq = await prisma.user.findUnique({
    where: { email, NOT: { id } },
  });

  if (emailUniq) {
    return sendResponse(res, 400, "Email sudah terdaftar");
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
    });

    return sendResponse(res, 200, "Profile updated", updatedUser);
  } catch (error) {
    handleError(res, error);
  }
};

export const updateAvatar = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).send({ message: "Mohon lengkapi id" });
  }

  // Middleware Multer untuk menangani upload
  uploadSingle(req, res, async (err) => {
    if (err) {
      return res.status(400).send({ message: err.message });
    }

    // Jika tidak ada file yang diupload
    if (!req.file) {
      return res.status(400).send({ message: "Tidak ada file yang diupload" });
    }

    // Buat URL lengkap untuk avatar baru
    let newAvatarUrl = ``;
    if (process.env.MODE === "pro") {
      newAvatarUrl = `https://dev-absensi.hkks.shop/public/uploads/profile/${req.file.filename}`;
    } else {
      newAvatarUrl = `http://localhost:3000/public/uploads/profile/${req.file.filename}`;
    }

    try {
      // Ambil data pengguna berdasarkan ID dari database menggunakan Prisma
      const user = await prisma.user.findUnique({
        where: { id: id }, // Pastikan ID adalah integer
      });

      if (!user) {
        return res.status(404).send({ message: "User not found." });
      }

      if (user.avatar) {
        const oldAvatarPath = path.join(
          process.cwd(), // menggunakan process.cwd() untuk mendapatkan direktori kerja saat ini
          "public/uploads/profile",
          path.basename(user.avatar)
        );

        console.log("Path untuk avatar lama:", oldAvatarPath); // Debugging: pastikan path ini benar

        // Cek apakah file lama ada dan hapus
        try {
          if (fs.existsSync(oldAvatarPath)) {
            console.log("File ditemukan, menghapus file.");
            fs.unlinkSync(oldAvatarPath);
            console.log("File lama berhasil dihapus.");
          } else {
            console.log(
              "File tidak ditemukan, tidak bisa dihapus:",
              oldAvatarPath
            );
          }
        } catch (error) {
          console.error("Error saat menghapus file:", error);
        }
      }

      // Update URL avatar baru ke database menggunakan Prisma
      const updatedUser = await prisma.user.update({
        where: { id: id },
        data: { avatar: newAvatarUrl },
      });

      res.status(200).send({
        message: "Avatar updated successfully.",
        avatar: updatedUser.avatar,
      });
    } catch (error) {
      // Hapus file yang diupload jika terjadi kesalahan
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).send({
        message: "An error occurred while updating avatar.",
        error: error.message,
      });
    }
  });
};
