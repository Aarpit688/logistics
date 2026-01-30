import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["CREDIT", "DEBIT"], required: true }, // CREDIT = Add Money, DEBIT = Booking
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },
    description: { type: String }, // e.g., "Added via PhonePe", "Booking #BKG123"
    transactionId: { type: String }, // PhonePe Trans ID or Internal ID
    providerReferenceId: { type: String }, // PhonePe Merchant ID
  },
  { timestamps: true },
);

export default mongoose.model("Transaction", transactionSchema);
