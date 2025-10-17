import nodemailer from "nodemailer";
import express from "express";
import dotenv from "dotenv";
dotenv.config();
const router = express();
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
    if (!email) return res.status(400).json({ message: "Email required" });
    const otp = Math.floor(100000 + Math.random() * 900000);
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
    res.status(500).json({ message: "Failed to send OTP", error: error.message });
  }
});

router.post("/verify-otp", (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP required" });
    if (String(otpStore[email]) === String(otp)) {
      delete otpStore[email];
      return res.status(200).json({ message: "OTP verified successfully" });
    }
    res.status(400).json({ message: "Invalid OTP or email" });
  } catch (error) {
    console.error("Error verifying email OTP:", error);
    res.status(500).json({ message: "Failed to verify OTP", error: error.message });
  }
});

export default router;
