import express from "express";
import { handleLogin, handleRegister } from "../../controller/Auth/Authentikasi.js";

const AuthRouter = express.Router();
AuthRouter.post("/register" , handleRegister)
AuthRouter.post("/login" , handleLogin)

export default AuthRouter