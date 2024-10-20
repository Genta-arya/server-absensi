import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Buat __dirname secara manual
export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

// Tentukan direktori upload
const uploadDir = path.join(__dirname, '../../public/uploads');
const profileDir = path.join(uploadDir, 'profile');
const kegiatanDir = path.join(uploadDir, 'kegiatan');

// Cek dan buat folder jika tidak ada
const createDirectoryIfNotExists = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true }); // Gunakan recursive: true untuk membuat folder jika ada struktur subfolder
    }
};

createDirectoryIfNotExists(uploadDir);
createDirectoryIfNotExists(profileDir);
createDirectoryIfNotExists(kegiatanDir);

// Konfigurasi multer
const multerConfig = {
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            // Tentukan direktori berdasarkan jenis unggahan
            if (req.fileType === 'profile') {
                cb(null, profileDir);
            } else if (req.fileType === 'kegiatan') {
                cb(null, kegiatanDir);
            } else {
                cb(new Error('Invalid file type.'));
            }
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + '-' + file.originalname);
        }
    }),
    fileFilter: (req, file, cb) => {
        if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
            cb(null, true);
        } else {
            cb(null, false);
            return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
        }
    }
};

// Inisialisasi Multer
const upload = multer(multerConfig);

// Middleware untuk 1 file (Profile)
const uploadSingle = (req, res, next) => {
    req.fileType = 'profile'; // Set file type ke 'profile'
    upload.single('file')(req, res, next);
};

// Middleware untuk banyak file (Kegiatan)
const uploadMultiple = (req, res, next) => {
    req.fileType = 'kegiatan'; // Set file type ke 'kegiatan'
    upload.array('files', 5)(req, res, next);
};

// Middleware untuk upload beberapa jenis field (misalnya avatar dan dokumen)
const uploadFields = upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'documents', maxCount: 5 }
]);

export { uploadSingle, uploadMultiple, uploadFields };
