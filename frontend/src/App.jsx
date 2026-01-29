import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Profile from "./pages/Profile";
import DashboardHome from "./pages/DashboardHome";
import BookShipment from "./pages/BookShipment";
import AppLayout from "./layouts/AppLayout";
import UserProtectedRoute from "./routes/UserProtectedRoute";
import UnderReview from "./pages/UnderReview";
import FuelSurcharge from "./pages/FuelSurcharge";
import MSMEDhl from "./pages/MSMEDhl";
import VolumetricWeightCalculator from "./pages/VolumetricWeightCalculator";
import AuthRoute from "./routes/AuthRoute";
import RateCalculator from "./pages/RateCalculator";
import SpotPricing from "./pages/SpotPricing";
import SpotPricingList from "./pages/SpotPricingList";
import BookingListDomestic from "./pages/BookingListDomestic";
import BookingListExport from "./pages/BookingListExport";
import BookingListImport from "./pages/BookingListImport";

const App = () => {
  return (
    <Router>
      <Routes>
        {/* 🌐 Public */}
        <Route
          path="/"
          element={
            <AuthRoute>
              <Login />
            </AuthRoute>
          }
        />
        <Route
          path="/login"
          element={
            <AuthRoute>
              <Login />
            </AuthRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <AuthRoute>
              <SignUp />
            </AuthRoute>
          }
        />
        <Route path="/under-review" element={<UnderReview />} />

        {/* 🔐 Authenticated App */}
        <Route
          element={
            <UserProtectedRoute>
              <AppLayout />
            </UserProtectedRoute>
          }
        >
          {/* All internal pages */}
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/dashboard/profile" element={<Profile />} />
          <Route path="/fuel-surcharge" element={<FuelSurcharge />} />
          <Route path="/rate-calculator" element={<RateCalculator />} />
          <Route path="/book-shipment" element={<BookShipment />} />
          <Route path="/msme-dhl" element={<MSMEDhl />} />
          <Route
            path="/volumetric-weight-calculator"
            element={<VolumetricWeightCalculator />}
          />
          <Route path="/spot-pricing-enquiry" element={<SpotPricing />} />
          <Route path="/spot-pricing-list" element={<SpotPricingList />} />

          <Route path="/bookings/domestic" element={<BookingListDomestic />} />
          <Route path="/bookings/export" element={<BookingListExport />} />
          <Route path="/bookings/import" element={<BookingListImport />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
