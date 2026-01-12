import React, { useState } from "react";
import {
  Building2,
  User,
  MapPin,
  ArrowRight,
  ArrowLeft,
  CheckCheck,
  ShieldCheck,
  FileCheck,
  Link,
} from "lucide-react";

import { FileUpload } from "../components/FileUpload";
import { OTPVerification } from "../components/OTPVerification";
import {
  signup,
  verifyMobileOtp,
  verifyEmailOtp,
  uploadDocuments,
  resendMobileOtp,
  resendEmailOtp,
} from "../services/api";
import { NavLink } from "react-router-dom";

const STEPS = [
  { id: 1, title: "Business Identity", icon: Building2 },
  { id: 2, title: "Contact Verification", icon: ShieldCheck },
  { id: 3, title: "Documentation", icon: FileCheck },
];

const INITIAL_FORM_DATA = {
  fullName: "",
  companyName: "",
  mailingAddress: "",
  mobile: "",
  email: "",
  password: "",
  gst: null,
  iec: null,
  pan: null,
  aadhar: null,
  lut: null,
  stamp: null,
  signature: null,
  photo: null,
};

export default function SignUp() {
  const [appState, setAppState] = useState("FORM");
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [verification, setVerification] = useState({
    mobileVerified: false,
    emailVerified: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (
        !formData.fullName ||
        !formData.companyName ||
        !formData.mailingAddress ||
        !formData.password
      ) {
        alert("Please fill in all fields.");
        return;
      }
    }

    if (currentStep === 2) {
      if (!verification.mobileVerified || !verification.emailVerified) {
        alert("Please verify both Mobile Number and Email to proceed.");
        return;
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    const requiredDocs = [
      "gst",
      "iec",
      "pan",
      "aadhar",
      "lut",
      "stamp",
      "signature",
      "photo",
    ];

    const missingDocs = requiredDocs.filter((key) => !formData[key]);

    if (missingDocs.length > 0) {
      alert(
        `Please upload all required documents: ${missingDocs
          .join(", ")
          .toUpperCase()}`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append("userId", formData.userId); // Ensure userId is passed

      // Append documents
      const requiredDocs = [
        "gst",
        "iec",
        "pan",
        "aadhar",
        "lut",
        "stamp",
        "signature",
        "photo",
      ];

      requiredDocs.forEach((key) => {
        if (formData[key]) {
          data.append(key, formData[key]);
        }
      });

      await uploadDocuments(data);
      setAppState("REVIEW");
    } catch (err) {
      alert(err.response?.data?.message || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOtp = async (type) => {
    try {
      if (formData.userId) {
        // User exists, just resend
        if (type === "mobile") await resendMobileOtp(formData.mobile);
        else await resendEmailOtp(formData.email);
      } else {
        // Create user (partial signup)
        const data = new FormData();
        data.append("name", formData.fullName);
        data.append("companyName", formData.companyName);
        data.append("mailingAddress", formData.mailingAddress);
        data.append("mobile", formData.mobile);
        data.append("email", formData.email);
        data.append("password", formData.password);

        const response = await signup(data);
        setFormData((prev) => ({ ...prev, userId: response.userId }));
      }
      return true;
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send OTP");
      throw err;
    }
  };

  if (appState === "VERIFY") {
    // This state is no longer used in the new flow, but keeping it as a fallback or removing it.
    // Since we moved verification to Step 2, we can remove this block or just return null.
    return null;
  }

  if (appState === "REVIEW") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCheck className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Submission Received
          </h2>
          <p className="text-slate-600 mb-6">
            Your profile and documents are currently under review. You will be
            notified via email once approved.
          </p>

          <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-500 border border-slate-100">
            <p className="font-medium text-slate-700 mb-1">Application ID</p>
            <p className="font-mono">
              TRD-{Math.random().toString(36).substr(2, 9).toUpperCase()}
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="mt-8 text-sm text-accent hover:text-blue-700 font-medium"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Ace Global Logistics Sign Up
          </h1>
          <p className="mt-2 text-slate-600">
            Complete the form below to register your company securely or if
            already registered{" "}
            <NavLink to={"/login"} className="text-xl font-semibold">
              Login here
            </NavLink>
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10 rounded-full"></div>
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep >= step.id;
              const isCurrent = currentStep === step.id;

              return (
                <div
                  key={step.id}
                  className="flex flex-col items-center bg-transparent"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-4 ${
                      isActive
                        ? "bg-accent border-blue-200 text-white shadow-lg scale-110"
                        : "bg-white border-slate-200 text-slate-400"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      isCurrent ? "text-accent" : "text-slate-500"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
          <div className="h-1 bg-slate-100 w-full">
            <div
              className="h-full bg-accent transition-all duration-500 ease-out"
              style={{
                width: `${(currentStep / STEPS.length) * 100}%`,
              }}
            ></div>
          </div>

          <div className="p-8">
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <User className="w-5 h-5 text-accent" />
                  Personal & Company Details
                </h2>

                <div className="grid gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                      placeholder="e.g. John Doe"
                      value={formData.fullName}
                      onChange={(e) => updateField("fullName", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                      placeholder="e.g. Acme Trading Corp"
                      value={formData.companyName}
                      onChange={(e) =>
                        updateField("companyName", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Mailing Address *
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-accent focus:border-accent transition-all resize-none"
                      placeholder="Registered office address..."
                      value={formData.mailingAddress}
                      onChange={(e) =>
                        updateField("mailingAddress", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => updateField("password", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-accent" />
                  Contact Verification
                </h2>

                <p className="text-sm text-slate-500 bg-blue-50 p-4 rounded-lg border border-blue-100">
                  Please verify your contact details. You must verify both to
                  proceed.
                </p>

                <div className="space-y-8 mt-6">
                  <OTPVerification
                    label="Mobile Number"
                    placeholder="+91 98765 43210"
                    type="tel"
                    value={formData.mobile}
                    onChange={(val) => updateField("mobile", val)}
                    isVerified={verification.mobileVerified}
                    onSendOtp={() => handleSendOtp("mobile")}
                    onVerifyOtp={verifyMobileOtp}
                    onVerify={(status) =>
                      setVerification((p) => ({
                        ...p,
                        mobileVerified: status,
                      }))
                    }
                  />

                  <hr className="border-slate-100" />

                  <OTPVerification
                    label="Email Address"
                    placeholder="john@company.com"
                    type="email"
                    value={formData.email}
                    onChange={(val) => updateField("email", val)}
                    isVerified={verification.emailVerified}
                    onSendOtp={() => handleSendOtp("email")}
                    onVerifyOtp={verifyEmailOtp}
                    onVerify={(status) =>
                      setVerification((p) => ({
                        ...p,
                        emailVerified: status,
                      }))
                    }
                  />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-accent" />
                  Required Documents
                </h2>

                <p className="text-sm text-slate-500 mb-4">
                  Upload clear copies of the following documents. Allowed
                  formats: PDF, JPG, PNG.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FileUpload
                    label="GST Certificate"
                    required
                    file={formData.gst}
                    onFileSelect={(f) => updateField("gst", f)}
                  />
                  <FileUpload
                    label="IEC (Import Export Code)"
                    required
                    file={formData.iec}
                    onFileSelect={(f) => updateField("iec", f)}
                  />
                  <FileUpload
                    label="PAN Card"
                    required
                    file={formData.pan}
                    onFileSelect={(f) => updateField("pan", f)}
                  />
                  <FileUpload
                    label="Aadhar Card"
                    required
                    file={formData.aadhar}
                    onFileSelect={(f) => updateField("aadhar", f)}
                  />
                  <FileUpload
                    label="LUT (Letter of Undertaking)"
                    required
                    file={formData.lut}
                    onFileSelect={(f) => updateField("lut", f)}
                  />
                  <FileUpload
                    label="Company Stamp"
                    required
                    file={formData.stamp}
                    onFileSelect={(f) => updateField("stamp", f)}
                  />
                  <FileUpload
                    label="Authorized Signature"
                    required
                    file={formData.signature}
                    onFileSelect={(f) => updateField("signature", f)}
                  />
                  <FileUpload
                    label="Passport Photo"
                    required
                    file={formData.photo}
                    onFileSelect={(f) => updateField("photo", f)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
            <button
              onClick={handleBack}
              disabled={currentStep === 1 || isSubmitting}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentStep === 1
                  ? "text-slate-300 cursor-not-allowed"
                  : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-all shadow-md hover:shadow-lg"
              >
                Next Step
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`flex items-center gap-2 px-8 py-2 bg-green-600 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg ${
                  isSubmitting ? "opacity-75 cursor-wait" : "hover:bg-green-700"
                }`}
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
                {!isSubmitting && <CheckCheck className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
