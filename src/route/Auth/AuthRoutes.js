import express from "express";
import {
  getLogin,
  handleLogin,
  handleLogout,
  handleRegister,
} from "../../controller/Auth/Authentikasi.js";

const AuthRouter = express.Router();
AuthRouter.post("/register", handleRegister);
AuthRouter.post("/login", handleLogin);
AuthRouter.post("/session", getLogin);
AuthRouter.post("/logout", handleLogout);

export default AuthRouter;
