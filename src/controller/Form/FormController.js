import prisma from "../../config/prisma.js";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../../public/uploads");
const kegiatanDir = path.join(uploadDir, "kegiatan");


const unlinkImage = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("Error deleting file:", err);
    }
  });
}


export const uploadForm = async (req, res) => {
  try {
    // Pastikan 'forms' diterima sebagai string JSON
    const { forms } = req.body;

    // Jika forms tidak ada, kirimkan pesan kesalahan
    if (!forms) {
      return res
        .status(400)
        .send({ message: "'forms' tidak ditemukan dalam request body" });
    }

    // Parsing 'forms' yang berupa string JSON
    const parsedForms = JSON.parse(forms);

    // Validasi apakah ada data form yang valid
    if (!parsedForms || parsedForms.length === 0) {
      return res
        .status(400)
        .send({ message: "Tidak ada data form yang valid" });
    }

    // Memastikan bahwa file diterima melalui 'files' di FormData
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).send({ message: "Tidak ada file yang diunggah" });
    }

    // Melakukan upload dan kompresi file dengan sharp
    let baseUrl =
      process.env.MODE === "pro"
        ? "https://dev-absensi.hkks.shop/public/uploads/kegiatan/"
        : "http://localhost:3008/public/uploads/kegiatan/";

    const compressAndConvertToBase64 = async (filePath) => {
      try {
        const compressedImageBuffer = await sharp(filePath)
          .resize(800)
          .jpeg({ quality: 70 })
          .toBuffer();

        const base64String = compressedImageBuffer.toString("base64");
        return `data:image/jpeg;base64,${base64String}`;
      } catch (error) {
        console.error("Error during image compression and conversion:", error);
        throw error;
      }
    };

    const base64Files = await Promise.all(
      files.slice(0, 2).map(async (file) => {
        return await compressAndConvertToBase64(file.path);
      })
    );

    const imageUrls = files.map((file) => `${baseUrl}${file.filename}`);

    // Loop untuk menyimpan setiap form
    for (let form of parsedForms) {
      const savedData = {
        agenda: { connect: { id: form.agendaId } },
        kegiatanId: form.kegiatanId,
        gps: form.gps,
        detail: form.detail,
        tanggal: new Date(),
        status: true,
        mahasiswa: { connect: { id: form.userId } },
        gambar1_b64: base64Files[0],
        gambar2_b64: base64Files[1],
        gambar1: imageUrls[0],
        gambar2: imageUrls[1],
      };

      const agenda = await prisma.formAgenda.findMany({
        where: { agenda: { id: form.agendaId, status: true } },
      });

      if (agenda.length === 0) {
        await prisma.formAgenda.create({ data: savedData });
      } 

      await prisma.agenda.updateMany({
        where: { id: form.agendaId },
        data: { status: true },
      });
    }

    res.status(200).json({
      message: "Form berhasil diunggah.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Terjadi kesalahan server." });
  }
};
