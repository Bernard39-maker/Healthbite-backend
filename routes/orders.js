import dotenv from "dotenv";
dotenv.config();

import express from "express";
import jwt from "jsonwebtoken";
import Order from "../models/Order.js";

const router = express.Router();

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

// ── Place order ──
router.post("/", protect, async (req, res) => {
  try {
    const { items, totalAmount, address, phone, customerName, note } = req.body;
    if (!items?.length) return res.status(400).json({ message: "No items in order." });

    const order = await Order.create({
      userId: req.userId,
      items,
      totalAmount,
      address,
      phone,
      customerName,
      note,
      status: "pending",
    });

    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});

// ── Get user's orders ──
router.get("/my-orders", protect, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId }).sort({ createdAt: -1 }); 
    const resObj = orders.map(o => ({
      id: o._id,
      items: o.items,
      totalAmount: o.totalAmount,
      address: o.address,
      phone: o.phone,
      customerName: o.customerName,
      note: o.note,
      status: o.status,
      createdAt: o.createdAt,
    }));

    res.json(resObj);
  } catch {
    res.status(500).json({ message: "Server error." });
  }
});

export default router;