import dotenv from "dotenv";
dotenv.config();
import express from "express";
import jwt from "jsonwebtoken";

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

// ── Verify Paystack payment ──
router.post("/verify", protect, async (req, res) => {
  const { reference } = req.body;
  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });
    const data = await response.json();

    router.post("/verify", protect, async (req, res) => {
  const { reference } = req.body;
  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });
    const data = await response.json();
    console.log("Paystack verify response:", JSON.stringify(data, null, 2)); // ← add this

    if (data.data?.status === "successful") {
      res.json({ verified: true, amount: data.data.amount / 100 });
    } else {
      res.status(400).json({ verified: false, message: "Payment not successful." });
    }
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

    if (data.data?.status === "success") {
      res.json({ verified: true, amount: data.data.amount / 100 });
    } else {
      res.status(400).json({ verified: false, message: "Payment not successful." });
    }
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

export default router;