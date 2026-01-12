import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    companyName: { type: String, required: true },
    mailingAddress: { type: String, required: true },
    mobile: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },

    passwordHash: { type: String, required: true },

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
    documentRemarks: {
      gst: String,
      iec: String,
      pan: String,
      aadhar: String,
      lut: String,
      stamp: String,
      signature: String,
      photo: String,
    },

    accountType: {
      type: String,
      enum: ["CC", "CB"],
      default: null, // assigned by admin
    },
    accountCode: {
      type: String,
      unique: true,
      sparse: true, // allows existing users without code
    },

    previousAccountCodes: [
      {
        accountType: String,
        accountCode: String,
        changedAt: Date,
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],

    otp: String,
    otpExpiresAt: Date,
    isMobileVerified: { type: Boolean, default: false },

    emailOtp: String,
    emailOtpExpiresAt: Date,
    isEmailVerified: { type: Boolean, default: false },

    isApprovedByAdmin: { type: Boolean, default: false },
    approvedAt: Date,

    role: { type: String, default: "customer" },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
