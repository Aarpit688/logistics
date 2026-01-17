import React from "react";

export default function CalculatedRateCalculator({ rates = [], meta }) {
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
          {rates.map((r, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[#e3eefc] bg-white shadow-sm overflow-hidden"
            >
              {/* Top bar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#eef4ff]">
                <div>
                  <p className="text-sm font-extrabold text-[#111827]">
                    {r.carrier}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {r.serviceName || "Service"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xs font-extrabold text-gray-700">
                    TAT - {r.tatDays ?? 0} Days
                  </div>

                  <div className="grid h-8 w-8 place-items-center rounded-full bg-[#f2b632] text-white font-black">
                    ›
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="grid grid-cols-3 gap-3 px-4 py-4">
                <div>
                  <p className="text-xs font-extrabold text-gray-500">
                    Product Type
                  </p>
                  <p className="text-sm font-bold text-[#111827] mt-1">
                    {r.productType}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-extrabold text-gray-500">
                    COST (₹)
                  </p>
                  <p className="text-sm font-extrabold text-[#111827] mt-1">
                    {r.cost}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs font-extrabold text-gray-500">
                    Chargeable Weight
                  </p>
                  <p className="text-sm font-bold text-[#111827] mt-1">
                    {r.chargeableWeight} Kg
                  </p>
                </div>
              </div>

              {/* Optional meta row */}
              {meta?.origin && meta?.destination ? (
                <div className="px-4 pb-4">
                  <div className="rounded-lg bg-[#f9fbff] border border-[#eef4ff] px-3 py-2 text-[11px] text-gray-600 font-bold flex items-center justify-between">
                    <span>
                      {meta.origin} → {meta.destination}
                    </span>
                    <span className="text-[#b45309]">
                      Shipment: {meta.shipmentType}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
