import express from "express";
import { upload } from "../config/multer.js";
import { reuploadDocument } from "../controllers/userController.js";
import { userAuth } from "../middlewares/userAuth.js";

const router = express.Router();
router.patch(
  "/documents/:documentType",
  userAuth,
  upload.single("file"),
  reuploadDocument
);

export default router;
