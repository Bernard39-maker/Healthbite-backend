import dotenv from "dotenv";
dotenv.config();

import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import User from "../models/User.js";

const router = express.Router();

// ── Sign Up ──
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already in use." });

    const hashed = await bcrypt.hash(password, 10);
    const verifyToken = crypto.randomBytes(32).toString("hex");

    await User.create({ name, email, password: hashed, verifyToken, isVerified: false });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const verifyLink = `${process.env.CLIENT_URL}/verify-email?token=${verifyToken}`;

    await transporter.sendMail({
      from: `"HealthyBite" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your HealthyBite account",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;">
          <h2 style="color:#6b8f3f;">Welcome to HealthyBite 🌿</h2>
          <p>Hi ${name}, thanks for signing up! Click the button below to verify your email address.</p>
          <a href="${verifyLink}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#6b8f3f;color:white;border-radius:8px;text-decoration:none;font-weight:bold;">
            Verify Email
          </a>
          <p style="margin-top:24px;color:#999;font-size:12px;">If you didn't create an account, ignore this email.</p>
        </div>
      `,
    });

    res.status(201).json({ message: "Account created! Please check your email to verify your account." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});

// ── Verify Email ──
router.get("/verify-email", async (req, res) => {
  const { token } = req.query;
  try {
    const user = await User.findOne({ verifyToken: token });
    if (!user) return res.status(400).json({ message: "Invalid or expired verification link." });

    user.isVerified = true;
    user.verifyToken = undefined;
    await user.save();

    res.redirect(`${process.env.CLIENT_URL}/auth?verified=true`);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ── Sign In ──
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password." });

  
    if (!user.isVerified) {
      return res.status(401).json({ message: "Please verify your email before logging in. Check your inbox." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid email or password." });

    const token = jwt.sign({ id: user._id, name: user.name, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

export default router;