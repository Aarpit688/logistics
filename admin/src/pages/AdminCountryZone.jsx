import React, { useEffect, useMemo, useState } from "react";
import api from "../utils/api";

export default function AdminCountryZone() {
  const [file, setFile] = useState(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [toast, setToast] = useState({ type: "", message: "" });

  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / limit));
  }, [total, limit]);

  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast({ type: "", message: "" }), 2500);
  }

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/admin/country-zones", {
        params: { search, page, limit },
      });

      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
      showToast(
        "error",
        err?.response?.data?.message || "Failed to fetch country zones"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchList();
    }, 500);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleUpload = async () => {
    if (!file) {
      showToast("error", "Please select an Excel file first.");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/api/admin/country-zones/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showToast("success", res.data.message || "Uploaded successfully!");
      setFile(null);
      setPage(1);
      fetchList();
    } catch (err) {
      console.error(err);
      showToast("error", err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleView = async (country) => {
    try {
      const res = await api.get(`/api/admin/country-zones/${country}`);
      setSelected(res.data);
      setModalOpen(true);
    } catch (err) {
      console.error(err);
      showToast(
        "error",
        err?.response?.data?.message || "Failed to fetch country details"
      );
    }
  };

  const handleDeleteAll = async () => {
    const ok = window.confirm(
      "Are you sure you want to delete ALL country zone mappings?"
    );
    if (!ok) return;

    try {
      setLoading(true);
      const res = await api.delete("/api/admin/country-zones");
      showToast("success", res.data.message || "Deleted successfully!");
      setPage(1);
      fetchList();
    } catch (err) {
      console.error(err);
      showToast("error", err?.response?.data?.message || "Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 bg-slate-950 min-h-screen text-white">
      {/* Toast */}
      {toast.message && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm border ${
            toast.type === "success"
              ? "bg-emerald-900/40 border-emerald-400/30 text-emerald-100"
              : "bg-rose-900/40 border-rose-400/30 text-rose-100"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Country Zone Mapping
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Upload Excel zones sheet, manage country → carrier zone mapping.
          </p>
        </div>

        <button
          onClick={handleDeleteAll}
          className="bg-rose-600 hover:bg-rose-500 px-4 py-2 rounded-xl font-semibold text-sm transition disabled:opacity-50"
          disabled={loading}
        >
          Delete All
        </button>
      </div>

      {/* Upload Card */}
      <div className="bg-slate-900/60 border border-slate-700 rounded-2xl p-5 mb-8">
        <h2 className="font-semibold text-lg mb-3">Upload Excel</h2>

        <div className="flex flex-col md:flex-row gap-4 md:items-center">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-slate-200
              file:mr-4 file:py-2 file:px-4
              file:rounded-xl file:border-0
              file:text-sm file:font-semibold
              file:bg-slate-800 file:text-white
              hover:file:bg-slate-700
              cursor-pointer"
          />

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl font-semibold text-sm transition disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>

        {file && (
          <p className="text-xs text-slate-300 mt-3">
            Selected: <span className="font-medium">{file.name}</span>
          </p>
        )}
      </div>

      {/* Search + Count */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between mb-4">
        <div className="flex gap-2 items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search country..."
            className="w-full md:w-80 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm outline-none focus:border-indigo-400"
          />
        </div>

        <div className="text-sm text-slate-300">
          Total Countries:{" "}
          <span className="text-white font-semibold">{total}</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900/60">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-900 border-b border-slate-700">
            <tr>
              <th className="text-left px-4 py-3 text-slate-200">Country</th>
              <th className="text-left px-4 py-3 text-slate-200">FedEx</th>
              <th className="text-left px-4 py-3 text-slate-200">DHL</th>
              <th className="text-left px-4 py-3 text-slate-200">Aramex</th>
              <th className="text-left px-4 py-3 text-slate-200">TNT</th>
              <th className="text-right px-4 py-3 text-slate-200">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-slate-400"
                >
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-slate-400"
                >
                  No data found.
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr
                  key={row._id}
                  className="border-b border-slate-800 hover:bg-slate-900 transition"
                >
                  <td className="px-4 py-3 font-medium">{row.country}</td>

                  <td className="px-4 py-3 text-slate-200">
                    {row?.zones?.fedex || "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-200">
                    {row?.zones?.dhl || "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-200">
                    {row?.zones?.aramex || "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-200">
                    {row?.zones?.tnt || "-"}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleView(row.country)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold transition"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-5 text-sm">
        <p className="text-slate-300">
          Page <span className="text-white font-semibold">{page}</span> of{" "}
          <span className="text-white font-semibold">{totalPages}</span>
        </p>

        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 disabled:opacity-50"
          >
            Prev
          </button>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && selected && (
        <CountryZoneModal
          data={selected}
          onClose={() => {
            setModalOpen(false);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}

/* ===========================
   Modal Component
=========================== */

function CountryZoneModal({ data, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-950 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold">{data.country}</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Carrier zone mapping
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <ZoneRow label="FedEx" value={data?.zones?.fedex} />
          <ZoneRow label="DHL" value={data?.zones?.dhl} />
          <ZoneRow label="TNT" value={data?.zones?.tnt} />
          <ZoneRow label="Aramex UPS" value={data?.zones?.aramexUps} />
          <ZoneRow label="Aramex" value={data?.zones?.aramex} />
          <ZoneRow label="Self" value={data?.zones?.self} />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ZoneRow({ label, value }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800">
      <span className="text-sm text-slate-200 font-medium">{label}</span>
      <span className="text-sm text-white font-bold">
        {value || <span className="text-slate-400 font-medium">-</span>}
      </span>
    </div>
  );
}
