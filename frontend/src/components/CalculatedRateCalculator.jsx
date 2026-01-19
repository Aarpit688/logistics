import React, { useMemo, useState } from "react";

function classNames(...a) {
  return a.filter(Boolean).join(" ");
}

// ✅ helper: breakup only from rate.breakup
function normalizeBreakup(breakup, totalCost) {
  if (Array.isArray(breakup) && breakup.length > 0) return breakup;

  // ✅ If no breakup comes from API → show only FREIGHT = cost
  const cost = Number(totalCost || 0);
  return [{ label: "FREIGHT", amount: cost }];
}

export default function CalculatedRateCalculator({
  rates = [],
  meta,
  onBookShipment, // optional callback (rate)=>{}
}) {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (idx) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <div className="w-full rounded-md border border-[#e3eefc] bg-white shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 text-white bg-gradient-to-r from-[#f2b632] to-[#f7c852] relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.8),transparent_55%)]" />
        <div className="relative flex items-center justify-between">
          <h3 className="text-lg font-extrabold">Rates</h3>
          <span className="text-sm font-bold opacity-95">* Excluding GST</span>
        </div>
      </div>

      <div className="p-5">
        <div className="space-y-4">
          {rates.map((r, idx) => {
            const isOpen = openIndex === idx;
            const breakup = normalizeBreakup(r.breakup, r.cost);

            const total = breakup.reduce(
              (acc, x) => acc + Number(x.amount || 0),
              0,
            );

            return (
              <div
                key={idx}
                onClick={() => toggle(idx)}
                className="rounded-md border cursor-pointer border-[#e3eefc] bg-white shadow-sm overflow-hidden"
              >
                <div
                  className={classNames(
                    "flex items-center justify-between px-4 py-3 border-b border-[#eef4ff]",
                    "select-none hover:bg-[#fafcff] transition",
                  )}
                >
                  <div>
                    <p className="text-sm font-extrabold">{r.carrier}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {r.serviceName || "Service"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-xs font-extrabold text-gray-700 whitespace-nowrap">
                      TAT - {r.tatDays ?? 0} Days
                    </div>

                    {/* ✅ Book Shipment Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // prevent toggling
                        onBookShipment?.(r);
                      }}
                      className="h-9 px-4 rounded-md bg-black text-white text-xs font-extrabold shadow hover:bg-gray-900 active:scale-[0.99] transition"
                    >
                      Book Shipment
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex justify-between gap-3 px-4 py-4">
                  <div>
                    <p className="text-xs font-extrabold text-gray-500">
                      Product Type
                    </p>
                    <p className="text-sm font-bold mt-1">{r.productType}</p>
                  </div>

                  <div>
                    <p className="text-xs font-extrabold text-gray-500">
                      COST (₹)
                    </p>
                    <p className="text-sm font-extrabold mt-1">{r.cost}</p>
                  </div>

                  <div className="text-center">
                    <p className="text-xs font-extrabold text-gray-500">
                      Chargeable Weight
                    </p>
                    <p className="text-sm font-bold mt-1">
                      {r.chargeableWeight} Kg
                    </p>
                  </div>
                </div>

                {/* ✅ Slide open breakup */}
                <div
                  className={classNames(
                    "px-4 pb-4 transition-all duration-300 ease-out",
                    isOpen ? "max-h-[520px] opacity-100" : "max-h-0 opacity-0",
                  )}
                  style={{
                    overflow: "hidden",
                  }}
                >
                  {/* Breakup Table (TABLE FORMAT) */}
                  <div className="mt-2 overflow-hidden rounded-md border border-[#f3e2a4] bg-[#fffdf7]">
                    <table className="w-full border-collapse text-center">
                      <thead>
                        <tr className="bg-[#fff6db]">
                          <th className="border border-[#f3e2a4] px-6 py-2 text-left text-sm font-bold uppercase">
                            Sr.No.
                          </th>
                          <th className="border border-[#f3e2a4] px-6 py-2 text-left text-sm font-bold uppercase">
                            Particulars
                          </th>
                          <th className="border border-[#f3e2a4] px-6 py-2 text-sm font-bold uppercase">
                            Charges
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {breakup.map((b, i) => (
                          <tr key={i} className="bg-white">
                            <td className="border border-[#f3e2a4] px-6 py-2 font-semibold">
                              {i + 1}.
                            </td>
                            <td className="border border-[#f3e2a4] px-6 py-2 text-left font-semibold">
                              {b.label}
                            </td>
                            <td className="border border-[#f3e2a4] px-6 py-2 font-semibold">
                              {b.amount}
                            </td>
                          </tr>
                        ))}

                        {/* TOTAL ROW */}
                        <tr className="bg-[#fffdf4]">
                          <td className="border border-[#f3e2a4] border-r-0 px-6 py-2 font-bold">
                            TOTAL
                          </td>
                          <td className="border border-[#f3e2a4] border-x-0" />
                          <td className="border border-[#f3e2a4] border-l-0 px-6 py-2 font-bold">
                            {r.cost ?? total}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}

          {rates.length === 0 ? (
            <div className="text-center py-10 text-gray-500 font-semibold">
              No rates found
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
