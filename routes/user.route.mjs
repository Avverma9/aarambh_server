import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  deleteUser,
  addImages,
  setPrimaryImage,
  deleteImage,
  getAllUsers,
  likeProfile,
  getMatchedProfiles,
} from "../controllers/user.controller.mjs";
import { register } from "../controllers/auth.controller.mjs";
import { authMiddleware } from "../auth/auth.middleware.mjs";
import { upload } from "../upload/upload.mjs";

const router = express.Router();

router.post("/register", upload, register);

router.get("/get/all/users", getAllUsers);

router
  .route("/get-particular-user/:userId")
  .get(authMiddleware, getUserProfile)
  .put(authMiddleware, updateUserProfile)
  .delete(authMiddleware, deleteUser);

router.get("/profile/me", authMiddleware, getUserProfile);

router.post("/:userId/images", authMiddleware, upload, addImages);

router.delete("/:userId/images", authMiddleware, deleteImage);

router.put("/:userId/primary-image", authMiddleware, upload, setPrimaryImage);

router.post("/:userId/like-profile", authMiddleware, likeProfile);
router.get("/:userId/matched-profile", getMatchedProfiles);


export default router;
