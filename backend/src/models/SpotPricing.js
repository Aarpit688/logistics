import mongoose from "mongoose";

const BoxRowSchema = new mongoose.Schema(
  {
    qty: { type: Number, required: true },
    weight: { type: Number, required: true },
    length: { type: Number, required: true },
    breadth: { type: Number, required: true },
    height: { type: Number, required: true },
  },
  { _id: false },
);

const SpotPricingSchema = new mongoose.Schema(
  {
    // ✅ generate enquiryId like SKRTxxxx (optional but recommended)
    enquiryId: { type: String, unique: true },

    // ✅ customer/user info (optional)
    user: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
      phone: { type: String, trim: true },
    },

    // ✅ serviceability (user enters)
    serviceability: {
      tab: { type: String, required: true }, // export/import

      origin: {
        country: { type: String, required: true },
        pincode: { type: String, required: true },
        city: { type: String, required: true },
        code: { type: String, required: true },
      },

      destination: {
        country: { type: String, required: true },
        pincode: { type: String, required: true },
        city: { type: String, required: true },
        code: { type: String, required: true },
      },
    },

    // ✅ shipment details (user enters till quotedBy)
    shipmentDetails: {
      shipmentType: { type: String, required: true }, // Cargo Commercial etc
      vendor: { type: String, required: true }, // UPS / DHL etc
      quotedBy: { type: String, required: true }, // user input
      commodityType: { type: String, required: true },

      boxesCount: { type: Number, required: true },
      totalWeight: { type: Number, required: true },

      boxRows: { type: [BoxRowSchema], required: true },
    },

    // ✅ admin fields (admin enters later)
    adminQuote: {
      documents: {
        // you can store multiple docs
        type: [
          {
            name: { type: String, default: "" }, // House Pdf
            url: { type: String, default: "" }, // file url
          },
        ],
        default: [],
      },

      quotedPrice: { type: Number, default: null }, // ₹ 24545
      currency: { type: String, default: "INR" },

      rateValidTill: { type: Date, default: null },
    },

    // ✅ status for action column
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "expired"],
      default: "pending",
    },

    adminNotes: { type: String, default: "" },
  },
  { timestamps: true },
);

// ✅ auto enquiryId generation
SpotPricingSchema.pre("save", async function (next) {
  if (!this.enquiryId) {
    const random = Math.floor(1000000000000 + Math.random() * 9000000000000);
    this.enquiryId = `SKRT${random}`;
  }
  next();
});

export default mongoose.model("SpotPricing", SpotPricingSchema);
