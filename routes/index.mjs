import authRoute from './auth.route.mjs';
import userRoute from './user.route.mjs';
import express from 'express';
const router = express.Router();

router.use('/auth', authRoute);
router.use('/users', userRoute);

export default router;
