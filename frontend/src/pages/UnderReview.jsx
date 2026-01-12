import React from "react";
import { Clock, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const UnderReview = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* 🔴 Logout Button */}
      <div className="absolute top-4 right-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-md hover:bg-red-600 transition"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="max-w-lg w-full bg-white shadow-md rounded-xl p-8 text-center space-y-4">
          <Clock className="w-12 h-12 mx-auto text-yellow-500" />
          <h2 className="text-2xl font-bold">Documents Under Review</h2>
          <p className="text-gray-600">
            Thank you for registering with us.
            <br />
            Your details and uploaded documents are currently under review by
            our admin team.
          </p>
          <p className="text-sm text-gray-500">
            You will be automatically redirected once your account is approved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnderReview;
