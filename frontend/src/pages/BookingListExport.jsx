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
} from "lucide-react";

import { API_BASE_URL } from "../config/api";

export default function BookingListExport() {
  /* ===========================
     1. Date Defaults
  ============================ */
  const getToday = () => new Date().toISOString().split("T")[0];
  const getOneMonthAgo = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  };

  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Filters
  const [fromDate, setFromDate] = useState(getOneMonthAgo());
  const [toDate, setToDate] = useState(getToday());
  const [statusFilter, setStatusFilter] = useState("");

  // Modal State
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const token = localStorage.getItem("token");

  /* ===========================
     2. FETCH SHIPMENTS
  ============================ */
  const fetchShipments = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/api/auth/shipment-list`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      const json = await res.json();

      if (json.statusCode === 200 && Array.isArray(json.data)) {
        setShipments(json.data);
      } else {
        setShipments([]);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setShipments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===========================
     3. FILTER LOGIC
  ============================ */
  const filteredData = shipments.filter((item) => {
    const search = searchTerm.toLowerCase();
    const matchSearch =
      item.booking_id?.toLowerCase().includes(search) ||
      item.vendor_name?.toLowerCase().includes(search) ||
      item.tracking_number?.toLowerCase().includes(search);

    const matchStatus = !statusFilter || item.tracking_status === statusFilter;

    const itemDate = new Date(item.created_at).toISOString().split("T")[0];
    const matchDate = itemDate >= fromDate && itemDate <= toDate;

    return matchSearch && matchStatus && matchDate;
  });

  const handleReset = () => {
    setSearchTerm("");
    setStatusFilter("");
    setFromDate(getOneMonthAgo());
    setToDate(getToday());
  };

  const handleOpenModal = (shipment) => {
    setSelectedShipment(shipment);
    setIsModalOpen(true);
  };

  return (
    <div
      className={`lg:w-[calc(100vw-20rem)] w-[calc(100vw-3rem)] overflow-x-hidden max-w-full overflow-hidden`}
    >
      <div className="bg-white rounded-xl shadow p-4 sm:p-6">
        {/* HEADER & FILTERS */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              Booking List
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
              <option value="CLOSED">CLOSED</option>
              <option value="PENDING">PENDING</option>
            </select>
            <input
              type="text"
              placeholder="Search ID, Vendor, Tracking"
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
                    "VENDOR NAME",
                    "AWB NO.",
                    "SKART AWB NO.",
                    "ORIGIN",
                    "DESTINATION",
                    "SHIPMENT TYPE",
                    "AMOUNT (₹)",
                    "LAST TRACKING STATUS",
                    "AWB LABEL",
                    "ACTION",
                    "CONTACT",
                  ].map((header) => (
                    <th
                      key={header}
                      className="border border-gray-800 px-3 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="15" className="p-10 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <Loader2 className="h-8 w-8 animate-spin mb-2" />
                        <span>Loading Shipments...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan="15"
                      className="text-center py-10 text-gray-500"
                    >
                      No records found within this date range.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, idx) => (
                    <tr
                      key={row.booking_id || idx}
                      className="text-gray-800 hover:bg-gray-50 transition"
                    >
                      <td className="border px-3 sm:px-4 py-3 text-center font-bold left-0 bg-white z-[1] border-gray-200">
                        {idx + 1}.
                      </td>
                      <td className="border px-3 sm:px-4 py-3 text-center border-gray-200 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>
                            {new Date(row.created_at).toLocaleDateString(
                              "en-GB",
                            )}
                          </span>
                          <span className="text-xs text-gray-400 mt-0.5">
                            {new Date(row.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="border px-3 sm:px-4 py-3 text-center font-semibold border-gray-200 whitespace-nowrap">
                        {row.vendor_name || "-"}
                      </td>
                      <td className="border px-3 sm:px-4 py-3 text-center text-yellow-600 font-bold underline border-gray-200 whitespace-nowrap cursor-pointer">
                        {row.tracking_number || "-"}
                      </td>
                      <td className="border px-3 sm:px-4 py-3 text-center font-mono text-xs border-gray-200 whitespace-nowrap">
                        {row.skart_awb || row.booking_id}
                      </td>
                      <td className="border px-3 sm:px-4 py-3 text-center uppercase border-gray-200 whitespace-nowrap">
                        {row.origin_city || "-"}
                      </td>
                      <td className="border px-3 sm:px-4 py-3 text-center uppercase border-gray-200 whitespace-nowrap">
                        {row.destination_city || "-"}
                      </td>
                      <td className="border px-3 sm:px-4 py-3 text-center border-gray-200 whitespace-nowrap">
                        {row.shipment_type || "-"}
                      </td>
                      <td className="border px-3 sm:px-4 py-3 text-right font-bold border-gray-200 whitespace-nowrap">
                        {Number(row.grand_total).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="border px-3 sm:px-4 py-3 text-center border-gray-200 min-w-[200px]">
                        <span className="text-sm font-bold text-gray-700">
                          {row.tracking_status || "Processing"}
                        </span>
                      </td>
                      <td className="border px-3 sm:px-4 py-3 text-center border-gray-200">
                        <button className="text-yellow-600 hover:text-yellow-700 mx-auto">
                          <FileText size={20} />
                        </button>
                      </td>
                      <td className="border px-3 sm:px-4 py-3 text-center border-gray-200">
                        <button
                          onClick={() => handleOpenModal(row)}
                          className="text-yellow-600 hover:text-yellow-700 p-1 rounded-full hover:bg-yellow-50 transition"
                        >
                          <Eye size={20} />
                        </button>
                      </td>
                      <td className="border px-3 sm:px-4 py-3 text-center border-gray-200">
                        <div className="flex items-center justify-center gap-2">
                          <button className="text-yellow-600 hover:text-yellow-700">
                            <Mail size={18} />
                          </button>
                          <button className="text-yellow-600 hover:text-yellow-700">
                            <MessageCircle size={18} />
                          </button>
                        </div>
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
            Showing {filteredData.length} of {shipments.length} Records
          </span>
        </div>
      </div>

      {/* ✅ DETAILS MODAL - UPDATED TABLE STRUCTURE */}
      {isModalOpen && selectedShipment && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-5xl bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between bg-black px-6 py-4 text-white">
              <div>
                <h3 className="text-lg font-bold">Shipment Details</h3>
                <p className="text-xs text-gray-400 mt-1 font-mono">
                  ID: {selectedShipment.booking_id}
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
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="bg-blue-50 p-4 rounded-md border border-blue-100 flex justify-between items-center">
                  <span className="text-blue-800 text-sm font-bold uppercase">
                    Total Charged Weight
                  </span>
                  <span className="font-extrabold text-blue-900 text-xl">
                    {selectedShipment.charged_weight}{" "}
                    <span className="text-sm">kg</span>
                  </span>
                </div>
                <div className="bg-yellow-50 p-4 rounded-md border border-yellow-100 flex justify-between items-center">
                  <span className="text-yellow-800 text-sm font-bold uppercase">
                    Vendor Selected
                  </span>
                  <span className="font-extrabold text-yellow-900 text-lg">
                    {selectedShipment.vendor_name}
                  </span>
                </div>
              </div>

              {/* ✅ 1. Box Dimensions Table */}
              <div className="mb-10">
                <h4 className="flex items-center gap-2 text-sm font-extrabold text-gray-900 uppercase tracking-wide mb-4 pb-2 border-b border-gray-200">
                  <RefreshCcw className="h-4 w-4" /> Box Dimensions & Weights
                </h4>

                {selectedShipment.boxes?.rows?.length > 0 ? (
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
                            Actual Wt (kg)
                          </th>
                          <th className="px-4 py-3 border border-gray-300 text-center">
                            Volumetric Wt (kg)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-300">
                        {selectedShipment.boxes.rows.map((box, i) => {
                          // Calculate Volumetric Weight for display (L*B*H / 5000)
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
                    No box dimension details found for this shipment.
                  </p>
                )}
              </div>

              {/* ✅ 2. Shipment Contents Table (Full Details) */}
              <div>
                <h4 className="flex items-center gap-2 text-sm font-extrabold text-gray-900 uppercase tracking-wide mb-4 pb-2 border-b border-gray-200">
                  <Box className="h-4 w-4" /> Shipment Contents / Invoice
                  Details
                </h4>

                {selectedShipment.goods?.rows?.length > 0 ? (
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
                        {selectedShipment.goods.rows.map((item, i) => (
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
                    No content details found for this shipment.
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
