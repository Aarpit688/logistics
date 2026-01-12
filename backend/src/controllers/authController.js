import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { generateOtp, sendEmailOtp } from "../services/otpService.js";
import { sendMobileOtp } from "../services/twilioService.js";

export const signup = async (req, res) => {
  try {
    const { name, companyName, mailingAddress, mobile, email, password } =
      req.body;

    if (
      !name ||
      !companyName ||
      !mailingAddress ||
      !mobile ||
      !email ||
      !password
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Check existing user
    const exists = await User.findOne({ $or: [{ mobile }, { email }] });
    if (exists) {
      return res
        .status(400)
        .json({ message: "Email or mobile already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const files = req.files;

    const documents = {
      gst: files?.gst?.[0]?.path || null,
      iec: files?.iec?.[0]?.path || null,
      pan: files?.pan?.[0]?.path || null,
      aadhar: files?.aadhar?.[0]?.path || null,
      lut: files?.lut?.[0]?.path || null,
      stamp: files?.stamp?.[0]?.path || null,
      signature: files?.signature?.[0]?.path || null,
      photo: files?.photo?.[0]?.path || null,
    };

    // Generate OTPs
    const mobileOtp = generateOtp();
    const emailOtp = generateOtp();

    // Expiry time (5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Send OTP SMS + Email
    await sendMobileOtp(mobile, mobileOtp);
    await sendEmailOtp(email, emailOtp);

    const user = await User.create({
      name,
      companyName,
      mailingAddress,
      mobile,
      email,
      passwordHash,
      documents,

      otp: mobileOtp,
      otpExpiresAt: expiresAt,

      emailOtp,
      emailOtpExpiresAt: expiresAt,

      isMobileVerified: false,
      isEmailVerified: false,
      isApprovedByAdmin: false,
    });

    const token = generateToken(user);

    res.json({
      message: "Signup successful. OTPs sent to mobile & email.",
      userId: user._id,
      token,
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const verifyMobileOtp = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    const user = await User.findOne({ mobile });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });
    if (user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    user.isMobileVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;

    await user.save();

    res.json({ message: "Mobile verified successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.emailOtp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });
    if (user.emailOtpExpiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    user.isEmailVerified = true;
    user.emailOtp = null;
    user.emailOtpExpiresAt = null;

    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    let { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        message: "Identifier and password are required",
      });
    }

    identifier = identifier.trim().toLowerCase();

    const user = await User.findOne({
      $or: [{ email: identifier }, { mobile: identifier }],
    });

    // ❌ User not found or password missing
    if (!user || !user.passwordHash) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // 🔐 Compare password with passwordHash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        isApprovedByAdmin: user.isApprovedByAdmin,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const uploadDocuments = async (req, res) => {
  try {
    const { userId } = req.body; // Or from req.user if using auth middleware
    const files = req.files;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const documents = {
      gst: files?.gst?.[0]?.path || user.documents.gst,
      iec: files?.iec?.[0]?.path || user.documents.iec,
      pan: files?.pan?.[0]?.path || user.documents.pan,
      aadhar: files?.aadhar?.[0]?.path || user.documents.aadhar,
      lut: files?.lut?.[0]?.path || user.documents.lut,
      stamp: files?.stamp?.[0]?.path || user.documents.stamp,
      signature: files?.signature?.[0]?.path || user.documents.signature,
      photo: files?.photo?.[0]?.path || user.documents.photo,
    };

    user.documents = documents;
    // user.isApprovedByAdmin = false; // Reset approval if docs change? Maybe.
    await user.save();

    res.json({ message: "Documents uploaded successfully." });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const resendMobileOtp = async (req, res) => {
  try {
    const { mobile } = req.body;
    const user = await User.findOne({ mobile });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    await sendMobileOtp(mobile, otp);
    res.json({ message: "OTP resent to mobile" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const resendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = generateOtp();
    user.emailOtp = otp;
    user.emailOtpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    await sendEmailOtp(email, otp);
    res.json({ message: "OTP resent to email" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Helper to generate token (if not already imported/defined)
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || "secret",
    { expiresIn: "1d" }
  );
};

export const getMe = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-passwordHash");

    res.json({ user });
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

export const updateMe = async (req, res) => {
  try {
    const allowedUpdates = ["name", "companyName", "mailingAddress"];

    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select("-passwordHash");

    res.json({ user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Profile update failed" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Fetch user with password hash
    const user = await User.findById(req.user._id).select("+passwordHash");

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to change password" });
  }
};
