import express from "express";
import { createServer } from "http";
import cors from "cors";
import dotenv from "dotenv";
import path from 'path';
import AuthRouter from "./src/route/Auth/AuthRoutes.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT;
const httpServer = createServer(app);
app.use(express.json());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.get("/doc", (req, res) => {
  res.sendFile(path.resolve("src/dokumentasi/index.html")); 
});
app.get("/doc/register", (req, res) => {
    res.sendFile(path.resolve("src/dokumentasi/Authentikasi/Register/Register.html")); 
  });

app.use("/api/v1", AuthRouter);
httpServer.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
