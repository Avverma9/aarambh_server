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
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
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
    return res
      .status(400)
      .json({
        message: "OTP not found for this email. Please request a new one.",
      });
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
      return res
        .status(400)
        .json({ message: "No user account found with this email" });
    }

    if (loggedUser.status !== true) {
      return res
        .status(400)
        .json({
          message: "Your account is not active. Please contact support.",
        });
    }

    // Generate Access Token (short-lived)
    const accessToken = jwt.sign(
      { id: loggedUser._id, role: loggedUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" } // Example: 15 minutes
    );

    // Generate Refresh Token (long-lived)
    const refreshToken = jwt.sign(
      { id: loggedUser._id },
      process.env.JWT_REFRESH_SECRET, // Use a different secret for refresh tokens
      { expiresIn: "7d" } // Example: 7 days
    );

    // Save refresh token to the user document in the database
    loggedUser.refreshToken = refreshToken;
    await loggedUser.save();

    // Set refresh token in an HTTP-Only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    return res.status(200).json({
      message: "Logged in successfully",
      accessToken, // Send access token in the response body
      loggedUserRole: loggedUser.role,
      loggedUserStatus: loggedUser.status,
      loggedUserImage: loggedUser.images,
      loggedUserId: loggedUser._id,
      loggedUserName: loggedUser.name,
      loggedUserEmail: loggedUser.email,
    });
  } catch (error) {
    console.error("Error during login after OTP verification:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/refresh-token", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res
      .status(401)
      .json({ message: "Refresh token not found, please login again." });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token." });
    }

    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ accessToken });
  } catch (error) {
    console.error("Error refreshing token:", error);
    return res
      .status(403)
      .json({ message: "Invalid or expired refresh token." });
  }
});

router.post("/logout", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(204).send(); // No content, already logged out
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (user) {
      // Clear the refresh token from the database
      user.refreshToken = null;
      await user.save();
    }
  } catch (error) {
    // Even if the token is invalid, we should clear the cookie
    console.log("Logout with an invalid token, clearing cookie anyway.");
  }

  // Clear the refresh token cookie
  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
  res.status(200).json({ message: "Logged out successfully" });
});

export default router;
