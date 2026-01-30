import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

// 1. Configure Cloudinary with credentials from .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ===========================
   1. MSME STORAGE CONFIG
   (Saves to 'logistics_msme' folder in Cloudinary)
=========================== */
const msmeStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "logistics_msme",
    allowed_formats: ["jpg", "png", "jpeg", "pdf"],
    // 'auto' is required to detect if it's an image or a raw file (like PDF)
    resource_type: "auto",
  },
});

export const uploadDocuments = multer({
  storage: msmeStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
}).fields([
  { name: "gstDoc", maxCount: 1 },
  { name: "iecDoc", maxCount: 1 },
  { name: "panDoc", maxCount: 1 },
  { name: "stampDoc", maxCount: 1 },
  { name: "aadhar", maxCount: 1 },
  { name: "lut", maxCount: 1 },
  { name: "signature", maxCount: 1 },
  { name: "photo", maxCount: 1 },
]);

/* ===========================
   2. BOOKING STORAGE CONFIG
   (Updated for robust PDF handling)
=========================== */
const bookingStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // ⚠️ CRITICAL: Check file mimetype to determine resource_type
    const isPdf = file.mimetype === "application/pdf";

    return {
      folder: "logistics_bookings",
      // If PDF, use 'raw'. If image, use 'image'. 'auto' can be flaky for PDFs.
      resource_type: isPdf ? "raw" : "image",
      public_id: `${Date.now()}-${file.originalname.split(".")[0]}`, // Keep name clean
      // format: isPdf ? undefined : file.mimetype.split('/')[1], // Only enforce format for images
    };
  },
});

export const uploadBookingDocs = multer({
  storage: bookingStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}).any();
