import dotenv from "dotenv";
dotenv.config();

import express from "express";
import crypto from "crypto";
import nodemailer from "nodemailer";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const router = express.Router();

// ── Forgot Password — send reset email ──
router.post("/forgot", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No account with that email." });

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = Date.now() + 1000 * 60 * 30; // 30 minutes

    user.resetToken = token;
    user.resetTokenExpiry = expiry;
    await user.save();

    // Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: `"HealthyBite" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset your HealthyBite password",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;">
          <h2 style="color:#6b8f3f;">Reset your password 🌿</h2>
          <p>Click the button below to reset your password. This link expires in <strong>30 minutes</strong>.</p>
          <a href="${resetLink}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#6b8f3f;color:white;border-radius:8px;text-decoration:none;font-weight:bold;">
            Reset Password
          </a>
          <p style="margin-top:24px;color:#999;font-size:12px;">If you didn't request this, ignore this email.</p>
        </div>
      `,
    });

    res.json({ message: "Reset link sent to your email." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});

// ── Reset Password — save new password ──
router.post("/reset", async (req, res) => {
  const { token, password } = req.body;
  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Token is invalid or expired." });

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ message: "Password reset successfully." });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

export default router;