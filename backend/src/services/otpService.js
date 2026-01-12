import otpGenerator from "otp-generator";
import nodemailer from "nodemailer";

export const generateOtp = () => {
  return otpGenerator.generate(4, {
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
};

// For SMS (Console)
export const sendSmsOtp = (mobile, otp) => {
  console.log(`SMS OTP for ${mobile}: ${otp}`);
};

// Email OTP sender (Hostinger SMTP)
export const sendEmailOtp = async (email, otp) => {
  // 🔄 Updated ENV variable names
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[MOCK] Email OTP for ${email}: ${otp}`);
    return;
  }

  try {
    // 🔄 Removed Gmail service & added Hostinger SMTP config
    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com", // 🔄 Hostinger SMTP hostname
      port: 465, // 🔄 SSL port (or 587 for TLS)
      secure: true, // 🔄 true for port 465, false for 587
      auth: {
        user: process.env.SMTP_USER, // 🔄 Your Hostinger email address
        pass: process.env.SMTP_PASS, // 🔄 Your Hostinger email password
      },
      tls: {
        rejectUnauthorized: false, // ✔ Recommended to prevent TLS issues
      },
    });

    await transporter.sendMail({
      from: `"Logistics Verification" <${process.env.SMTP_USER}>`, // 🔄 Updated sender email
      to: email,
      subject: "Your OTP Verification Code",
      text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
    });

    console.log(`Email OTP sent to: ${email}`);
  } catch (error) {
    console.error("Email sending failed:", error);
    console.log(`[FALLBACK] Email OTP for ${email}: ${otp}`);
  }
};
