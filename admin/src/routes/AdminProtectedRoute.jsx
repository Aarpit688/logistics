import React from "react";
import { Navigate } from "react-router-dom";
import { isAdminTokenExpired } from "../utils/isAdminTokenExpired";
import { logoutAdmin } from "../utils/adminAuth";

const AdminProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("adminToken");

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  if (isAdminTokenExpired(token)) {
    logoutAdmin();
    return null;
  }

  return children;
};

export default AdminProtectedRoute;
