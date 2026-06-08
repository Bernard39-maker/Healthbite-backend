import dotenv from "dotenv";
dotenv.config();
import express from "express";
import Meal from "../models/Meal.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const meals = await Meal.find().sort({ createdAt: -1 });
    res.json(meals);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

export default router;