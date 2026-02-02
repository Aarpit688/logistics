import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

/* ===========================
   STORAGE GENERATOR
=========================== */
// We create a function to generate storage config based on the folder name
const createStorage = (folderName) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      // Dynamic directory: uploads/bookings/ OR uploads/documents/
      const dir = `uploads/${folderName}/`;
      ensureDir(dir);
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      // Format: timestamp-random-originalname
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    },
  });

/* ===========================
   FILE FILTER
=========================== */
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/pdf",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only JPEG, PNG and PDF are allowed."),
      false,
    );
  }
};

/* ===========================
   EXPORTS
=========================== */

// 1. For Bookings (saves to uploads/bookings/)
export const uploadBookingDocs = multer({
  storage: createStorage("bookings"),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter,
}).any();

// 2. For General User Docs - Signup/MSME (saves to uploads/documents/)
// This fixes the missing export error
export const uploadDocuments = multer({
  storage: createStorage("documents"),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter,
}).any();
