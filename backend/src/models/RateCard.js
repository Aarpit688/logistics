import mongoose from "mongoose";

const RateCardSchema = new mongoose.Schema(
  {
    carrier: { type: String, required: true, trim: true }, // DHL, FedEx...
    shipmentType: { type: String, required: true, trim: true }, // Document / NonDoc / Parcel
    zone: { type: String, required: true, trim: true }, // AFR1, Zone A, 1
    weight: { type: Number, required: true }, // 0.5, 1, 1.5
    rate: { type: Number, required: true },
  },
  { timestamps: true }
);

// ✅ Unique
RateCardSchema.index(
  { carrier: 1, shipmentType: 1, zone: 1, weight: 1 },
  { unique: true }
);

export default mongoose.model("RateCard", RateCardSchema);
