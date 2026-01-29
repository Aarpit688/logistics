import mongoose from "mongoose";

const CountryZoneSchema = new mongoose.Schema(
  {
    country: { type: String, required: true, unique: true, trim: true },

    zones: {
      fedex: { type: String, default: null },
      tnt: { type: String, default: null },
      aramexUps: { type: String, default: null },
      aramex: { type: String, default: null },
      dhl: { type: String, default: null },
      self: { type: String, default: null },
    },
  },
  { timestamps: true },
);

export default mongoose.model("CountryZone", CountryZoneSchema);
