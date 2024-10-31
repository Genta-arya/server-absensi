import express from "express";
import { ambilAgenda, createAgenda, getAgendaByGroup } from "../../controller/Agenda/AgendaController.js";

export const AgendaRoutes = express.Router();

AgendaRoutes.post("/create/agenda", createAgenda);
AgendaRoutes.post("/find/agenda", getAgendaByGroup);
AgendaRoutes.post("/claim/agenda", ambilAgenda);
