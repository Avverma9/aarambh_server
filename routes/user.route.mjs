import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  deleteUser,
  addImages,
  setPrimaryImage,
  deleteImage,
  getAllUsers
} from '../controllers/user.controller.mjs';
import { register } from '../controllers/auth.controller.mjs';
import { authMiddleware } from '../auth/auth.middleware.mjs';
import { upload } from '../upload/upload.mjs';

const router = express.Router();


router.post("/register", upload,register)
router.get("/get/all/users",getAllUsers)
router.route('/get-particular-user/:userId',authMiddleware,)
  .get(getUserProfile)
  .put(updateUserProfile)
  .delete(deleteUser);
router.get('/profile/me',authMiddleware,getUserProfile)
router.route('/:userId/images')
  .post(addImages)
  .delete(deleteImage);

router.route('/:userId/primary-image')
  .put(setPrimaryImage);

export default router;

