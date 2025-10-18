import express from 'express';
import {
  createUser,
  getUserProfile,
  updateUserProfile,
  deleteUser,
  addImages,
  setPrimaryImage,
  deleteImage
} from '../controllers/user.controller.mjs';
import { register } from '../controllers/auth.controller.mjs';
import { authMiddleware } from '../auth/auth.middleware.mjs';

const router = express.Router();


router.post("/register",register)
router.post("/create-profile",createUser)

router.route('/:userId',authMiddleware,)
  .get(getUserProfile)
  .put(updateUserProfile)
  .delete(deleteUser);

router.route('/:userId/images')
  .post(addImages)
  .delete(deleteImage);

router.route('/:userId/primary-image')
  .put(setPrimaryImage);

export default router;

