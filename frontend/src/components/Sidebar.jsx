import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calculator,
  Box,
  FileText,
  Upload,
  Download,
  CreditCard,
  FileDown,
  ScrollText,
  Wallet,
  Truck,
  PackageCheck,
  MapPin,
  ClipboardList,
  ChevronDown,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [bookingsOpen, setBookingsOpen] = useState(false);
  const location = useLocation();

  // Auto-open Accounts if inside accounts route
  useEffect(() => {
    if (location.pathname.startsWith("/accounts")) {
      setAccountsOpen(true);
    }
    if (location.pathname.startsWith("/bookings")) {
      setBookingsOpen(true);
    }
  }, [location.pathname]);

  const navLinkClass = ({ isActive }) =>
    `group relative flex items-center gap-3 px-4 py-2.5 rounded-lg text-md transition-all
     ${
       isActive
         ? "bg-gray-100 font-semibold text-gray-900"
         : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
     }`;

  return (
    <aside
      className={`fixed md:static z-50 w-64 min-w-64 bg-white border-r h-screen flex flex-col transform transition-transform duration-300
      ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b">
        <span className="font-bold text-lg tracking-wide">LOGO</span>
        <X
          className="md:hidden cursor-pointer"
          onClick={() => setSidebarOpen(false)}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
        <NavLink to="/dashboard" end className={navLinkClass}>
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </NavLink>

        <NavLink to="/rate-calculator" className={navLinkClass}>
          <Calculator className="w-5 h-5" />
          Rate Calculator
        </NavLink>

        <NavLink to="/book-shipment" className={navLinkClass}>
          <PackageCheck className="w-5 h-5" />
          Book Shipment
        </NavLink>

        <NavLink to="/fuel-surcharge" className={navLinkClass}>
          <Calculator className="w-5 h-5" />
          Fuel Surcharge
        </NavLink>

        <NavLink to="/volumetric-weight-calculator" className={navLinkClass}>
          <Box className="w-5 h-5" />
          Volumetric Weight Calculator
        </NavLink>

        {/* BOOKINGS DROPDOWN */}
        <button
          onClick={() => setBookingsOpen((p) => !p)}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-md transition-all
          ${
            bookingsOpen
              ? "bg-gray-100 text-gray-900"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <ClipboardList className="w-5 h-5" />
          Bookings List
          <motion.span
            animate={{ rotate: bookingsOpen ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            className="ml-auto"
          >
            <ChevronDown className="w-5 h-5" />
          </motion.span>
        </button>

        <AnimatePresence>
          {bookingsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <motion.div
                className="ml-9 mt-1 space-y-1"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: { staggerChildren: 0.06 },
                  },
                }}
              >
                {[
                  {
                    to: "/bookings/domestic",
                    label: "Domestic",
                    icon: Box,
                  },
                  {
                    to: "/bookings/export",
                    label: "Export",
                    icon: Upload,
                  },
                  {
                    to: "/bookings/import",
                    label: "Import",
                    icon: Download,
                  },
                ].map((item) => (
                  <motion.div
                    key={item.to}
                    variants={{
                      hidden: { x: 20, opacity: 0 },
                      visible: { x: 0, opacity: 1 },
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <NavLink to={item.to} className={navLinkClass}>
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </NavLink>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ACCOUNTS DROPDOWN */}
        <button
          onClick={() => setAccountsOpen((p) => !p)}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-md transition-all
          ${
            accountsOpen
              ? "bg-gray-100 text-gray-900"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <CreditCard className="w-5 h-5" />
          Accounts
          <motion.span
            animate={{ rotate: accountsOpen ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            className="ml-auto"
          >
            <ChevronDown className="w-5 h-5" />
          </motion.span>
        </button>

        <AnimatePresence>
          {accountsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <motion.div className="ml-9 mt-1 space-y-1">
                <NavLink
                  to="/accounts/invoice-download"
                  className={navLinkClass}
                >
                  <FileDown className="w-5 h-5" />
                  Invoice Download
                </NavLink>
                <NavLink to="/accounts/logger" className={navLinkClass}>
                  <ScrollText className="w-5 h-5" />
                  Logger
                </NavLink>
                <NavLink to="/accounts/wallet-history" className={navLinkClass}>
                  <Wallet className="w-5 h-5" />
                  Wallet Recharge History
                </NavLink>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <NavLink to="/spot-pricing-enquiry" className={navLinkClass}>
          <Box className="w-5 h-5" />
          Spot Pricing Enquiry
        </NavLink>

        <NavLink to="/spot-pricing-list" className={navLinkClass}>
          <Box className="w-5 h-5" />
          Spot Pricing List
        </NavLink>

        <NavLink to="/msme-dhl" className={navLinkClass}>
          <Truck className="w-5 h-5" />
          MSME DHL
        </NavLink>

        <NavLink to="/shipper-invoice" className={navLinkClass}>
          <FileText className="w-5 h-5" />
          Shipper Invoice
        </NavLink>

        <NavLink to="/tracking" className={navLinkClass}>
          <MapPin className="w-5 h-5" />
          Tracking
        </NavLink>

        <NavLink to="/manifest" className={navLinkClass}>
          <ClipboardList className="w-5 h-5" />
          Manifest
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
