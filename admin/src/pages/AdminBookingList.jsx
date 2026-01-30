import React, { useEffect, useState } from "react";
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
  Download,
  X,
  Paperclip,
  Printer,
  Scale,
  CreditCard,
  Globe,
  Package,
  Box,
  User,
  Building2,
  Phone,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";

export default function AdminBookingList() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [priceBreakupItem, setPriceBreakupItem] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const token = localStorage.getItem("adminToken");

  // 1. FETCH ALL BOOKINGS (Admin)
  const fetchShipments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/admin/all-bookings`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();

      // Admin response usually returns { success: true, data: [...] }
      if (json.success || json.statusCode === 200) {
        setShipments(json.data);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. UPDATE STATUS (Admin Feature)
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      setUpdatingStatus(id);
      const res = await fetch(
        `${API_BASE_URL}/api/admin/booking/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );
      const json = await res.json();
      if (json.success) {
        // Update UI locally
        setShipments((prev) =>
          prev.map((item) =>
            item.bookingId === id ? { ...item, status: newStatus } : item,
          ),
        );
      }
    } catch (error) {
      console.error("Status update failed:", error);
      alert("Failed to update status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleDownload = async (filePath, fileName) => {
    try {
      const fileUrl = `${API_BASE_URL}/${filePath}`;
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || "document";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download. File might not exist on server.");
    }
  };

  // Filter Logic (Includes User Name/Company search)
  const filteredData = shipments.filter((item) => {
    const search = searchTerm.toLowerCase();

    // Safety check for user object if not populated
    const userName = item.user?.name || "";
    const userCompany = item.user?.companyName || "";

    return (
      item.bookingId?.toLowerCase().includes(search) ||
      item.selectedVendor?.vendorCode?.toLowerCase().includes(search) ||
      userName.toLowerCase().includes(search) ||
      userCompany.toLowerCase().includes(search) ||
      item.status?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="p-6 bg-gray-100 min-h-screen w-full">
      <div className="max-w-[1920px] mx-auto">
        {/* HEADER & FILTERS */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
              <Building2 className="text-blue-700" /> Admin Portal
            </h1>
            <p className="text-sm text-gray-500">
              Manage all customer export bookings
            </p>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search ID, User, Company..."
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none w-72 shadow-sm"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white shadow-sm outline-none cursor-pointer"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="DISPATCHED">Dispatched</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* MAIN TABLE */}
        <div className="bg-white rounded-xl border border-gray-300 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-gray-800 text-white font-bold uppercase text-[11px] tracking-wider border-b border-gray-300">
                <tr>
                  <th className="px-6 py-4 border-gray-700 w-16 text-center">
                    #
                  </th>
                  <th className="px-6 py-4 border-gray-700">Date & Time</th>
                  {/* NEW ADMIN COLUMN: USER */}
                  <th className="px-6 py-4 border-gray-700">Customer</th>
                  <th className="px-6 py-4 border-gray-700">Booking ID</th>
                  <th className="px-6 py-4 border-gray-700">Vendor</th>
                  <th className="px-6 py-4 border-gray-700">Destination</th>
                  <th className="px-6 py-4 border-gray-700 text-right">
                    Weight
                  </th>
                  <th className="px-6 py-4 border-gray-700 text-right">
                    Total
                  </th>
                  <th className="px-6 py-4 border-gray-700 text-center">
                    Admin Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="10" className="p-10 text-center text-gray-500">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading Data...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan="10"
                      className="p-10 text-center text-gray-500 italic"
                    >
                      No records found.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, idx) => (
                    <React.Fragment key={item._id}>
                      {/* OUTER ROW */}
                      <tr
                        className={`hover:bg-blue-50/50 transition-colors cursor-pointer group ${
                          expandedRow === item._id
                            ? "bg-blue-50/30"
                            : "bg-white"
                        }`}
                        onClick={() => toggleRow(item._id)}
                      >
                        <td className="px-6 py-4 text-center font-bold text-gray-400 border-r border-gray-100">
                          {idx + 1}
                        </td>

                        <td className="px-6 py-4 border-r border-gray-100">
                          <div className="font-bold text-gray-900">
                            {new Date(item.createdAt).toLocaleDateString(
                              "en-GB",
                            )}
                          </div>
                          <div className="text-xs text-gray-400 font-mono mt-0.5">
                            {new Date(item.createdAt).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                                hour12: true,
                              },
                            )}
                          </div>
                        </td>

                        {/* USER INFO COLUMN */}
                        <td className="px-6 py-4 border-r border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                              {item.user?.name ? (
                                item.user.name.charAt(0).toUpperCase()
                              ) : (
                                <User size={14} />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-xs uppercase leading-tight">
                                {item.user?.companyName || "N/A"}
                              </p>
                              <p className="text-[10px] text-gray-500">
                                {item.user?.name || "Unknown User"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 font-mono font-bold text-blue-600 border-r border-gray-100">
                          {item.bookingId}
                        </td>

                        <td className="px-6 py-4 font-bold text-gray-800 uppercase border-r border-gray-100">
                          {item.selectedVendor?.vendorCode || "N/A"}
                        </td>

                        <td className="px-6 py-4 font-medium text-gray-700 uppercase border-r border-gray-100">
                          {item.shipment?.destinationCity},{" "}
                          {item.shipment?.destinationCountry}
                        </td>

                        <td className="px-6 py-4 text-right font-bold text-gray-800 border-r border-gray-100">
                          {item.weights?.chargeableWeight} KG
                        </td>

                        <td className="px-6 py-4 text-right font-black text-gray-900 border-r border-gray-100">
                          ₹
                          {Number(
                            item.selectedVendor?.totalPrice,
                          ).toLocaleString()}
                        </td>

                        {/* ADMIN STATUS CHANGE */}
                        <td
                          className="px-6 py-4 text-center border-r border-gray-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="relative">
                            <select
                              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border outline-none cursor-pointer appearance-none pl-3 pr-8 ${
                                item.status === "APPROVED"
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : item.status === "PENDING"
                                    ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                    : item.status === "CANCELLED"
                                      ? "bg-red-100 text-red-700 border-red-200"
                                      : "bg-gray-100 text-gray-600 border-gray-200"
                              }`}
                              value={item.status}
                              onChange={(e) =>
                                handleStatusUpdate(
                                  item.bookingId,
                                  e.target.value,
                                )
                              }
                              disabled={updatingStatus === item.bookingId}
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="APPROVED">APPROVED</option>
                              <option value="DISPATCHED">DISPATCHED</option>
                              <option value="DELIVERED">DELIVERED</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                            {updatingStatus === item.bookingId && (
                              <div className="absolute right-2 top-1.5">
                                <Loader2 className="h-3 w-3 animate-spin text-gray-500" />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* EXPANDED DETAILS */}
                      {expandedRow === item._id && (
                        <tr>
                          <td
                            colSpan="10"
                            className="bg-gray-50 p-6 border-y border-gray-200 shadow-inner"
                          >
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                              {/* 1. ADMIN OVERVIEW CARDS */}
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                {/* USER INFO CARD */}
                                <div className="bg-white p-4 rounded-xl border-l-4 border-l-blue-600 border border-gray-200 shadow-sm">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">
                                        Booked By
                                      </p>
                                      <p className="font-black text-gray-900 text-sm uppercase">
                                        {item.user?.companyName || "N/A"}
                                      </p>
                                      <p className="text-xs font-bold text-gray-600">
                                        {item.user?.name}
                                      </p>
                                    </div>
                                    <User size={20} className="text-blue-100" />
                                  </div>
                                  <div className="mt-3 space-y-1">
                                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                      <Mail size={12} />{" "}
                                      {item.user?.email || "No Email"}
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                      <Phone size={12} />{" "}
                                      {item.user?.mobile || "No Mobile"}
                                    </div>
                                  </div>
                                </div>

                                {/* WEIGHT CARD */}
                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                                  <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">
                                      Chargeable Weight
                                    </p>
                                    <p className="text-2xl font-black text-gray-900">
                                      {item.weights?.chargeableWeight}{" "}
                                      <span className="text-sm text-gray-500">
                                        KG
                                      </span>
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-1">
                                      Vol:{" "}
                                      {Number(
                                        item.weights?.volumetricWeight,
                                      ).toFixed(2)}{" "}
                                      | Act: {item.weights?.actualWeight}
                                    </p>
                                  </div>
                                  <Scale className="text-gray-200" size={32} />
                                </div>

                                {/* PRICE CARD */}
                                <div
                                  className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 shadow-sm flex items-center justify-between cursor-pointer hover:bg-yellow-100 transition"
                                  onClick={() => setPriceBreakupItem(item)}
                                >
                                  <div>
                                    <p className="text-[10px] text-yellow-800 font-bold uppercase mb-1">
                                      Total Amount
                                    </p>
                                    <p className="text-2xl font-black text-gray-900">
                                      ₹
                                      {Number(
                                        item.selectedVendor?.totalPrice,
                                      ).toLocaleString()}
                                    </p>
                                    <p className="text-[9px] text-blue-600 underline">
                                      View Breakup
                                    </p>
                                  </div>
                                  <CreditCard
                                    className="text-yellow-600 opacity-30"
                                    size={32}
                                  />
                                </div>

                                {/* SERVICE CARD */}
                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-500">
                                      Service:
                                    </span>
                                    <span className="font-bold">
                                      {item.shipment?.shipmentMainType}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">
                                      Category:
                                    </span>
                                    <span className="font-bold">
                                      {item.shipment?.nonDocCategory}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-xs mt-1">
                                    <span className="text-gray-500">
                                      Total Boxes:
                                    </span>
                                    <span className="font-bold">
                                      {item.boxes?.rows?.length || 0}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* 2. SENDER & RECEIVER INFO */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                {/* Sender */}
                                <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
                                  <div className="bg-blue-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                                    <h4 className="font-bold text-blue-800 text-xs uppercase">
                                      Sender Information
                                    </h4>
                                    <span className="text-[10px] text-blue-600 font-mono bg-blue-100 px-2 rounded">
                                      Origin: {item.shipment?.originCity} (
                                      {item.shipment?.originPincode})
                                    </span>
                                  </div>
                                  <div className="p-4 grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                    <div className="col-span-2 sm:col-span-1">
                                      <p className="text-[10px] text-gray-400 font-bold uppercase">
                                        Company / Name
                                      </p>
                                      <p className="font-bold text-gray-900">
                                        {item.addresses?.sender?.companyName ||
                                          item.addresses?.sender?.name}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-gray-400 font-bold uppercase">
                                        Contact Info
                                      </p>
                                      <p className="text-gray-600 text-xs">
                                        {item.addresses?.sender?.contactNumber}
                                      </p>
                                      <p
                                        className="text-gray-600 text-xs truncate"
                                        title={item.addresses?.sender?.email}
                                      >
                                        {item.addresses?.sender?.email}
                                      </p>
                                    </div>
                                    <div className="col-span-2">
                                      <p className="text-[10px] text-gray-400 font-bold uppercase">
                                        Address
                                      </p>
                                      <p className="text-gray-600 text-xs leading-relaxed">
                                        {item.addresses?.sender?.addressLine1}{" "}
                                        {item.addresses?.sender?.addressLine2}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-gray-400 font-bold uppercase">
                                        Tax / IEC
                                      </p>
                                      <p className="text-gray-700 font-mono text-xs">
                                        {item.addresses?.sender?.iecNo || "N/A"}{" "}
                                        <span className="text-gray-300">|</span>{" "}
                                        {item.addresses?.sender?.kycNo}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-gray-400 font-bold uppercase">
                                        Tax Payment
                                      </p>
                                      <p className="text-gray-700 font-mono text-xs">
                                        {item.addresses?.sender
                                          ?.taxPaymentOption || "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-gray-400 font-bold uppercase">
                                        Document
                                      </p>
                                      <p className="text-gray-700 font-mono text-xs">
                                        {item.addresses?.sender?.documentType}:{" "}
                                        {item.addresses?.sender?.documentNumber}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Receiver */}
                                <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
                                  <div className="bg-green-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                                    <h4 className="font-bold text-green-800 text-xs uppercase">
                                      Receiver Information
                                    </h4>
                                    <span className="text-[10px] text-green-600 font-mono bg-green-100 px-2 rounded">
                                      Dest: {item.shipment?.destinationCity} (
                                      {item.shipment?.destinationZip})
                                    </span>
                                  </div>
                                  <div className="p-4 grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                    <div className="col-span-2 sm:col-span-1">
                                      <p className="text-[10px] text-gray-400 font-bold uppercase">
                                        Company / Name
                                      </p>
                                      <p className="font-bold text-gray-900">
                                        {item.addresses?.receiver
                                          ?.companyName ||
                                          item.addresses?.receiver?.name}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-gray-400 font-bold uppercase">
                                        Contact Info
                                      </p>
                                      <p className="text-gray-600 text-xs">
                                        {
                                          item.addresses?.receiver
                                            ?.contactNumber
                                        }
                                      </p>
                                      <p
                                        className="text-gray-600 text-xs truncate"
                                        title={item.addresses?.receiver?.email}
                                      >
                                        {item.addresses?.receiver?.email}
                                      </p>
                                    </div>
                                    <div className="col-span-2">
                                      <p className="text-[10px] text-gray-400 font-bold uppercase">
                                        Address
                                      </p>
                                      <p className="text-gray-600 text-xs leading-relaxed">
                                        {item.addresses?.receiver?.addressLine1}{" "}
                                        {item.addresses?.receiver?.addressLine2}
                                        ,{item.addresses?.receiver?.city},{" "}
                                        {item.addresses?.receiver?.state}
                                        <br />
                                        <span className="font-bold text-black">
                                          {item.addresses?.receiver?.country}
                                        </span>{" "}
                                        - {item.addresses?.receiver?.zipCode}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-gray-400 font-bold uppercase">
                                        Tax / ID Type
                                      </p>
                                      <p className="text-gray-700 font-mono text-xs">
                                        {item.addresses?.receiver?.idType} -{" "}
                                        {item.addresses?.receiver?.idNumber}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-gray-400 font-bold uppercase">
                                        Auth Doc
                                      </p>
                                      <p className="text-gray-700 font-mono text-xs">
                                        {item.addresses?.receiver?.documentType}
                                        :{" "}
                                        {
                                          item.addresses?.receiver
                                            ?.documentNumber
                                        }
                                      </p>
                                    </div>
                                    <div className="col-span-2">
                                      <p className="text-[10px] text-gray-400 font-bold uppercase">
                                        Delivery Instructions
                                      </p>
                                      <p className="text-gray-600 text-xs italic bg-gray-50 p-1 rounded">
                                        {item.addresses?.receiver
                                          ?.deliveryInstructions ||
                                          "None provided"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* 3. EXPORT & COMMERCIAL DETAILS */}
                              <div className="bg-white border border-gray-300 rounded-lg mb-6 overflow-hidden">
                                <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
                                  <h5 className="font-bold text-gray-800 text-xs uppercase flex items-center gap-2">
                                    <Globe size={14} /> Export & Commercial
                                    Details
                                  </h5>
                                </div>
                                <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                  <div>
                                    <p className="text-[9px] text-gray-400 uppercase font-bold">
                                      Invoice Number
                                    </p>
                                    <p className="text-xs font-medium">
                                      {item.exportDetails?.invoiceNumber ||
                                        "N/A"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] text-gray-400 uppercase font-bold">
                                      Invoice Date
                                    </p>
                                    <p className="text-xs font-medium">
                                      {item.exportDetails?.invoiceDate || "N/A"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] text-gray-400 uppercase font-bold">
                                      Incoterms
                                    </p>
                                    <p className="text-xs font-medium">
                                      {item.exportDetails?.termsOfInvoice ||
                                        "N/A"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] text-gray-400 uppercase font-bold">
                                      Reference No
                                    </p>
                                    <p className="text-xs font-medium">
                                      {item.exportDetails?.referenceNumber ||
                                        "N/A"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] text-gray-400 uppercase font-bold">
                                      Export Reason
                                    </p>
                                    <p className="text-xs font-medium">
                                      {item.exportDetails?.exportReason ||
                                        "N/A"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] text-gray-400 uppercase font-bold">
                                      Bank AD Code
                                    </p>
                                    <p className="text-xs font-medium">
                                      {item.exportDetails?.bankADCode || "-"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] text-gray-400 uppercase font-bold">
                                      LUT Number
                                    </p>
                                    <p className="text-xs font-medium">
                                      {item.exportDetails?.lutNumber || "N/A"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] text-gray-400 uppercase font-bold">
                                      LUT Issue Date
                                    </p>
                                    <p className="text-xs font-medium">
                                      {item.exportDetails?.lutIssueDate || "-"}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* 4. GOODS, BOXES & DOCUMENTS */}
                              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                                {/* Goods & Boxes Tables */}
                                <div className="xl:col-span-2 border border-gray-300 rounded-lg overflow-hidden bg-white">
                                  <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex justify-between">
                                    <span className="text-xs font-bold uppercase text-gray-700 flex items-center gap-2">
                                      <Package size={14} /> Itemized Goods
                                      Details
                                    </span>
                                    <span className="text-xs font-bold uppercase text-gray-700 flex items-center gap-2">
                                      <Box size={14} /> Box Dimensions
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-300">
                                    {/* Goods Table */}
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-xs text-left">
                                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase border-b border-gray-200">
                                          <tr>
                                            <th className="px-3 py-2 text-center">
                                              Box
                                            </th>
                                            <th className="px-3 py-2">Desc</th>
                                            <th className="px-3 py-2 text-center">
                                              HSN
                                            </th>
                                            <th className="px-3 py-2 text-center">
                                              Qty
                                            </th>
                                            <th className="px-3 py-2 text-right">
                                              Amt
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                          {item.goods?.rows?.map((g, i) => (
                                            <tr key={i}>
                                              <td className="px-3 py-2 text-center font-bold text-blue-600">
                                                {g.boxNo || 1}
                                              </td>
                                              <td
                                                className="px-3 py-2 font-medium truncate max-w-[100px]"
                                                title={g.description}
                                              >
                                                {g.description}
                                              </td>
                                              <td className="px-3 py-2 text-center font-mono text-gray-500">
                                                {g.hsnCode}
                                              </td>
                                              <td className="px-3 py-2 text-center">
                                                {g.qty} {g.unit}
                                              </td>
                                              <td className="px-3 py-2 text-right font-bold">
                                                ₹{g.amount}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>

                                    {/* Boxes Table */}
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-xs text-left">
                                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase border-b border-gray-200">
                                          <tr>
                                            <th className="px-3 py-2 text-center">
                                              #
                                            </th>
                                            <th className="px-3 py-2 text-center">
                                              L x B x H
                                            </th>
                                            <th className="px-3 py-2 text-center">
                                              Act. Wt
                                            </th>
                                            <th className="px-3 py-2 text-center">
                                              Vol. Wt
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                          {item.boxes?.rows?.map((b, i) => (
                                            <tr key={i}>
                                              <td className="px-3 py-2 text-center font-bold text-gray-400">
                                                {i + 1}
                                              </td>
                                              <td className="px-3 py-2 text-center">
                                                {b.length} x {b.breadth} x{" "}
                                                {b.height}
                                              </td>
                                              <td className="px-3 py-2 text-center font-bold">
                                                {b.weight} kg
                                              </td>
                                              <td className="px-3 py-2 text-center text-gray-400">
                                                {(
                                                  (b.length *
                                                    b.breadth *
                                                    b.height) /
                                                  5000
                                                ).toFixed(2)}{" "}
                                                kg
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </div>

                                {/* Documents & Actions */}
                                <div className="flex flex-col gap-4">
                                  <div className="bg-white border border-gray-300 rounded-lg p-4 flex-1">
                                    <h5 className="font-bold text-gray-800 text-xs uppercase mb-3 border-b pb-2 flex items-center gap-2">
                                      <Paperclip size={14} /> Uploaded Documents
                                    </h5>
                                    {item.documents &&
                                    item.documents.length > 0 ? (
                                      <ul className="space-y-2">
                                        {item.documents.map((doc, i) => (
                                          <li
                                            key={i}
                                            className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded border border-gray-100 text-xs"
                                          >
                                            <div className="flex items-center gap-2 overflow-hidden">
                                              <FileText
                                                size={12}
                                                className="text-blue-500 flex-shrink-0"
                                              />
                                              <a
                                                href={`${API_BASE_URL}/${doc.filePath}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="truncate max-w-[150px] hover:text-blue-600 hover:underline cursor-pointer"
                                              >
                                                {doc.fileName}
                                              </a>
                                            </div>
                                            <button
                                              className="text-gray-400 hover:text-black"
                                              onClick={() =>
                                                handleDownload(
                                                  doc.filePath,
                                                  doc.fileName,
                                                )
                                              }
                                              title="Download"
                                            >
                                              <Download size={14} />
                                            </button>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p className="text-xs text-gray-400 italic py-2">
                                        No documents.
                                      </p>
                                    )}
                                  </div>

                                  <button className="w-full flex items-center justify-center gap-2 text-xs font-bold bg-black text-white px-4 py-3 rounded hover:bg-gray-800 transition">
                                    <Printer size={14} /> Print AWB Label
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PRICE BREAKUP MODAL */}
      {priceBreakupItem && (
        <div
          className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPriceBreakupItem(null)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-yellow-400 p-4 flex justify-between items-center">
              <h3 className="font-black text-lg text-black uppercase">
                Price Breakdown
              </h3>
              <button
                onClick={() => setPriceBreakupItem(null)}
                className="p-1 hover:bg-white/20 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {priceBreakupItem.selectedVendor?.breakup?.map(
                (charge, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600 uppercase text-xs font-bold">
                      {charge.label}
                    </span>
                    <span className="font-bold">
                      ₹{Number(charge.amount).toLocaleString()}
                    </span>
                  </div>
                ),
              )}
              <div className="border-t border-dashed border-gray-300 my-2"></div>
              <div className="flex justify-between text-lg font-black text-black">
                <span>Grand Total</span>
                <span>
                  ₹
                  {Number(
                    priceBreakupItem.selectedVendor?.totalPrice || 0,
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
