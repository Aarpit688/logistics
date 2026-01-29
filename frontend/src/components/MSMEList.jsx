import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import MSMERegistration from "./MSMERegistration";
import { FileText } from "lucide-react";
import { API_BASE_URL } from "../config/api";

const MSMEList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchMobile, setSearchMobile] = useState("");
  const [showRegistration, setShowRegistration] = useState(false);

  const token = localStorage.getItem("token");

  /* ===========================
     FETCH USER MSMEs
  ============================ */
  const fetchMsmes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/msme`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch MSMEs");

      const result = await res.json();

      const formatted = result.map((item, index) => ({
        sr: index + 1,
        msmeId: item._id,
        company: item.companyName,
        contact: item.contactPerson,
        mobile: item.mobile,
        email: item.email,
        address: `${item.address1}, ${item.address2}`,
        city: item.city,
        state: item.state,
        pincode: item.pincode,
        gstin: item.gstin,
        iec: item.iec,
        pan: item.pan,
        status: item.status,
        documents: item.documents || {},
      }));

      setData(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMsmes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===========================
     SEARCH + RESET
  ============================ */
  const filteredData = data.filter((row) => row.mobile.includes(searchMobile));

  const handleReset = () => {
    setSearchMobile("");
  };

  /* ===========================
     DOWNLOAD
  ============================ */
  const handleDownload = () => {
    if (filteredData.length === 0) {
      alert("No data to download");
      return;
    }

    const exportData = filteredData.map((row) => ({
      "SR No": row.sr,
      "Company Name": row.company,
      "Contact Person": row.contact,
      "Mobile Number": row.mobile,
      Email: row.email,
      Address: row.address,
      City: row.city,
      State: row.state,
      Pincode: row.pincode,
      GSTIN: row.gstin,
      IEC: row.iec,
      PAN: row.pan,
      Status: row.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "MSME List");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    saveAs(
      new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "MSME_List.xlsx",
    );
  };

  /* ===========================
     REGISTRATION VIEW
  ============================ */
  if (showRegistration) {
    return (
      <MSMERegistration
        onBack={() => {
          setShowRegistration(false);
          fetchMsmes(); // refresh list after submit
        }}
      />
    );
  }

  if (loading) {
    return <p className="p-6">Loading MSMEs…</p>;
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="bg-white rounded-xl shadow p-4 sm:p-6">
        {/* HEADER */}
        <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            MSME List
          </h2>

          {/* HEADER ACTIONS (Responsive) */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4 w-full lg:w-auto">
            <button
              onClick={() => setShowRegistration(true)}
              className="bg-yellow-400 hover:bg-yellow-500 text-white font-semibold px-5 py-2 rounded-lg shadow w-full sm:w-auto"
            >
              + Registration
            </button>

            <button
              onClick={handleDownload}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold px-5 py-2 rounded-lg shadow w-full sm:w-auto"
            >
              Download
            </button>

            <input
              type="text"
              placeholder="Enter Mobile No."
              value={searchMobile}
              onChange={(e) => setSearchMobile(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />

            <button
              onClick={handleReset}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-lg shadow w-full sm:w-auto"
            >
              RESET
            </button>
          </div>
        </div>

        {/* TABLE (Responsive + sticky header + sticky first column) */}
        <div className="relative rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full border-collapse text-sm">
              <thead className="bg-black text-white sticky top-0 z-10">
                <tr>
                  {[
                    "SR.NO.",
                    "COMPANY NAME",
                    "CONTACT PERSON",
                    "MOBILE NUMBER",
                    "EMAIL",
                    "ADDRESS",
                    "CITY",
                    "STATE",
                    "PINCODE",
                    "GSTIN NUMBER",
                    "IEC CODE",
                    "PAN NUMBER",
                    "AUTHORISATION LETTER",
                    "STATUS",
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
                {filteredData.length > 0 ? (
                  filteredData.map((row) => (
                    <tr
                      key={row.msmeId}
                      className="text-gray-800 hover:bg-gray-50 transition"
                    >
                      {/* Sticky SR.NO */}
                      <td className="border px-3 sm:px-4 py-3 text-center font-bold left-0 bg-white z-[1]">
                        {row.sr}.
                      </td>

                      <td className="border px-3 sm:px-4 py-3 font-semibold text-center whitespace-nowrap">
                        {row.company}
                      </td>
                      <td className="border px-3 sm:px-4 py-3 text-center whitespace-nowrap">
                        {row.contact}
                      </td>
                      <td className="border px-3 sm:px-4 py-3 text-center whitespace-nowrap">
                        {row.mobile}
                      </td>
                      <td className="border px-3 sm:px-4 py-3 text-center whitespace-nowrap">
                        {row.email}
                      </td>
                      <td className="border px-3 sm:px-4 py-3 text-center min-w-[240px]">
                        {row.address}
                      </td>
                      <td className="border px-3 sm:px-4 py-3 text-center whitespace-nowrap">
                        {row.city}
                      </td>
                      <td className="border px-3 sm:px-4 py-3 text-center whitespace-nowrap">
                        {row.state}
                      </td>
                      <td className="border px-3 sm:px-4 py-3 text-center whitespace-nowrap">
                        {row.pincode}
                      </td>

                      {/* GST */}
                      <td className="border px-3 sm:px-4 py-3 text-yellow-600 underline text-center whitespace-nowrap">
                        <a
                          href={`${API_BASE_URL}/${row.documents?.gst}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {row.gstin}
                        </a>
                      </td>

                      {/* IEC */}
                      <td className="border px-3 sm:px-4 py-3 text-yellow-600 underline text-center whitespace-nowrap">
                        <a
                          href={`${API_BASE_URL}/${row.documents?.iec}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {row.iec}
                        </a>
                      </td>

                      {/* PAN */}
                      <td className="border px-3 sm:px-4 py-3 text-yellow-600 underline text-center whitespace-nowrap">
                        <a
                          href={`${API_BASE_URL}/${row.documents?.pan}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {row.pan}
                        </a>
                      </td>

                      {/* Stamp */}
                      <td className="border px-3 sm:px-4 py-3 text-center">
                        <a
                          href={`${API_BASE_URL}/${row.documents?.stamp}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <FileText
                            size={20}
                            className="text-yellow-600 hover:text-yellow-700 mx-auto"
                          />
                        </a>
                      </td>

                      {/* Status */}
                      <td
                        className={`border px-3 sm:px-4 py-3 font-bold text-center whitespace-nowrap ${
                          row.status === "APPROVED"
                            ? "text-green-600"
                            : row.status === "REJECTED"
                              ? "text-red-500"
                              : "text-gray-600"
                        }`}
                      >
                        {row.status}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={14}
                      className="text-center py-10 text-gray-500"
                    >
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4 text-gray-600 text-sm">
          <span>
            Showing {filteredData.length} of {data.length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MSMEList;
