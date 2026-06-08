import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name:              { type: String },
  email:             { type: String, required: true, unique: true },
  password:          { type: String, required: true },
  avatar:            { type: String, default: "" },
  isAdmin:           { type: Boolean, default: false },
  isVerified:        { type: Boolean, default: false }, 
  verifyToken:       { type: String },                  
  resetToken:        { type: String },
  resetTokenExpiry:  { type: Number },
}, { timestamps: true });

export default mongoose.model("User", userSchema);