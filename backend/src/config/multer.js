import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// 🔐 sanitize filename
const sanitize = (name) => {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);

    const safeName = sanitize(base);
    const userId = req.user?.id || "unknown";
    const docType = req.params.documentType;

    // ✅ FINAL FILE NAME
    const finalName = `${userId}-${docType}-${safeName}${ext}`;

    cb(null, finalName);
  },
});

export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedExt = [".pdf", ".jpg", ".jpeg", ".png"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowedExt.includes(ext)) {
      return cb(new Error("Only PDF, JPG, JPEG, PNG files are allowed"), false);
    }

    cb(null, true);
  },
});
