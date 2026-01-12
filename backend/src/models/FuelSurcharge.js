import mongoose from "mongoose";

const PeriodSchema = new mongoose.Schema(
  {
    fuelPercent: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { _id: false }
);

const FuelSurchargeSchema = new mongoose.Schema(
  {
    vendor: { type: String, required: true, unique: true },

    previous: PeriodSchema,
    current: PeriodSchema,
    upcoming: PeriodSchema,
  },
  { timestamps: true }
);

export default mongoose.model("FuelSurcharge", FuelSurchargeSchema);
