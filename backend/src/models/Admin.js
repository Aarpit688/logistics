import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    passwordHash: String,
    role: { type: String, default: "admin" },
  },
  { timestamps: true }
);

export default mongoose.model("Admin", adminSchema);
