import express from "express";
import { createServer } from "http";
import cors from "cors";
import dotenv from 'dotenv';
dotenv.config();


const app = express();
const PORT = process.env.PORT
const httpServer = createServer(app);
app.use(express.json());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.get('/', (req, res) => {
    res.send('Hello, World!');
  });
  
 
httpServer.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
  });