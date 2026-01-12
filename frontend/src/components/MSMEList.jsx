import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import MSMERegistration from "./MSMERegistration";
import { FileText } from "lucide-react";

const BASE_URL = "http://localhost:5000";

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
      const res = await fetch("http://localhost:5000/api/auth/msme", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch MSMEs");
      }

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
      "MSME_List.xlsx"
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
      <div className="bg-white rounded-xl shadow p-6">
        {/* HEADER */}
        <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-800">MSME List</h2>

          {/* HEADER ACTIONS */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setShowRegistration(true)}
              className="bg-yellow-400 hover:bg-yellow-500 text-white font-semibold px-5 py-2 rounded-lg shadow"
            >
              + Registration
            </button>

            <button
              onClick={handleDownload}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold px-5 py-2 rounded-lg shadow"
            >
              Download
            </button>

            <input
              type="text"
              placeholder="Enter Mobile No."
              value={searchMobile}
              onChange={(e) => setSearchMobile(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 w-56 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />

            <button
              onClick={handleReset}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-lg shadow"
            >
              RESET
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="relative overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-max table-auto border-collapse text-sm">
            <thead className="bg-black text-white">
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
                    className="border px-4 py-3 whitespace-nowrap"
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
                    className="text-gray-800 hover:bg-gray-50"
                  >
                    <td className="border px-10 py-3 text-center">{row.sr}.</td>
                    <td className="border px-14 py-3 font-semibold text-center">
                      {row.company}
                    </td>
                    <td className="border px-14 py-3 text-center">
                      {row.contact}
                    </td>
                    <td className="border px-14 py-3 text-center">
                      {row.mobile}
                    </td>
                    <td className="border px-10 py-3 text-center">
                      {row.email}
                    </td>
                    <td className="border px-10 py-3 text-center">
                      {row.address}
                    </td>
                    <td className="border px-10 py-3 text-center">
                      {row.city}
                    </td>
                    <td className="border px-10 py-3 text-center">
                      {row.state}
                    </td>
                    <td className="border px-10 py-3 text-center">
                      {row.pincode}
                    </td>
                    <td className="border px-10 py-3 text-yellow-600 underline">
                      <a
                        href={`${BASE_URL}/${row.documents?.gst}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {row.gstin}
                      </a>
                    </td>

                    <td className="border px-10 py-3 text-yellow-600 underline">
                      <a
                        href={`${BASE_URL}/${row.documents.iec}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {row.iec}
                      </a>
                    </td>

                    <td className="border px-10 py-3 text-yellow-600 underline">
                      <a
                        href={`${BASE_URL}/${row.documents.pan}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {row.pan}
                      </a>
                    </td>

                    <td className="border px-10 py-3 text-yellow-600 underline">
                      <a
                        href={`${BASE_URL}/${row.documents.stamp}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <FileText
                          size={22}
                          className="text-yellow-600 hover:text-yellow-700 mx-auto"
                        />
                      </a>
                    </td>

                    <td
                      className={`border px-10 py-3 font-bold ${
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
                  <td colSpan={14} className="text-center py-6 text-gray-500">
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="flex justify-between items-center mt-4 text-gray-600">
          <span>
            Showing {filteredData.length} of {data.length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MSMEList;
