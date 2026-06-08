import mongoose from "mongoose";

const mealSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  content:  { type: String, required: true },
  price:    { type: Number, required: true },
  img:      { type: String, required: true },
  category: { type: String, default: "popular" },
}, { timestamps: true });

export default mongoose.model("Meal", mealSchema);