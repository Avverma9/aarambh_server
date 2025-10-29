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
  port: 587,
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

    if (String(otpStore[email]) !== String(otp)) {
      return res.status(400).json({ message: "Invalid OTP or email" });
    }

    delete otpStore[email];

    const payload = { userId: user._id, email: user.email };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });

    user.refreshToken = refreshToken;
    await user.save();

    // ✅ Set Access Token in HttpOnly cookie
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true in production (HTTPS)
      sameSite: "strict",
      maxAge: 1 * 60 * 1000, // 15 minutes
    });

    // ✅ Optionally also set refresh token as cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

     return res.status(200).json({ message: "OTP verified successfully", accessToken, refreshToken });
  } catch (error) {
    console.error("Error verifying email OTP:", error);
    res.status(500).json({ message: "Failed to verify OTP", error: error.message });
  }
});


router.post("/refresh-token", async (req, res) => {
  // ✅ Accept refresh token from both body and cookies
  const refreshToken = req.body.token || req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ 
      success: false,
      message: "Refresh token not provided" 
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ 
        success: false,
        message: "Invalid refresh token" 
      });
    }

    const payload = { userId: user._id, email: user.email };
    const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, { 
      expiresIn: "15m" 
    });

    // ✅ Set cookie for web clients
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    // ✅ Also send in response body for mobile clients
    res.json({ 
      success: true,
      message: "New access token issued",
      accessToken: newAccessToken 
    });
  } catch (error) {
    return res.status(403).json({ 
      success: false,
      message: "Invalid or expired refresh token", 
      error: error.message 
    });
  }
});


export default router;
