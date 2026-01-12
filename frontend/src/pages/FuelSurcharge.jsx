import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { apiFetch } from "../utils/apiFetch";

const FuelSurcharge = () => {
  const [fuelData, setFuelData] = useState([]);
  const [openRow, setOpenRow] = useState(null);
  const [loading, setLoading] = useState(true);

  const toggleRow = (id) => {
    setOpenRow(openRow === id ? null : id);
  };

  useEffect(() => {
    const fetchFuelSurcharge = async () => {
      try {
        const data = await apiFetch(
          "http://localhost:5000/api/auth/get-fuel-surcharge"
        );

        const withIds = data.map((item, index) => ({
          id: index + 1,
          ...item,
        }));

        setFuelData(withIds);
      } catch (err) {
        console.error("Failed to fetch fuel surcharge:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFuelSurcharge();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-6 text-center rounded-md shadow-sm">
        Loading fuel surcharge...
      </div>
    );
  }

  if (!fuelData.length) {
    return (
      <div className="bg-white p-6 text-center rounded-md shadow-sm">
        No fuel surcharge data available.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md shadow-sm">
      {/* Header */}
      <div className="bg-indigo-800 text-white text-center py-4 rounded-t-md">
        <h1 className="text-xl font-semibold">Fuel Update</h1>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-4 border text-left">Vendor</th>
              <th className="px-6 py-4 border text-left">Fuel %</th>
              <th className="px-6 py-4 border text-left">Start Date</th>
              <th className="px-6 py-4 border text-left">End Date</th>
              <th className="px-6 py-4 border text-left">Status</th>
              <th className="px-6 py-4 border"></th>
            </tr>
          </thead>

          <tbody>
            {fuelData.map((row, index) => {
              const isOpen = openRow === row.id;
              const current = row.history.current;

              return (
                <React.Fragment key={row.id}>
                  {/* MAIN ROW */}
                  <tr
                    className={`cursor-pointer ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                    onClick={() => toggleRow(row.id)}
                  >
                    <td className="px-6 py-4 border font-medium">
                      {row.vendor}
                    </td>
                    <td className="px-6 py-4 border">
                      {current.fuelPercent.toFixed(2)} %
                    </td>
                    <td className="px-6 py-4 border">{current.startDate}</td>
                    <td className="px-6 py-4 border">{current.endDate}</td>
                    <td className="px-6 py-4 border">
                      <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-700">
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 border text-center">
                      {isOpen ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </td>
                  </tr>

                  {/* EXPANDED ROW */}
                  {isOpen && (
                    <tr>
                      <td colSpan={6} className="border bg-gray-50 px-6 py-4">
                        <div className="grid md:grid-cols-3 gap-4">
                          {/* Previous */}
                          {row.history.previous && (
                            <div className="border rounded-md p-4 bg-white">
                              <h3 className="font-bold mb-2 text-gray-700">
                                Previous
                              </h3>
                              <p className="text-xl font-semibold">
                                <span className="font-bold">Fuel %:</span>{" "}
                                {row.history.previous.fuelPercent}%
                              </p>
                              <p className="font-bold">
                                {row.history.previous.startDate} →{" "}
                                {row.history.previous.endDate}
                              </p>
                            </div>
                          )}

                          {/* Current */}
                          <div className="border rounded-md p-4 bg-green-50">
                            <h3 className="font-bold mb-2 text-green-700">
                              Current
                            </h3>
                            <p className="text-xl font-semibold">
                              <span className="font-bold">Fuel %:</span>{" "}
                              {current.fuelPercent}%
                            </p>
                            <p className="font-bold">
                              {current.startDate} → {current.endDate}
                            </p>
                          </div>

                          {/* Upcoming */}
                          {row.history.upcoming && (
                            <div className="border rounded-md p-4 bg-blue-50">
                              <h3 className="mb-2 text-blue-700 font-bold">
                                Upcoming
                              </h3>
                              <p className="text-xl font-semibold">
                                <span className="font-bold">Fuel %:</span>{" "}
                                {row.history.upcoming.fuelPercent}%
                              </p>
                              <p className="font-bold">
                                {row.history.upcoming.startDate} →{" "}
                                {row.history.upcoming.endDate}
                              </p>
                            </div>
                          )}
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
    </div>
  );
};

export default FuelSurcharge;
