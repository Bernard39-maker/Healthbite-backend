import dotenv from "dotenv";
dotenv.config();

import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
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

    const user = await User.create({
      name, email,
      password: hashed,
      isVerified: true,
    });

    // Welcome email (optional — won't block signup if it fails)
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });

      await transporter.sendMail({
        from: `"HealthyBite" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Welcome to HealthyBite 🌿",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;">
            <h2 style="color:#6b8f3f;">Welcome to HealthyBite 🌿</h2>
            <p>Hi ${name}, your account has been created successfully!</p>
            <p>Start ordering delicious healthy meals today.</p>
            <a href="${process.env.CLIENT_URL}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#6b8f3f;color:white;border-radius:8px;text-decoration:none;font-weight:bold;">
              Start Ordering
            </a>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Welcome email failed:", emailErr.message);
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});

// ── Sign In ──
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password." });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid email or password." });

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

export default router;