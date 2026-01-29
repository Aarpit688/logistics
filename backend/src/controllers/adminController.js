import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Msme from "../models/Msme.js";
import { generateAccountCode } from "../utils/accountCode.js";
import SpotPricing from "../models/SpotPricing.js";
import Booking from "../models/Booking.js";

/* ===========================
   ADMIN AUTH
=========================== */
export const adminLogin = (req, res) => {
  const { username, password } = req.body;

  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({ message: "Invalid admin credentials" });
  }

  const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  res.status(200).json({
    message: "Admin login successful",
    token,
  });
};

/* ===========================
   USERS
=========================== */
export const getAllUsers = async (req, res) => {
  const { search = "", page = 1, limit = 10 } = req.query;

  const query = {
    $or: [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { mobile: { $regex: search, $options: "i" } },
    ],
  };

  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await User.countDocuments(query);

  res.json({ users, total });
};

/**
 * APPROVE / UNAPPROVE USER
 */
export const toggleUserApproval = async (req, res) => {
  const { approved } = req.body;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      isApprovedByAdmin: approved,
      approvedAt: approved ? new Date() : null,
    },
    { new: true },
  );

  res.json({ user });
};

/**
 * UPDATE DOCUMENT REMARK
 */
export const updateDocumentRemark = async (req, res) => {
  const { document, remark } = req.body;

  await User.findByIdAndUpdate(req.params.id, {
    [`documentRemarks.${document}`]: remark,
    isApprovedByAdmin: false,
  });

  res.json({ message: "Document remark updated" });
};

/**
 * ASSIGN ACCOUNT TYPE
 */
export const assignAccountType = async (req, res) => {
  const { accountType } = req.body;
  const { id } = req.params;

  if (!["CC", "CB"].includes(accountType)) {
    return res.status(400).json({ message: "Invalid account type" });
  }

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (user.accountCode) {
    user.previousAccountCodes = [
      ...(user.previousAccountCodes || []),
      {
        accountType: user.accountType,
        accountCode: user.accountCode,
        changedAt: new Date(),
      },
    ];
  }

  const accountCode = await generateAccountCode(accountType);

  user.accountType = accountType;
  user.accountCode = accountCode;

  await user.save();

  res.json({
    message: "Account type updated",
    accountType,
    accountCode,
  });
};

/* ===========================
   MSME (ADMIN)
=========================== */

/**
 * GET ALL MSME REGISTRATIONS
 */
export const getAllMsmesAdmin = async (req, res) => {
  const { search = "", page = 1, limit = 10 } = req.query;

  const query = {
    $or: [
      { companyName: { $regex: search, $options: "i" } },
      { gstin: { $regex: search, $options: "i" } },
      { pan: { $regex: search, $options: "i" } },
      { mobile: { $regex: search, $options: "i" } },
    ],
  };

  const msmes = await Msme.find(query)
    .populate("user", "name email mobile")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Msme.countDocuments(query);

  res.json({ msmes, total });
};

/**
 * UPDATE MSME STATUS
 * PENDING | APPROVED | REJECTED
 */
export const updateMsmeStatus = async (req, res) => {
  const { status, adminRemark } = req.body;

  if (!["PENDING", "APPROVED", "REJECTED"].includes(status)) {
    return res.status(400).json({ message: "Invalid MSME status" });
  }

  const msme = await Msme.findByIdAndUpdate(
    req.params.id,
    { status, adminRemark },
    { new: true },
  );

  if (!msme) {
    return res.status(404).json({ message: "MSME not found" });
  }

  res.json({
    message: "MSME status updated",
    status: msme.status,
  });
};

// ✅ GET: /api/admin/spot-pricing
export const getAllSpotPricingEnquiries = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [total, list] = await Promise.all([
      SpotPricing.countDocuments(filter),
      SpotPricing.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    const data = list.map((e, idx) => ({
      srNo: skip + idx + 1,
      id: e._id,
      enquiryId: e.enquiryId,
      enquiryDate: e.createdAt,

      origin: e.serviceability?.origin?.city,
      destination: e.serviceability?.destination?.country,

      weight: e.shipmentDetails?.totalWeight,
      vendor: e.shipmentDetails?.vendor,

      status: e.status,
    }));

    return res.status(200).json({
      success: true,
      message: "Spot pricing enquiries fetched",
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch enquiries",
      error: error.message,
    });
  }
};

// ✅ GET: /api/admin/spot-pricing/:id
export const getSpotPricingEnquiryById = async (req, res) => {
  try {
    const enquiry = await SpotPricing.findById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Enquiry fetched successfully",
      data: enquiry,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch enquiry",
      error: error.message,
    });
  }
};

// ✅ PATCH: /api/admin/spot-pricing/:id/quote
export const updateSpotPricingAdminQuote = async (req, res) => {
  try {
    const {
      documents,
      quotedPrice,
      currency,
      rateValidTill,
      adminNotes,
      status,
    } = req.body;

    const updated = await SpotPricing.findByIdAndUpdate(
      req.params.id,
      {
        ...(adminNotes !== undefined ? { adminNotes } : {}),
        ...(status ? { status } : {}),

        // ✅ admin quote fields
        ...(documents !== undefined
          ? { "adminQuote.documents": documents }
          : {}),
        ...(quotedPrice !== undefined
          ? { "adminQuote.quotedPrice": quotedPrice }
          : {}),
        ...(currency !== undefined ? { "adminQuote.currency": currency } : {}),
        ...(rateValidTill !== undefined
          ? { "adminQuote.rateValidTill": rateValidTill }
          : {}),
      },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Quote updated successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update quote",
      error: error.message,
    });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      // 👇 THIS LINE IS CRITICAL: It swaps the 'user' ID for the actual User document
      .populate("user", "name email mobile companyName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Single Booking (Detailed View)
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.id });
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Status (e.g., Mark as Approved)
export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body; // { status: "APPROVED" }
    const booking = await Booking.findOneAndUpdate(
      { bookingId: req.params.id },
      { status },
      { new: true },
    );
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
