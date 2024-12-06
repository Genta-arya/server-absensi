import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import prisma from "./prisma.js";

// Buat __dirname secara manual
export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

// Tentukan direktori upload
const uploadDir = path.join(__dirname, "../../public/uploads");
const profileDir = path.join(uploadDir, "profile");
const kegiatanDir = path.join(uploadDir, "kegiatan");

// Cek dan buat folder jika tidak ada
const createDirectoryIfNotExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true }); // Gunakan recursive: true untuk membuat folder jika ada struktur subfolder
  }
};

createDirectoryIfNotExists(uploadDir);
createDirectoryIfNotExists(profileDir);
createDirectoryIfNotExists(kegiatanDir);

// Fungsi untuk mendapatkan nama kegiatan berdasarkan agendaId
const getNamaKegiatan = async (agendaId) => {
  console.log(agendaId);
  const agenda = await prisma.agenda.findUnique({
    where: {
      id: agendaId,
    },
    select: {
      nama: true,
    },
  });
  return agenda ? agenda.nama : "Unknown_Kegiatan"; // Jika tidak ditemukan, default ke 'Unknown_Kegiatan'
};

// Konfigurasi multer
const multerConfig = {
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // Tentukan direktori berdasarkan jenis unggahan
      if (req.fileType === "profile") {
        cb(null, profileDir);
      } else if (req.fileType === "kegiatan") {
        cb(null, kegiatanDir);
      } else {
        cb(new Error("Invalid file type.")); // Error jika file type tidak dikenali
      }
    },
    filename: async (req, file, cb) => {
      
      try {
        const timestamp = Date.now(); // Gunakan timestamp sebagai bagian dari nama file
        const extension = path.extname(file.originalname); // Mendapatkan ekstensi file
        const newFileName = `Kegiatan_${timestamp}${extension}`; // Format nama file

        cb(null, newFileName); // Tentukan nama file
      } catch (error) {
        cb(error); // Tangani error jika gagal mengambil nama kegiatan
      }
    },
  }),
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error("Only .png, .jpg, and .jpeg formats allowed!"));
    }
  },
};

// Inisialisasi Multer
const upload = multer(multerConfig);

// Middleware untuk 1 file (Profile)
const uploadSingle = (req, res, next) => {
  req.fileType = "profile"; // Set file type ke 'profile'
  upload.single("file")(req, res, next);
};

// Middleware untuk banyak file (Kegiatan)
const uploadMultiple = (req, res, next) => {
  req.fileType = "kegiatan"; // Set file type ke 'kegiatan'
  upload.array("files", 5)(req, res, next); // Upload hingga 5 file
};

// Middleware untuk upload beberapa jenis field (misalnya avatar dan dokumen)
const uploadFields = upload.fields([
  { name: "avatar", maxCount: 1 },
  { name: "documents", maxCount: 5 },
]);

export { uploadSingle, uploadMultiple, uploadFields };
