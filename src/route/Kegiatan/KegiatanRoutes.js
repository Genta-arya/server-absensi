import express from "express";
import { addMahasiswaGroup, createGroupKegiatan, CreateKegiatan } from "../../controller/Kegiatan/CreateKegiatan.js";
import { getGrups, getKegiatan, } from "../../controller/Kegiatan/GetKegiatan.js";

export const KegiatanRoutes = express.Router();

KegiatanRoutes.post("/create/kegiatan", CreateKegiatan);
KegiatanRoutes.post("/find/kegiatan", getKegiatan);
KegiatanRoutes.post("/add/user", addMahasiswaGroup);
KegiatanRoutes.post("/add/group", createGroupKegiatan);
KegiatanRoutes.get("/find/group/:id",getGrups)