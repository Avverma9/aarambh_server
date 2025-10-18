import nodemailer from "nodemailer";
import express from "express";
import dotenv from "dotenv";
import User from "../models/user.model.mjs";
import jwt from "jsonwebtoken";

dotenv.config();
const router = express.Router(); // ✅ use Router, not express()

const otpStore = {};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD,
  },
});

router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    // ✅ Use findOne instead of find
    const findUser = await User.findOne({ email: email });
    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(1000 + Math.random() * 9000);
    otpStore[email] = otp;

    await transporter.sendMail({
      from: `Arambh Matrimony <${process.env.NODEMAILER_EMAIL}>`,
      to: email,
      subject: "OTP Verification",
      text: `Your OTP is: ${otp}`,
    });

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending email OTP:", error);
    res
      .status(500)
      .json({ message: "Failed to send OTP", error: error.message });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Check OTP validity
    if (String(otpStore[email]) !== String(otp)) {
      return res.status(400).json({ message: "Invalid OTP or email" });
    }

    // OTP valid, delete it
    delete otpStore[email];
    // Create JWT payload
    const payload = { userId: user._id, email: user.email };

    // Generate Access Token (expires in 15 minutes)
    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "1m" }
    );

    // Generate Refresh Token (expires in 7 days)
    const refreshToken = jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Save refresh token to the user in the database
    user.refreshToken = refreshToken;
    await user.save();

    // Send tokens in response
    return res.status(200).json({ message: "OTP verified successfully", accessToken, refreshToken });

  } catch (error) {
    console.error("Error verifying email OTP:", error);
    res.status(500).json({ message: "Failed to verify OTP", error: error.message });
  }
});

router.post("/refresh-token", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(401).json({ message: "Refresh token not provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const payload = { userId: user._id, email: user.email };
    const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired refresh token", error: error.message });
  }
});

export default router;
