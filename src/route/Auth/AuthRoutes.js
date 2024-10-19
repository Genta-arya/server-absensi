import express from "express";
import { handleRegister } from "../../controller/Auth/Authentikasi.js";

const AuthRouter = express.Router();
AuthRouter.post("/register" , handleRegister)

export default AuthRouter