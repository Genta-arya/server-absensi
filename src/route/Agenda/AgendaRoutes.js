import express from "express";
import { ambilAgenda, createAgenda, getAgendaByGroup } from "../../controller/Agenda/AgendaController.js";
import  prisma  from "../../config/prisma.js";
import { uploadForm } from "../../controller/Form/FormController.js";
import { uploadMultiple } from "../../config/multer.js";

export const AgendaRoutes = express.Router();

AgendaRoutes.post("/create/agenda", createAgenda);
AgendaRoutes.post("/find/agenda", getAgendaByGroup);
AgendaRoutes.post("/claim/agenda", ambilAgenda);
AgendaRoutes.get("/log", (req, res) =>
    prisma.errorLog.findMany()
      .then((data) => {
        return res.json(data);
      })
);
AgendaRoutes.post("/upload/form", uploadMultiple, uploadForm);
