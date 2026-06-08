import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import passport from "passport";
import authRoutes from "./routes/auth.js";
import googleRoutes from "./routes/google.js";
import resetRoutes from "./routes/resetPassword.js";
import adminRoutes from "./routes/admin.js";
import mealRoutes from "./routes/meals.js";
import profileRoutes from "./routes/profile.js";
import orderRoutes from "./routes/orders.js";
import contactRoute from "./routes/contact.js";

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());
app.use(passport.initialize());

app.use("/api/auth", authRoutes);
app.use("/api/auth/google", googleRoutes);
app.use("/api/auth", resetRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/contact", contactRoute);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected ✅");
    app.listen(process.env.PORT, () =>
      console.log(`Server running on http://localhost:${process.env.PORT} ✅`)
    );
  })
  .catch((err) => console.error("MongoDB connection error:", err));