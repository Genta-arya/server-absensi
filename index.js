import express from "express";
import { createServer } from "http";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import AuthRouter from "./src/route/Auth/AuthRoutes.js";
import { ProfileRoutes } from "./src/route/Profile/ProfileRoutes.js";
import { KegiatanRoutes } from "./src/route/Kegiatan/KegiatanRoutes.js";
import { AgendaRoutes } from "./src/route/Agenda/AgendaRoutes.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT;
const httpServer = createServer(app);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Dokumentasi
app.get("/doc", (req, res) => {
  res.sendFile(path.resolve("src/dokumentasi/index.html"));
});
app.get("/doc/register", (req, res) => {
  res.sendFile(
    path.resolve("src/dokumentasi/Authentikasi/Register/Register.html")
  );
});
app.get("/doc/login", (req, res) => {
  res.sendFile(path.resolve("src/dokumentasi/Authentikasi/Login/Login.html"));
});
app.get("/doc/session", (req, res) => {
  res.sendFile(path.resolve("src/dokumentasi/Authentikasi/Session/Sesi.html"));
});
app.get("/doc/logout", (req, res) => {
  res.sendFile(path.resolve("src/dokumentasi/Authentikasi/Logout/Logout.html"));
});
app.get("/doc/profile/avatar", (req, res) => {
  res.sendFile(path.resolve("src/dokumentasi/Profile/Avatar.html"));
});
app.get("/doc/profile/update", (req, res) => {
  res.sendFile(path.resolve("src/dokumentasi/Profile/Profile.html"));
});

// midleware image
app.use(
  "/public/uploads",
  express.static(path.join(process.cwd(), "public/uploads"))
);

// Authentikasi
app.use("/api/v1", AuthRouter);

// Profile
app.use("/api/v1", ProfileRoutes);

// Kegiatan
app.use("/api/v1", KegiatanRoutes);

// Agenda
app.use("/api/v1", AgendaRoutes);

httpServer.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
