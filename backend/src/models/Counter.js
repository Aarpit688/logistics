import mongoose from "mongoose";

// models/Counter.js
const CounterSchema = new mongoose.Schema({
  key: { type: String, unique: true }, // CC or CB
  value: { type: Number, default: 0 },
});

export default mongoose.model("Counter", CounterSchema);
