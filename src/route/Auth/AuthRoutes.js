import express from "express";
import {
  getAlluser,
  getLogin,
  handleLogin,
  handleLogout,
  handleRegister,
} from "../../controller/Auth/Authentikasi.js";

const AuthRouter = express.Router();
AuthRouter.post("/register", handleRegister);
AuthRouter.post("/login", handleLogin);
AuthRouter.get("/user", getAlluser);
AuthRouter.post("/session", getLogin);
AuthRouter.post("/logout", handleLogout);

export default AuthRouter;
