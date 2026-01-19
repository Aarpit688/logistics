import multer from "multer";
import path from "path";
import fs from "fs";

const msmeUploadPath = "uploads/msme";

/* 🔹 Ensure folder exists */
if (!fs.existsSync(msmeUploadPath)) {
  fs.mkdirSync(msmeUploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, msmeUploadPath); // ✅ MSME docs go here
  },

  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9,
    )}${path.extname(file.originalname)}`;

    cb(null, uniqueName);
  },
});

export const uploadDocuments = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 🔒 5MB per file
  },
}).fields([
  // ✅ renamed keys (no clash with text fields)
  { name: "gstDoc", maxCount: 1 },
  { name: "iecDoc", maxCount: 1 },
  { name: "panDoc", maxCount: 1 },
  { name: "stampDoc", maxCount: 1 },

  // ✅ optional docs (these don't clash with schema text fields)
  { name: "aadhar", maxCount: 1 },
  { name: "lut", maxCount: 1 },
  { name: "signature", maxCount: 1 },
  { name: "photo", maxCount: 1 },
]);
