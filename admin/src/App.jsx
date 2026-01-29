import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

import AdminProtectedRoute from "./routes/AdminProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import AdminFuelSurcharge from "./pages/AdminFuelSurcharge";
import AdminMSME from "./pages/AdminMSME";
import AdminCountryZone from "./pages/AdminCountryZone";
import AdminBookingList from "./pages/AdminBookingList";

const App = () => {
  return (
    <Router>
      <Routes>
        {/* -------- ADMIN LOGIN (NO SIDEBAR) -------- */}
        <Route path="/" element={<AdminLogin />} />

        {/* -------- ADMIN PROTECTED + SIDEBAR -------- */}
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="msme" element={<AdminMSME />} />
          <Route path="fuel-surcharge" element={<AdminFuelSurcharge />} />
          <Route path="country-zones" element={<AdminCountryZone />} />
          <Route path="settings" element={<div>Admin Settings Page</div>} />
          <Route
            path="booking"
            element={
              <div>
                <AdminBookingList />
              </div>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
