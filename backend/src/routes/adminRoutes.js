import express from "express";
import { adminAuth } from "../middlewares/adminAuth.middleware.js";

import {
  adminLogin,
  assignAccountType,
  getAllUsers,
  toggleUserApproval,
  updateDocumentRemark,

  // 🔥 MSME controllers are NOW here
  getAllMsmesAdmin,
  updateMsmeStatus,
  getAllSpotPricingEnquiries,
  getSpotPricingEnquiryById,
  updateSpotPricingAdminQuote,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
} from "../controllers/adminController.js";

import {
  createFuel,
  deleteFuel,
  getAllFuelAdmin,
  updateFuel,
} from "../controllers/fuelSurchargeController.js";
import {
  deleteAllCountryZones,
  getCountryZones,
  listCountryZones,
  uploadCountryZones,
} from "../controllers/countryZoneController.js";
import { uploadExcel } from "../middlewares/uploadExcel.js";

const router = express.Router();

/* ===========================
   AUTH
=========================== */
router.post("/login", adminLogin);

/* ===========================
   USERS
=========================== */
router.get("/users", adminAuth, getAllUsers);
router.patch("/users/:id/approval", adminAuth, toggleUserApproval);
router.patch("/users/:id/document-remark", adminAuth, updateDocumentRemark);
router.put("/users/:id/account-type", adminAuth, assignAccountType);

/* ===========================
   MSME
=========================== */
router.get("/msme", adminAuth, getAllMsmesAdmin);
router.patch("/msme/:id/status", adminAuth, updateMsmeStatus);

/* ===========================
   FUEL
=========================== */
router.get("/fuel-surcharge", adminAuth, getAllFuelAdmin);
router.post("/fuel-surcharge", adminAuth, createFuel);
router.put("/fuel-surcharge/:id", adminAuth, updateFuel);
router.delete("/fuel-surcharge/:id", adminAuth, deleteFuel);

/* ===========================
   ✅ COUNTRY ZONES (NEW)
=========================== */

// Upload Excel file
router.post(
  "/country-zones/upload",
  adminAuth,
  uploadExcel.single("file"),
  uploadCountryZones,
);

// List/search countries
router.get("/country-zones", adminAuth, listCountryZones);

// Get zone mapping for one country
router.get("/country-zones/:country", adminAuth, getCountryZones);

// Delete all country zones (reset import)
router.delete("/country-zones", adminAuth, deleteAllCountryZones);

// ✅ SpotPricing Admin
router.get("/spot-pricing", adminAuth, getAllSpotPricingEnquiries);
router.get("/spot-pricing/:id", adminAuth, getSpotPricingEnquiryById);

// ✅ Quote update route
router.patch("/spot-pricing/:id/quote", adminAuth, updateSpotPricingAdminQuote);

router.get("/all-bookings", adminAuth, getAllBookings);
router.get("/booking/:id", adminAuth, getBookingById);
router.patch("/booking/:id/status", adminAuth, updateBookingStatus);

export default router;
