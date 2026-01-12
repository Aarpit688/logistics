import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Msme from "../models/Msme.js";
import { generateAccountCode } from "../utils/accountCode.js";

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
    { new: true }
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
    { new: true }
  );

  if (!msme) {
    return res.status(404).json({ message: "MSME not found" });
  }

  res.json({
    message: "MSME status updated",
    status: msme.status,
  });
};
