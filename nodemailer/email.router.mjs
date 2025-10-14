import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/user.model.mjs";
import { generateOtp, sendOtpEmail } from "./email.mjs";

dotenv.config();

const router = express.Router();
const otpStore = new Map();
const OTP_EXPIRY_MS = 5 * 60 * 1000;

router.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const otp = generateOtp();
  const expiresAt = Date.now() + OTP_EXPIRY_MS;

  try {
    await sendOtpEmail(email, otp);
    otpStore.set(email, { otp, expiresAt });
    res.status(200).json({ message: "OTP sent successfully" });
  } catch {
    res.status(500).json({ message: "Invalid Email" });
  }
});

router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  const stored = otpStore.get(email);

  if (!stored) {
    return res.status(400).json({ message: "OTP not found for this email. Please request a new one." });
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ message: "OTP has expired" });
  }

  if (stored.otp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  otpStore.delete(email);

  const emailRegex = new RegExp("^" + email + "$", "i");

  try {
    const loggedUser = await User.findOne({ email: emailRegex });

    if (!loggedUser) {
      return res.status(400).json({ message: "No user account found with this email" });
    }

    if (loggedUser.status !== true) {
      return res.status(400).json({ message: "Your account is not active. Please contact support." });
    }

    const token = jwt.sign(
      { id: loggedUser._id, role: loggedUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.status(200).json({
      message: "Logged in successfully",
      loggedUserRole: loggedUser.role,
      loggedUserStatus: loggedUser.status,
      loggedUserImage: loggedUser.images,
      loggedUserId: loggedUser._id,
      loggedUserName: loggedUser.name,
      loggedUserEmail: loggedUser.email,
      token,
    });
  } catch (error) {
    console.error("Error during login after OTP verification:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
