// emailService.mjs
import nodemailer from "nodemailer";
import crypto from "crypto";
import dotenv from "dotenv";
import { format } from "date-fns";
import user from "../models/user.js";

dotenv.config();

// ✅ Gmail transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL,       // e.g. your Gmail address
    pass: process.env.NODEMAILER_PASSWORD,    // app-specific password, not your Gmail login password
  },
});

// ✅ Generate OTP (6-digit)
const generateOtp = () => crypto.randomInt(100000, 999999).toString();

// ✅ Send OTP Email Function
export const sendOtpEmail = async (email, otp) => {
  const matchEmail = await user.findOne({ email: { $regex: new RegExp(email, "i") } });

  if (!matchEmail) {
    throw new Error("Email not registered. Please sign up first.");
  }

  const currentYear = new Date().getFullYear();

  const mailOptions = {
    from: `"HRS (HotelRoomsstay)" <${process.env.NODEMAILER_EMAIL}>`,
    to: email,
    subject: "Your OTP for Email Verification - HotelRoomsstay",
    text: `Your OTP for email verification is: ${otp}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 15px rgba(0,0,0,0.1); padding: 30px; color: #333;">
        <h1 style="text-align: center; color: #1a202c; margin-bottom: 10px; font-weight: 700;">Verify Your Email Address</h1>
        <p style="font-size: 16px; line-height: 1.5; color: #4a5568; margin-bottom: 25px;">Hello,<br><br>To complete your registration, please use the One-Time Password (OTP) below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="display: inline-block; font-size: 40px; font-weight: 700; padding: 15px 40px; border-radius: 10px; background: linear-gradient(90deg, #3182ce, #63b3ed); color: #fff; letter-spacing: 8px; box-shadow: 0 4px 12px rgba(49, 130, 206, 0.5); user-select: none;">
            ${otp}
          </span>
        </div>
        <p style="font-size: 14px; color: #718096; margin-bottom: 40px; text-align: center;">This OTP is valid for 10 minutes.<br>Please do not share it with anyone.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin-bottom: 30px;">
        <p style="font-size: 14px; color: #a0aec0; text-align: center; font-style: italic; margin-bottom: 0;">If you did not request this, please ignore this email.</p>
        <footer style="margin-top: 40px; text-align: center; font-size: 13px; color: #cbd5e0; font-weight: 600; letter-spacing: 1.2px;">
          &copy; ${currentYear} HotelRoomsstay. All rights reserved.
        </footer>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP sent successfully to ${email}`);
  } catch (error) {
    console.error("❌ Error sending OTP email:", error);
    throw new Error("Failed to send OTP email");
  }
};

// ✅ Optional: export OTP generator if needed
export { generateOtp };
