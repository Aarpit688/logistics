import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Send SMS OTP
export const sendMobileOtp = async (mobile, otp) => {
  try {
    await client.messages.create({
      // Prefer Messaging Service ID (Twilio recommends this for OTP)
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
      to: mobile.startsWith("+") ? mobile : `+91${mobile}`, // auto add +91 if missing
      body: `Your verification OTP is: ${otp}. It will expire in 5 minutes.`,
    });

    console.log("OTP sent via Twilio");
  } catch (error) {
    console.error("Twilio SMS Error:", error.message);
    throw new Error("Error sending OTP");
  }
};
