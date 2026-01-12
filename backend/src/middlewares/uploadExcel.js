import multer from "multer";

const storage = multer.memoryStorage(); // keep in RAM (best for parsing)

function fileFilter(req, file, cb) {
  const allowed =
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.mimetype === "application/vnd.ms-excel";

  if (!allowed) {
    return cb(new Error("Only Excel files are allowed (.xlsx/.xls)"), false);
  }

  cb(null, true);
}

export const uploadExcel = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
