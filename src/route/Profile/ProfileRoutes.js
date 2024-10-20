import express from "express";
import {
  handleEditProfile,
  updateAvatar,
} from "../../controller/Profile/EditProfile.js";

export const ProfileRoutes = express.Router();

ProfileRoutes.put("/update/profile/:id", handleEditProfile);
ProfileRoutes.put("/update/avatar/:id", updateAvatar);
