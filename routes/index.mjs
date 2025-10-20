import authRoute from "./auth.route.mjs";
import userRoute from "./user.route.mjs";
import emailRoute from "../nodemailer/email.mjs";
import casteRoute from "./caste.route.mjs";
import express from "express";
const router = express.Router();

router.use("/mobile/auth", authRoute);
router.use("/email/auth", emailRoute);
router.use("/users", userRoute);
router.use("/caste", casteRoute);

export default router;
