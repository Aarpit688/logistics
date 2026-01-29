import multer from "multer";
import path from "path";
import fs from "fs";

// ✅ Define paths
const msmeUploadPath = "uploads/msme";
const bookingUploadPath = "uploads/bookings";

// ✅ Ensure both folders exist
if (!fs.existsSync(msmeUploadPath)) {
  fs.mkdirSync(msmeUploadPath, { recursive: true });
}

if (!fs.existsSync(bookingUploadPath)) {
  fs.mkdirSync(bookingUploadPath, { recursive: true });
}

/* ===========================
   1. MSME STORAGE CONFIG
=========================== */
const msmeStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, msmeUploadPath); // Goes to uploads/msme
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
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
=========================== */
const bookingStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, bookingUploadPath); // ✅ Goes to uploads/bookings
  },
  filename: function (req, file, cb) {
    // Generate unique name: timestamp-random.ext
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// ✅ Generic uploader for dynamic booking files (documents[0], documents[1] etc.)
export const uploadBookingDocs = multer({
  storage: bookingStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
}).any();
