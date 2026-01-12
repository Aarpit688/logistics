import React, { useEffect, useState } from "react";

const AdminMSME = () => {
  const [msmes, setMsmes] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("adminToken");

  /* ===========================
     FETCH MSMEs
  ============================ */
  const fetchMsmes = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/msme?search=${search}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch MSMEs");
      }

      const data = await res.json();
      setMsmes(data.msmes || []);
    } catch (err) {
      console.error("Fetch MSME error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMsmes();
  }, [search]);

  /* ===========================
     UPDATE STATUS
  ============================ */
  const updateStatus = async (id, status) => {
    try {
      await fetch(`http://localhost:5000/api/admin/msme/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      fetchMsmes();
    } catch (err) {
      alert("Failed to update MSME status");
    }
  };

  if (loading) return <p className="p-6">Loading MSMEs…</p>;

  return (
    <div className="bg-white rounded-xl shadow p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">MSME Registrations</h2>

        <input
          placeholder="Search company / GSTIN / mobile"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-4 py-2 rounded-md w-72"
        />
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-max min-w-full text-sm border-collapse border border-black">
          <thead className="bg-gray-900 text-white">
            <tr className="border border-black">
              {[
                "Company",
                "Contact Person",
                "Mobile",
                "Email",
                "Address 1",
                "Address 2",
                "City",
                "State",
                "Pincode",
                "GSTIN",
                "IEC",
                "PAN",
                "Status",
                "Documents",
                "Action",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left whitespace-nowrap border border-black"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="border border-black">
            {msmes.length > 0 ? (
              msmes.map((m) => (
                <tr
                  key={m._id}
                  className="border border-black hover:bg-gray-100"
                >
                  <td className="px-4 py-2 font-semibold border border-black">
                    {m.companyName}
                  </td>
                  <td className="px-4 py-2 border border-black">
                    {m.contactPerson}
                  </td>
                  <td className="px-4 py-2 border border-black">{m.mobile}</td>
                  <td className="px-4 py-2 border border-black">
                    {m.email || "-"}
                  </td>
                  <td className="px-4 py-2 border border-black">
                    {m.address1}
                  </td>
                  <td className="px-4 py-2 border border-black">
                    {m.address2}
                  </td>
                  <td className="px-4 py-2 border border-black">{m.city}</td>
                  <td className="px-4 py-2 border border-black">{m.state}</td>
                  <td className="px-4 py-2 border border-black">{m.pincode}</td>
                  <td className="px-4 py-2 border border-black">{m.gstin}</td>
                  <td className="px-4 py-2 border border-black">{m.iec}</td>
                  <td className="px-4 py-2 border border-black">{m.pan}</td>

                  {/* STATUS */}
                  <td
                    className={`px-4 py-2 font-bold border border-black ${
                      m.status === "APPROVED"
                        ? "text-green-600"
                        : m.status === "REJECTED"
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {m.status}
                  </td>

                  {/* DOCUMENTS */}
                  <td className="px-4 py-2 border border-black space-y-1">
                    {Object.entries(m.documents || {}).map(
                      ([key, path]) =>
                        path && (
                          <a
                            key={key}
                            href={`http://localhost:5000/${path}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 underline block"
                          >
                            {key.toUpperCase()}
                          </a>
                        )
                    )}
                  </td>

                  {/* ACTION */}
                  <td className="px-4 py-2 border border-black">
                    <select
                      value={m.status}
                      onChange={(e) => updateStatus(m._id, e.target.value)}
                      className="border border-black px-2 py-1 rounded"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="border border-black">
                <td
                  colSpan={15}
                  className="text-center py-6 text-gray-500 border border-black"
                >
                  No MSME records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminMSME;
