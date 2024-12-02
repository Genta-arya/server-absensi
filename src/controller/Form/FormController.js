import { uploadMultiple } from "../../config/multer.js";
import prisma from "../../config/prisma.js";
import { handleError } from "../../utils/errorHandler.js";
import fs from "fs";
import sharp from "sharp";

// Fungsi untuk delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const uploadForm = async (req, res) => {
  try {
    // Middleware Multer untuk menangani banyak file
    uploadMultiple(req, res, async (err) => {
      if (err) {
        return res.status(400).send({ message: err.message });
      }

      // Ambil data dari request body dan file
      const { agendaId, kegiatanId, gps, detail, userId } = req.body;
      const files = req.files.map((file) => file.path); // Path ke file gambar yang diunggah

      let baseUrl = ``;
      if (process.env.MODE === "pro") {
        baseUrl = `https://dev-absensi.hkks.shop/public/uploads/kegiatan/`;
      } else {
        baseUrl = `http://localhost:3008/public/uploads/kegiatan/`;
      }

      // Fungsi untuk mengonversi gambar ke base64 setelah kompresi
      const compressAndConvertToBase64 = async (filePath) => {
        try {
          // Kompres gambar menggunakan sharp
          const compressedImageBuffer = await sharp(filePath)
            .resize(800) // Ukuran maksimal (ubah sesuai kebutuhan)
            .jpeg({ quality: 70 }) // Kompresi kualitas gambar (ubah sesuai kebutuhan)
            .toBuffer(); // Menghasilkan buffer gambar

          // Konversi gambar terkompresi ke base64
          const base64String = compressedImageBuffer.toString("base64");
          const mimeType = "jpeg"; // Tipe mime jika menggunakan kompresi JPEG
          return `data:image/${mimeType};base64,${base64String}`;
        } catch (error) {
          console.error("Error during image compression and conversion:", error);
          throw error;
        }
      };

      // Ambil Base64 dan jenis gambar untuk file pertama dan kedua (gambar1 dan gambar2)
      const base64Files = await Promise.all(
        req.files.slice(0, 2).map(async (file) => {
          return await compressAndConvertToBase64(file.path);
        })
      );

      // Membuat URL untuk file gambar yang diunggah
      const imageUrls = req.files.map((file) => `${baseUrl}${file.filename}`);

      // Persiapkan data untuk disimpan di database
      const savedData = {
        agenda: { connect: { id: agendaId } }, // Menghubungkan dengan relasi 'agenda' menggunakan id
        kegiatanId: kegiatanId,
        gps,
        detail,
        tanggal: new Date(),
        status: true,
        mahasiswa: { connect: { id: userId } },
        gambar1_b64: base64Files[0], // Base64 gambar pertama
        gambar2_b64: base64Files[1], // Base64 gambar kedua
        gambar1: imageUrls[0],
        gambar2: imageUrls[1],
      };

      // Cek apakah form dengan agendaId sudah ada
      const agenda = await prisma.formAgenda.findFirst({
        where: { agendaId: agendaId },
      });

      if (agenda) {
        // Jika sudah ada, hapus file yang diupload
        if (req.files) {
          req.files.forEach((file) => {
            try {
              if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path); // Hapus file jika ada
              }
            } catch (unlinkError) {
              console.error(`Failed to delete file: ${file.path}`, unlinkError);
            }
          });
        }
        return res.status(400).send({ message: "Form telah disubmit" });
      } else {
        // Simpan data ke database
        await prisma.formAgenda.create({ data: savedData });
      }

      // Update status agenda
      await prisma.agenda.update({
        where: {
          id: agendaId,
        },
        data: {
          status: true,
        },
      });

      // Kirimkan respons
      res.status(200).json({
        message: "Form berhasil diunggah.",
        data: savedData,
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Terjadi kesalahan server." });
    // Hapus file jika ada error
    if (req.files) {
      req.files.forEach((file) => {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path); // Hapus file jika ada
          }
        } catch (unlinkError) {
          console.error(`Failed to delete file: ${file.path}`, unlinkError);
        }
      });
    }
  }
};
