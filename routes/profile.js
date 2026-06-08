import dotenv from "dotenv";
dotenv.config();

import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const router = express.Router();

// ── Auth middleware ──
const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token." });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token." });
  }
};

// ── Get profile ──
router.get("/", protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId, "-password -resetToken -resetTokenExpiry");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json(user);
  } catch {
    res.status(500).json({ message: "Server error." });
  }
});

// ── Update profile (name, email, avatar) ──
router.put("/", protect, async (req, res) => {
  try {
    const { name, email, avatar } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    // Check email not taken by another user
    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ message: "Email already in use." });
    }

    if (name)   user.name   = name;
    if (email)  user.email  = email;
    if (avatar) user.avatar = avatar;

    await user.save();
    const updated = await User.findById(req.userId, "-password -resetToken -resetTokenExpiry");
    res.json(updated);
  } catch {
    res.status(500).json({ message: "Server error." });
  }
});

// ── Change password ──
router.put("/change-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ message: "Current password is incorrect." });

    if (newPassword.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters." });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password updated successfully." });
  } catch {
    res.status(500).json({ message: "Server error." });
  }
});

export default router;