import express from "express";
import { createAgenda, getAgendaByGroup } from "../../controller/Agenda/AgendaController.js";


export const AgendaRoutes = express.Router();

AgendaRoutes.post("/create/agenda", createAgenda);
AgendaRoutes.post("/find/agenda", getAgendaByGroup);


