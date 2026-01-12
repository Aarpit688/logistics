import React, { useState } from "react";
import {
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
  Smartphone,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (!identifier || !password) {
      setError("Please enter both your identifier and password.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid credentials");
        setIsLoading(false);
        return;
      }

      // ✅ Save token
      localStorage.setItem("token", data.token);

      // Optional: store user info
      localStorage.setItem("user", JSON.stringify(data.user));

      setSuccess("Successfully logged in! Redirecting...");

      setTimeout(() => {
        if (data.user.isApprovedByAdmin) {
          window.location.href = "/dashboard";
        } else {
          window.location.href = "/under-review";
        }
      }, 1000);
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isIdentifierEmail = identifier.includes("@");
  const identifierIcon = isIdentifierEmail ? (
    <Mail className="w-5 h-5" />
  ) : (
    <Smartphone className="w-5 h-5" />
  );

  return (
    <div className="min-h-screen w-full flex bg-gray-50">
      <div className="flex items-center justify-center w-full p-6">
        <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8 space-y-6">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-2xl font-bold">Welcome Back</h2>
            <p className="text-gray-500 text-sm">
              Enter your details to sign in.
            </p>
          </div>

          {/* Feedback */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600 flex gap-2">
              <CheckCircle2 className="w-5 h-5" />
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Identifier */}
            <div>
              <label className="text-sm text-gray-700">Email or Phone</label>
              <div className="flex items-center gap-2 border rounded-md px-3 py-2">
                {identifierIcon}
                <input
                  type="text"
                  className="w-full outline-none"
                  placeholder="email@example.com / +1234567890"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm text-gray-700">Password</label>
              <div className="flex items-center gap-2 border rounded-md px-3 py-2">
                <Lock className="w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full outline-none"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="text-sm text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-brand-600 text-black font-semibold rounded-md hover:bg-brand-700 transition"
            >
              {isLoading ? "Logging in..." : "Login Here"}
            </button>
          </form>
          <p className="text-center">
            Don't have an account?{" "}
            <NavLink to={"/signup"} className="font-bold">
              Sign Up
            </NavLink>{" "}
            Now
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
