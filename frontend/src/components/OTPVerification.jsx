import React, { useState, useEffect } from "react";
import { Loader2, CheckCircle2, Send, Lock } from "lucide-react";

export const OTPVerification = ({
  label,
  value,
  onChange,
  isVerified,
  onVerify,
  onSendOtp,
  onVerifyOtp,
  type = "text",
  placeholder,
}) => {
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOtp = async () => {
    if (!value) {
      setError("Please enter a value first");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      await onSendOtp(value);
      setOtpSent(true);
      setTimer(30);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpInput.length !== 4) {
      setError("Please enter a valid 4-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      await onVerifyOtp(value, otpInput);
      onVerify(true);
      setOtpSent(false);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} <span className="text-red-500">*</span>
      </label>

      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isVerified || otpSent}
          placeholder={placeholder}
          className={`
            block w-full px-4 py-2.5 rounded-lg border 
            focus:ring-2 focus:ring-accent focus:border-accent
            disabled:bg-slate-50 disabled:text-slate-500
            ${error && !otpSent ? "border-red-300" : "border-slate-300"}
            ${isVerified ? "border-green-300 bg-green-50 pr-10" : ""}
          `}
        />

        {isVerified && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        )}

        {!isVerified && !otpSent && (
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={isLoading || !value}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-medium text-white bg-slate-800 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Send OTP"
            )}
          </button>
        )}
      </div>

      {otpSent && !isVerified && (
        <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-top-2">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Enter Verification Code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={4}
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
              className="block w-full px-4 py-2 rounded border border-slate-300 focus:ring-2 focus:ring-accent focus:border-accent text-center tracking-widest font-mono text-lg"
              placeholder="0000"
            />
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={isLoading || otpInput.length !== 4}
              className="px-4 py-2 bg-accent text-white rounded font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center justify-center min-w-[100px]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Verify"
              )}
            </button>
          </div>
          <div className="mt-2 flex justify-between items-center text-xs">
            {timer > 0 ? (
              <span className="text-slate-400">Resend in {timer}s</span>
            ) : (
              <button
                type="button"
                onClick={handleSendOtp}
                className="text-accent hover:underline font-medium"
              >
                Resend OTP
              </button>
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      {isVerified && (
        <p className="mt-1 text-sm text-green-600 font-medium">
          Verified successfully
        </p>
      )}
    </div>
  );
};
