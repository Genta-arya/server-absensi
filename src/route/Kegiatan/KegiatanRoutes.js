import express from "express";
import { addMahasiswaToKegiatan, CreateKegiatan } from "../../controller/Kegiatan/CreateKegiatan.js";
import { getKegiatan } from "../../controller/Kegiatan/GetKegiatan.js";

export const KegiatanRoutes = express.Router();

KegiatanRoutes.post("/create/kegiatan", CreateKegiatan);
KegiatanRoutes.post("/find/kegiatan", getKegiatan);
KegiatanRoutes.post("/add/user", addMahasiswaToKegiatan);