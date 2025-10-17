import express from "express";
import User from "../models/user.model.mjs";


const router = express.Router();

router.post("/send-mobile-otp", async (req, res) => {
  const { mobile } = req.body;
  if (!mobile) {
    return res.status(400).json({ success: false, error: "Phone number is required" });
  }
  const checkExisting = await User.findOne({ mobile });
  if (!checkExisting) {
    return res.status(404).json({ success: false, error: 'Phone number not registered' });
  }
  try {
    const response = await sendOtp(mobile);
    res.json(response);
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ success: false, error: "Failed to send OTP" });
  }
});

router.post("/verify-mobile-otp", async (req, res) => {
  const { mobile, code } = req.body;
  if (!mobile || !code) {
    return res.status(400).json({ success: false, error: "Phone number and code are required" });
  }

  try {
    const response = await verifyOtp(mobile, code);
    res.json(response);
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ success: false, error: "Failed to verify OTP" });
  }
});

export default router;

