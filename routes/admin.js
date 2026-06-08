import dotenv from "dotenv";
dotenv.config();

import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Meal from "../models/Meal.js";
import Order from "../models/Order.js";

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

// ── Admin middleware ──
const adminOnly = async (req, res, next) => {
  const user = await User.findById(req.userId);
  if (!user || !user.isAdmin) return res.status(403).json({ message: "Access denied." });
  next();
};

// ── Stats overview ──
router.get("/stats", protect, adminOnly, async (req, res) => {
  try {
    const totalUsers   = await User.countDocuments();
    const totalMeals   = await Meal.countDocuments();
    const totalOrders  = await Order.countDocuments();
    const revenue      = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    // Orders by day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const ordersByDay = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 }, revenue: { $sum: "$totalAmount" } } },
      { $sort: { _id: 1 } },
    ]);

    // Top meals
    const topMeals = await Order.aggregate([
      { $unwind: "$items" },
      { $group: { _id: "$items.mealId", name: { $first: "$items.name" }, count: { $sum: "$items.quantity" } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      totalUsers,
      totalMeals,
      totalOrders,
      totalRevenue: revenue[0]?.total || 0,
      ordersByDay,
      topMeals,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ── Users ──
router.get("/users", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({}, "-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

router.delete("/users/:id", protect, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

router.patch("/users/:id/toggle-admin", protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    user.isAdmin = !user.isAdmin;
    await user.save();
    res.json({ message: "Updated.", isAdmin: user.isAdmin });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ── Meals ──
router.get("/meals", protect, adminOnly, async (req, res) => {
  try {
    const meals = await Meal.find().sort({ createdAt: -1 });
    res.json(meals);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

router.post("/meals", protect, adminOnly, async (req, res) => {
  try {
    const meal = await Meal.create(req.body);
    res.status(201).json(meal);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

router.put("/meals/:id", protect, adminOnly, async (req, res) => {
  try {
    const meal = await Meal.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(meal);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

router.delete("/meals/:id", protect, adminOnly, async (req, res) => {
  try {
    await Meal.findByIdAndDelete(req.params.id);
    res.json({ message: "Meal deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ── Orders ──
router.get("/orders", protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find().populate("userId", "name email").sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

router.patch("/orders/:id/status", protect, adminOnly, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

export default router;