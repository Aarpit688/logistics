import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Settings, ShieldCheck } from "lucide-react";

const AdminSidebar = () => {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2 rounded-md transition ${
      isActive
        ? "bg-gray-200 font-semibold text-black"
        : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <aside className="w-64 bg-white border-r min-h-screen">
      <div className="h-16 flex items-center px-6 border-b font-bold text-lg">
        ADMIN PANEL
      </div>

      <nav className="p-4 space-y-2">
        <NavLink to="/admin/dashboard" className={linkClass}>
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </NavLink>

        <NavLink to="/admin/fuel-surcharge" className={linkClass}>
          <Users className="w-5 h-5" />
          Fuel Surcharge
        </NavLink>

        <NavLink to="/admin/msme" className={linkClass}>
          <Users className="w-5 h-5" />
          MSME
        </NavLink>

        <NavLink to="/admin/country-zones" className={linkClass}>
          <Users className="w-5 h-5" />
          Country Zones
        </NavLink>

        <NavLink to="/admin/settings" className={linkClass}>
          <Settings className="w-5 h-5" />
          Settings
        </NavLink>

        <div className="mt-6 flex items-center gap-3 px-4 text-xs text-gray-400">
          <ShieldCheck className="w-4 h-4" />
          Secure Admin Access
        </div>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
