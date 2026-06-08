import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  items:        [{ mealId: String, name: String, price: Number, quantity: Number }],
  totalAmount:  { type: Number, required: true },
  status:       { type: String, enum: ["pending", "confirmed", "delivered", "cancelled"], default: "pending" },
  address:      { type: String },
  phone:        { type: String },
  customerName: { type: String },
  note:         { type: String },
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);