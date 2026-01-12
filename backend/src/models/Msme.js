import mongoose from "mongoose";

const msmeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    companyName: { type: String, required: true },
    contactPerson: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String },

    address1: { type: String, required: true },
    address2: { type: String, required: true },
    pincode: { type: String, required: true },
    city: { type: String },
    state: { type: String },

    gstin: { type: String, required: true, uppercase: true },
    iec: { type: String, required: true },
    pan: { type: String, required: true, uppercase: true },

    documents: {
      gst: String,
      iec: String,
      pan: String,
      aadhar: String,
      lut: String,
      stamp: String,
      signature: String,
      photo: String,
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },

    adminRemark: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Msme", msmeSchema);
