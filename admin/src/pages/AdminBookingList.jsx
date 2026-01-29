import React, { useEffect, useState } from "react";
import {
  Loader2,
  Search,
  Eye,
  X,
  FileText,
  Mail,
  MessageCircle,
  RefreshCcw,
  Box,
  User,
  Building,
  MapPin,
  Phone,
} from "lucide-react";

import { API_BASE_URL } from "../../config/api";

export default function AdminBookingList() {
  /* ===========================
     1. Date Defaults
  ============================ */
  const getToday = () => new Date().toISOString().split("T")[0];
  const getOneMonthAgo = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  };

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(null);

  // Filters
  const [fromDate, setFromDate] = useState(getOneMonthAgo());
  const [toDate, setToDate] = useState(getToday());
  const [statusFilter, setStatusFilter] = useState("");

  // Modal State
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const token = localStorage.getItem("adminToken");

  /* ===========================
     2. FETCH ALL BOOKINGS (Admin API)
  ============================ */
  const fetchBookings = async () => {
    try {
      setLoading(true);

      // ✅ Calls the populated endpoint
      const res = await fetch(`${API_BASE_URL}/api/admin/all-bookings`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        setBookings(json.data);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===========================
     3. UPDATE STATUS
  ============================ */
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      setUpdatingStatus(id);
      const res = await fetch(
        `${API_BASE_URL}/api/admin/booking/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      const json = await res.json();

      if (json.success) {
        setBookings((prev) =>
          prev.map((b) => (b._id === id ? { ...b, status: newStatus } : b)),
        );
      } else {
        alert("Failed to update status");
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("Error updating status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  /* ===========================
     4. FILTER LOGIC
  ============================ */
  const filteredData = bookings.filter((item) => {
    const search = searchTerm.toLowerCase();

    // ✅ Deep Search into User Object
    const matchSearch =
      item.bookingId?.toLowerCase().includes(search) ||
      item.selectedVendor?.vendorCode?.toLowerCase().includes(search) ||
      item.user?.name?.toLowerCase().includes(search) ||
      item.user?.email?.toLowerCase().includes(search) ||
      item.user?.mobile?.toLowerCase().includes(search) ||
      item.user?.companyName?.toLowerCase().includes(search); // Added Company Search

    const matchStatus = !statusFilter || item.status === statusFilter;

    const itemDate = new Date(item.createdAt).toISOString().split("T")[0];
    const matchDate = itemDate >= fromDate && itemDate <= toDate;

    return matchSearch && matchStatus && matchDate;
  });

  const handleReset = () => {
    setSearchTerm("");
    setStatusFilter("");
    setFromDate(getOneMonthAgo());
    setToDate(getToday());
  };

  const handleOpenModal = (booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="bg-white rounded-xl shadow p-4 sm:p-6">
        {/* HEADER & FILTERS */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span className="bg-yellow-400 text-black text-xs px-2 py-1 rounded">
                ADMIN
              </span>
              All Bookings
            </h2>

            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4 w-full lg:w-auto">
              <button
                onClick={handleReset}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-lg shadow w-full sm:w-auto"
              >
                Reset Filters
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
            >
              <option value="">All Status</option>
              <option value="OPEN">OPEN</option>
              <option value="APPROVED">APPROVED</option>
              <option value="IN_TRANSIT">IN TRANSIT</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
            <input
              type="text"
              placeholder="Search ID, User, Company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="relative rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[1800px] w-full border-collapse text-sm">
              <thead className="bg-black text-white sticky top-0 z-10">
                <tr>
                  {[
                    "SR.NO.",
                    "BOOKING DATE",
                    "USER DETAILS",
                    "VENDOR NAME",
                    "BOOKING ID",
                    "ORIGIN",
                    "DESTINATION",
                    "TYPE",
                    "AMOUNT (₹)",
                    "CURRENT STATUS",
                    "DOCS",
                    "ACTION",
                  ].map((header) => (
                    <th
                      key={header}
                      className="border border-gray-800 px-3 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-left"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="12" className="p-10 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <Loader2 className="h-8 w-8 animate-spin mb-2" />
                        <span>Fetching Data...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan="12"
                      className="text-center py-10 text-gray-500"
                    >
                      No bookings found.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, idx) => (
                    <tr
                      key={row._id || idx}
                      className="text-gray-800 hover:bg-gray-50 transition border-b border-gray-100"
                    >
                      <td className="border px-3 sm:px-4 py-3 text-center font-bold left-0 bg-white z-[1] sticky border-gray-200">
                        {idx + 1}.
                      </td>
                      <td className="border px-3 sm:px-4 py-3 border-gray-200 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {new Date(row.createdAt).toLocaleDateString(
                              "en-GB",
                            )}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(row.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>

                      {/* 3. User Details (Admin Specific) */}
                      <td className="border px-3 sm:px-4 py-3 border-gray-200">
                        <div className="flex flex-col">
                          {/* ✅ If user exists, show name; otherwise show 'Guest' or 'Unknown' */}
                          <span className="font-bold text-sm text-gray-900">
                            {row.user?.name || "Guest / Deleted User"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {row.user?.mobile || "-"}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {row.user?.email || "-"}
                          </span>
                        </div>
                      </td>

                      <td className="border px-3 sm:px-4 py-3 border-gray-200 font-semibold whitespace-nowrap">
                        {row.selectedVendor?.vendorCode || "-"}
                      </td>
                      <td className="border px-3 sm:px-4 py-3 border-gray-200 text-yellow-600 font-bold underline cursor-pointer">
                        {row.bookingId}
                      </td>
                      <td className="border px-3 sm:px-4 py-3 border-gray-200 uppercase whitespace-nowrap">
                        {row.shipment?.originCity || "INDIA"}
                      </td>
                      <td className="border px-3 sm:px-4 py-3 border-gray-200 uppercase whitespace-nowrap">
                        {row.shipment?.destinationCity || "GLOBAL"}
                      </td>
                      <td className="border px-3 sm:px-4 py-3 border-gray-200 whitespace-nowrap">
                        {row.shipment?.nonDocCategory ||
                          row.shipment?.shipmentMainType ||
                          "-"}
                      </td>
                      <td className="border px-3 sm:px-4 py-3 border-gray-200 text-right font-bold whitespace-nowrap">
                        {Number(
                          row.selectedVendor?.totalPrice || 0,
                        ).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="border px-3 sm:px-4 py-3 border-gray-200 text-center">
                        <select
                          disabled={updatingStatus === row._id}
                          value={row.status || "OPEN"}
                          onChange={(e) =>
                            handleStatusUpdate(row._id, e.target.value)
                          }
                          className={`text-xs font-bold px-2 py-1 rounded border outline-none cursor-pointer ${
                            row.status === "APPROVED"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : row.status === "CANCELLED"
                                ? "bg-red-100 text-red-700 border-red-200"
                                : "bg-yellow-50 text-yellow-700 border-yellow-200"
                          }`}
                        >
                          <option value="OPEN">OPEN</option>
                          <option value="APPROVED">APPROVED</option>
                          <option value="IN_TRANSIT">IN TRANSIT</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                        {updatingStatus === row._id && (
                          <div className="text-[9px] text-gray-400 mt-1">
                            Updating...
                          </div>
                        )}
                      </td>
                      <td className="border px-3 sm:px-4 py-3 text-center border-gray-200">
                        {row.documents && row.documents.length > 0 ? (
                          <button
                            className="text-blue-600 hover:text-blue-800 mx-auto"
                            onClick={() => handleOpenModal(row)}
                          >
                            <FileText size={20} />
                          </button>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="border px-3 sm:px-4 py-3 text-center border-gray-200">
                        <button
                          onClick={() => handleOpenModal(row)}
                          className="text-yellow-600 hover:text-yellow-700 p-1 rounded-full hover:bg-yellow-50 transition"
                        >
                          <Eye size={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4 text-gray-600 text-sm">
          <span>
            Showing {filteredData.length} of {bookings.length} Bookings
          </span>
        </div>
      </div>

      {/* ✅ ADMIN DETAILS MODAL */}
      {isModalOpen && selectedBooking && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-6xl bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between bg-black px-6 py-4 text-white">
              <div>
                <h3 className="text-lg font-bold">
                  Booking Details (Admin View)
                </h3>
                <p className="text-xs text-gray-400 mt-1 font-mono">
                  ID: {selectedBooking.bookingId}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md hover:bg-white/20 transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              {/* ✅ 1. Detailed User & Shipment Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {/* User Card */}
                <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                  <h4 className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase mb-2">
                    <User className="h-4 w-4" /> Account Details
                  </h4>
                  <p className="font-bold text-gray-900">
                    {selectedBooking.user?.name || "Guest"}
                  </p>
                  <p className="text-sm text-gray-700 flex items-center gap-1 mt-1">
                    <Building className="h-3 w-3" />{" "}
                    {selectedBooking.user?.companyName || "N/A"}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <Mail className="h-3 w-3" /> {selectedBooking.user?.email}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <Phone className="h-3 w-3" /> {selectedBooking.user?.mobile}
                  </p>
                </div>

                {/* Sender Info */}
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Sender
                  </h4>
                  <p className="font-bold text-gray-900">
                    {selectedBooking.addresses?.sender?.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {selectedBooking.addresses?.sender?.companyName}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    {selectedBooking.addresses?.sender?.addressLine1},{" "}
                    {selectedBooking.addresses?.sender?.city}
                  </p>
                  <p className="text-xs text-gray-600 font-semibold mt-1">
                    IEC: {selectedBooking.addresses?.sender?.iecNo || "N/A"}
                  </p>
                </div>

                {/* Receiver Info */}
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Receiver
                  </h4>
                  <p className="font-bold text-gray-900">
                    {selectedBooking.addresses?.receiver?.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {selectedBooking.addresses?.receiver?.companyName}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    {selectedBooking.addresses?.receiver?.addressLine1},{" "}
                    {selectedBooking.addresses?.receiver?.city}
                  </p>
                  <p className="text-xs text-gray-600 font-semibold mt-1">
                    Country: {selectedBooking.addresses?.receiver?.country}
                  </p>
                </div>

                {/* Status/Cost Info */}
                <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-yellow-700 uppercase mb-2">
                      Total Amount
                    </h4>
                    <p className="text-2xl font-extrabold text-yellow-900">
                      ₹
                      {Number(
                        selectedBooking.selectedVendor?.totalPrice || 0,
                      ).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-yellow-700 uppercase mb-1">
                      Status
                    </h4>
                    <span className="bg-yellow-200 text-yellow-900 px-2 py-1 rounded text-xs font-bold uppercase">
                      {selectedBooking.status || "OPEN"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Box Dimensions Table */}
              <div className="mb-10">
                <h4 className="flex items-center gap-2 text-sm font-extrabold text-gray-900 uppercase tracking-wide mb-4 pb-2 border-b border-gray-200">
                  <RefreshCcw className="h-4 w-4" /> Box Dimensions
                </h4>

                {selectedBooking.boxes?.rows?.length > 0 ? (
                  <div className="overflow-hidden border border-gray-300 rounded-md">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead className="bg-gray-100 text-xs uppercase font-bold text-gray-700">
                        <tr>
                          <th className="px-4 py-3 border border-gray-300 w-16 text-center">
                            #
                          </th>
                          <th className="px-4 py-3 border border-gray-300 text-center">
                            Qty
                          </th>
                          <th className="px-4 py-3 border border-gray-300 text-center">
                            Length (cm)
                          </th>
                          <th className="px-4 py-3 border border-gray-300 text-center">
                            Breadth (cm)
                          </th>
                          <th className="px-4 py-3 border border-gray-300 text-center">
                            Height (cm)
                          </th>
                          <th className="px-4 py-3 border border-gray-300 text-center">
                            Weight (kg)
                          </th>
                          <th className="px-4 py-3 border border-gray-300 text-center">
                            Volumetric Wt
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-300">
                        {selectedBooking.boxes.rows.map((box, i) => {
                          const volWt = (
                            (box.length * box.breadth * box.height) /
                            5000
                          ).toFixed(2);
                          return (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-4 py-2 border border-gray-300 font-bold text-center">
                                {i + 1}
                              </td>
                              <td className="px-4 py-2 border border-gray-300 text-center">
                                {box.qty}
                              </td>
                              <td className="px-4 py-2 border border-gray-300 text-center">
                                {box.length}
                              </td>
                              <td className="px-4 py-2 border border-gray-300 text-center">
                                {box.breadth}
                              </td>
                              <td className="px-4 py-2 border border-gray-300 text-center">
                                {box.height}
                              </td>
                              <td className="px-4 py-2 border border-gray-300 text-center font-bold">
                                {box.weight}
                              </td>
                              <td className="px-4 py-2 border border-gray-300 text-center text-gray-500">
                                {volWt}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded border border-dashed border-gray-300 text-center">
                    No box dimension details found.
                  </p>
                )}
              </div>

              {/* 3. Shipment Contents Table */}
              <div className="mb-10">
                <h4 className="flex items-center gap-2 text-sm font-extrabold text-gray-900 uppercase tracking-wide mb-4 pb-2 border-b border-gray-200">
                  <Box className="h-4 w-4" /> Shipment Contents
                </h4>

                {selectedBooking.goods?.rows?.length > 0 ? (
                  <div className="overflow-hidden border border-gray-300 rounded-md">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead className="bg-gray-100 text-xs uppercase font-bold text-gray-700">
                        <tr>
                          <th className="px-4 py-3 border border-gray-300 w-16 text-center">
                            #
                          </th>
                          <th className="px-4 py-3 border border-gray-300">
                            Description
                          </th>
                          <th className="px-4 py-3 border border-gray-300 text-center">
                            HSN Code
                          </th>
                          <th className="px-4 py-3 border border-gray-300 text-center">
                            Unit
                          </th>
                          <th className="px-4 py-3 border border-gray-300 text-center">
                            Qty
                          </th>
                          <th className="px-4 py-3 border border-gray-300 text-right">
                            Rate (₹)
                          </th>
                          <th className="px-4 py-3 border border-gray-300 text-right">
                            Amount (₹)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-300">
                        {selectedBooking.goods.rows.map((item, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-2 border border-gray-300 text-center font-bold">
                              {i + 1}
                            </td>
                            <td className="px-4 py-2 border border-gray-300 font-medium text-gray-900">
                              {item.description || "-"}
                            </td>
                            <td className="px-4 py-2 border border-gray-300 text-center font-mono text-xs">
                              {item.hsnCode || "-"}
                            </td>
                            <td className="px-4 py-2 border border-gray-300 text-center text-xs bg-gray-50">
                              {item.unit || "PCS"}
                            </td>
                            <td className="px-4 py-2 border border-gray-300 text-center font-bold">
                              {item.qty || 0}
                            </td>
                            <td className="px-4 py-2 border border-gray-300 text-right text-gray-600">
                              {item.rate
                                ? Number(item.rate).toFixed(2)
                                : "0.00"}
                            </td>
                            <td className="px-4 py-2 border border-gray-300 text-right font-bold text-gray-900">
                              {item.amount
                                ? Number(item.amount).toFixed(2)
                                : "0.00"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded border border-dashed border-gray-300 text-center">
                    No content details found.
                  </p>
                )}
              </div>

              {/* 4. Uploaded Documents */}
              <div>
                <h4 className="flex items-center gap-2 text-sm font-extrabold text-gray-900 uppercase tracking-wide mb-4 pb-2 border-b border-gray-200">
                  <FileText className="h-4 w-4" /> Uploaded Documents
                </h4>

                {selectedBooking.documents &&
                selectedBooking.documents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedBooking.documents.map((doc, i) => (
                      <a
                        key={i}
                        href={`${API_BASE_URL}/${doc.serverPath}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-200 transition group"
                      >
                        <div className="bg-white p-2 rounded border border-gray-100 group-hover:border-blue-100">
                          <FileText className="h-5 w-5 text-gray-500 group-hover:text-blue-600" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-gray-800 truncate">
                            {doc.type || "Document"}
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-[150px]">
                            {doc.fileName}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    No documents uploaded.
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-200">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-black text-white text-sm font-bold rounded hover:bg-gray-800 transition shadow-sm"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
