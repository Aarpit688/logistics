import axios from "axios";
import { API_BASE_URL } from "../config/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const signup = async (formData) => {
  const response = await api.post("/auth/signup", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const verifyMobileOtp = async (mobile, otp) => {
  const response = await api.post("/auth/verify-mobile-otp", { mobile, otp });
  return response.data;
};

export const verifyEmailOtp = async (email, otp) => {
  const response = await api.post("/auth/verify-email-otp", { email, otp });
  return response.data;
};

export const login = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  return response.data;
};

export const uploadDocuments = async (formData) => {
  const response = await api.post("/auth/upload-documents", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const resendMobileOtp = async (mobile) => {
  const response = await api.post("/auth/resend-mobile-otp", { mobile });
  return response.data;
};

export const resendEmailOtp = async (email) => {
  const response = await api.post("/auth/resend-email-otp", { email });
  return response.data;
};

export default api;
