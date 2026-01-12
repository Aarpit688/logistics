import express from "express";
import {
  signup,
  verifyMobileOtp,
  verifyEmailOtp,
  login,
  uploadDocuments as uploadDocumentsController,
  resendMobileOtp,
  resendEmailOtp,
  getMe,
  updateMe,
  changePassword,
} from "../controllers/authController.js";

import { registerMsme, getMyMsmes } from "../controllers/msmeController.js";

import { uploadDocuments } from "../middlewares/uploadMiddleware.js";
import { protect } from "../middlewares/authMiddleware.js";
import { getFinalFuel } from "../controllers/fuelSurchargeController.js";

const router = express.Router();

/* ===========================
   AUTH
=========================== */
router.post("/signup", uploadDocuments, signup);
router.post("/upload-documents", uploadDocuments, uploadDocumentsController);
router.post("/verify-mobile-otp", verifyMobileOtp);
router.post("/verify-email-otp", verifyEmailOtp);
router.post("/resend-mobile-otp", resendMobileOtp);
router.post("/resend-email-otp", resendEmailOtp);
router.post("/login", login);

/* ===========================
   USER PROFILE
=========================== */
router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.put("/change-password", protect, changePassword);

/* ===========================
   MSME (USER)
=========================== */
router.post(
  "/msme",
  protect,
  uploadDocuments, // same multer
  registerMsme
);

router.get("/msme", protect, getMyMsmes);

/* ===========================
   FUEL
=========================== */
router.get("/get-fuel-surcharge", protect, getFinalFuel);

export default router;
