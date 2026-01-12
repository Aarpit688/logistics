import React, { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Edit,
  Trash,
  Save,
  Plus,
  X,
} from "lucide-react";

const API_BASE = "http://localhost:5000/api/admin/fuel-surcharge";

const AdminFuelSurcharge = () => {
  const token = localStorage.getItem("adminToken");

  const [data, setData] = useState([]);
  const [draftData, setDraftData] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [openRow, setOpenRow] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ---------------- FETCH ---------------- */
  const fetchFuel = async () => {
    setLoading(true);
    const res = await fetch(API_BASE, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await res.json();

    const mapped = json.map((item) => ({
      id: item._id,
      vendor: item.vendor,
      history: {
        previous: item.previous || {},
        current: item.current || {},
        upcoming: item.upcoming || {},
      },
    }));

    setData(mapped);
    setDraftData(structuredClone(mapped));
    setLoading(false);
  };

  useEffect(() => {
    fetchFuel();
  }, []);

  /* ---------------- EDIT MODE ---------------- */
  const startEdit = (id) => {
    setEditingId(id);
    setOpenRow(id);
    setDraftData(structuredClone(data));
  };

  const cancelEdit = () => {
    setDraftData(structuredClone(data));
    setEditingId(null);
  };

  /* ---------------- UPDATE FIELD ---------------- */
  const updateField = (id, section, field, value) => {
    setDraftData((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              history: {
                ...row.history,
                [section]: {
                  ...row.history[section],
                  [field]: value,
                },
              },
            }
          : row
      )
    );
  };

  const updateVendor = (id, value) => {
    setDraftData((prev) =>
      prev.map((row) => (row.id === id ? { ...row, vendor: value } : row))
    );
  };

  /* ---------------- SAVE ---------------- */
  const saveVendor = async (row) => {
    await fetch(`${API_BASE}/${row.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        vendor: row.vendor,
        previous: row.history.previous,
        current: row.history.current,
        upcoming: row.history.upcoming,
      }),
    });

    setEditingId(null);
    fetchFuel();
  };

  /* ---------------- ADD ---------------- */
  const addVendor = async () => {
    const payload = {
      vendor: "NEW VENDOR",
      previous: null,
      current: { fuelPercent: 0, startDate: new Date(), endDate: new Date() },
      upcoming: null,
    };

    await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    fetchFuel();
  };

  /* ---------------- DELETE ---------------- */
  const deleteVendor = async (id) => {
    if (!window.confirm("Delete this vendor permanently?")) return;

    await fetch(`${API_BASE}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    fetchFuel();
  };

  if (loading) return <div className="p-6">Loading fuel surcharge…</div>;

  return (
    <div className="bg-white rounded-lg shadow">
      {/* HEADER */}
      <div className="flex justify-between items-center px-6 py-4 bg-indigo-700 text-white rounded-t-lg">
        <h2 className="font-semibold text-lg">Fuel Surcharge Management</h2>
        <button
          onClick={addVendor}
          className="flex items-center gap-2 bg-white text-indigo-700 px-4 py-2 rounded-md text-sm font-medium"
        >
          <Plus size={16} /> Add Vendor
        </button>
      </div>

      {/* TABLE */}
      <table className="w-full border-collapse">
        <thead className="bg-gray-100 text-sm">
          <tr>
            <th className="border px-4 py-3 text-left">Vendor</th>
            <th className="border px-4 py-3 text-center">Current %</th>
            <th className="border px-4 py-3 text-center">Actions</th>
            <th className="border px-4 py-3 w-10"></th>
          </tr>
        </thead>

        <tbody>
          {draftData.map((row) => {
            const isEditing = editingId === row.id;
            const isOpen = openRow === row.id;

            return (
              <React.Fragment key={row.id}>
                <tr className={isEditing ? "bg-yellow-50" : ""}>
                  {/* VENDOR */}
                  <td className="border px-4 py-2">
                    <input
                      disabled={!isEditing}
                      value={row.vendor}
                      onChange={(e) => updateVendor(row.id, e.target.value)}
                      className={`w-full px-2 py-1 rounded ${
                        isEditing
                          ? "border border-indigo-400 bg-white"
                          : "border-transparent bg-transparent"
                      }`}
                    />
                  </td>

                  {/* CURRENT */}
                  <td className="border px-4 py-2 text-center">
                    {row.history.current?.fuelPercent ?? "-"} %
                  </td>

                  {/* ACTIONS */}
                  <td className="border px-4 py-2">
                    <div className="flex justify-center gap-3">
                      {!isEditing ? (
                        <button
                          onClick={() => startEdit(row.id)}
                          className="text-blue-600"
                        >
                          <Edit size={16} />
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => saveVendor(row)}
                            className="text-green-600"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-gray-500"
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}

                      <button
                        disabled={isEditing}
                        onClick={() => deleteVendor(row.id)}
                        className={`${
                          isEditing
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-red-600"
                        }`}
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </td>

                  {/* EXPAND */}
                  <td
                    className="border px-2 cursor-pointer text-center"
                    onClick={() => setOpenRow(isOpen ? null : row.id)}
                  >
                    {isOpen ? <ChevronUp /> : <ChevronDown />}
                  </td>
                </tr>

                {/* EXPANDED */}
                {isOpen && (
                  <tr>
                    <td colSpan={4} className="bg-gray-50 px-6 py-4 border">
                      <div className="grid md:grid-cols-3 gap-4">
                        {["previous", "current", "upcoming"].map((section) => (
                          <div
                            key={section}
                            className="bg-white border rounded-md p-4"
                          >
                            <h4 className="font-semibold mb-2 capitalize">
                              {section}
                            </h4>

                            {["fuelPercent", "startDate", "endDate"].map(
                              (field) => {
                                const isDateField =
                                  field === "startDate" || field === "endDate";

                                return (
                                  <input
                                    key={field}
                                    type={isDateField ? "date" : "text"}
                                    disabled={!isEditing}
                                    value={
                                      isDateField &&
                                      row.history[section]?.[field]
                                        ? row.history[section][field].slice(
                                            0,
                                            10
                                          )
                                        : row.history[section]?.[field] || ""
                                    }
                                    onChange={(e) =>
                                      updateField(
                                        row.id,
                                        section,
                                        field,
                                        e.target.value
                                      )
                                    }
                                    className={`w-full mb-2 px-2 py-1 rounded ${
                                      isEditing
                                        ? "border border-indigo-300"
                                        : "border border-gray-200 bg-gray-100"
                                    }`}
                                  />
                                );
                              }
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AdminFuelSurcharge;
