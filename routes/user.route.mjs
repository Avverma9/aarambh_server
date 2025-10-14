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

const router = express.Router();

router.route('/register')
  .post(createUser);

router.route('/:userId')
  .get(getUserProfile)
  .put(updateUserProfile)
  .delete(deleteUser);

router.route('/:userId/images')
  .post(addImages)
  .delete(deleteImage);

router.route('/:userId/primary-image')
  .put(setPrimaryImage);

export default router;

