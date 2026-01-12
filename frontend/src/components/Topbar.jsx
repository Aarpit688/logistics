import { Menu, ChevronDown, User, LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Topbar = ({
  user,
  setSidebarOpen,
  dropdownOpen,
  setDropdownOpen,
  logout,
}) => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  /* -----------------------------
     Close on outside click
  ------------------------------ */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [dropdownOpen, setDropdownOpen]);

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6">
      {/* Left */}
      <div className="flex items-center gap-3">
        <Menu
          className="md:hidden cursor-pointer hover:text-gray-900"
          onClick={() => setSidebarOpen(true)}
        />
        <span className="font-bold md:hidden tracking-wide">LOGO</span>
      </div>

      {/* Right */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((p) => !p)}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700
                     hover:bg-gray-100 transition"
        >
          <User className="w-4 h-4" />
          <span className="hidden sm:block">
            Welcome,{" "}
            <span className="font-semibold">{user?.name || "Guest"}</span>
          </span>

          <motion.span
            animate={{ rotate: dropdownOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4" />
          </motion.span>
        </button>

        {/* Dropdown */}
        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50 overflow-hidden"
            >
              <button
                onClick={() => {
                  navigate("/dashboard/profile");
                  setDropdownOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700
                           hover:bg-gray-50 w-full"
              >
                <User className="w-4 h-4" />
                Profile
              </button>

              <button
                onClick={() => {
                  navigate("/dashboard/settings");
                  setDropdownOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700
                           hover:bg-gray-50 w-full"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>

              <div className="h-px bg-gray-100" />

              <button
                onClick={logout}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600
                           hover:bg-red-50 w-full"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Topbar;
