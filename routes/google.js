import dotenv from "dotenv";
dotenv.config();
import express from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// ── Setup Google Strategy ──
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:5000/api/auth/google/callback",
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists
    let user = await User.findOne({ email: profile.emails[0].value });

    if (!user) {
      // Create new user from Google profile
      user = await User.create({
        name: profile.displayName,
        email: profile.emails[0].value,
        password: "google-oauth", 
      });
    }

    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));

// ── Start Google login ──
router.get("/", passport.authenticate("google", {
  scope: ["profile", "email"],
  session: false,
}));

// ── Google callback ──
router.get("/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${process.env.CLIENT_URL}/auth?error=google` }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    // Redirect to frontend with token
    res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}`);
  }
);

export default router;