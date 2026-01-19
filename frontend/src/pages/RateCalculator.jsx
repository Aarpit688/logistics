import React, { useState } from "react";
import { Calculator, Plane, Home } from "lucide-react";

import DomesticRateCalculator from "../components/DomesticRateCalculator";
import ExportRateCalculator from "../components/ExportRateCalculator";
import ImportRateCalculator from "../components/ImportRateCalculator";
import CalculatedRateCalculator from "../components/CalculatedRateCalculator";
import { useNavigate } from "react-router-dom";

const tabs = [
  { id: "domestic", label: "Domestic", icon: Home },
  { id: "export", label: "Export", icon: Plane },
  {
    id: "import",
    label: "Import",
    icon: (props) => (
      <Plane {...props} className={`${props.className} rotate-180`} />
    ),
  },
];

export default function RateCalculator() {
  const [activeTab, setActiveTab] = useState("domestic");
  const navigate = useNavigate();

  // ✅ rates data
  const [rates, setRates] = useState([]);
  const [ratesMeta, setRatesMeta] = useState(null);

  // ✅ show right panel only after quotation
  const [showRates, setShowRates] = useState(false);

  const handleRatesCalculated = (newRates, meta) => {
    setRates(newRates);
    setRatesMeta(meta);
    setShowRates(true);
  };

  const handleResetAll = () => {
    setShowRates(false);
    setRates([]);
    setRatesMeta(null);

    setBookingData(null);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    handleResetAll(); // ✅ switching tab hides rates too
  };

  // ✅ called when Book Shipment is clicked
  const handleBookShipment = (selectedRate) => {
    if (!ratesMeta) return;

    navigate("/book-shipment", {
      state: {
        tab: activeTab,
        rate: selectedRate,
        meta: ratesMeta,
      },
    });
  };

  return (
    <div className="w-full">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 xl:grid-cols-[520px_1fr] gap-6 items-start">
          {/* LEFT */}
          <div className="w-full max-w-xl">
            <div className="w-full rounded-md border border-[#e3eefc] bg-white shadow-lg overflow-hidden">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-md bg-white/80 border border-[#f0ddb0] shadow-sm">
                    <Calculator className="h-5 w-5 text-[#111827]" />
                  </div>

                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-[#111827] leading-tight">
                      Rate Calculator
                    </h2>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Get shipping quotation instantly
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="px-5 pt-2">
                <div className="flex gap-2 rounded-md bg-gray-200 p-2 border border-[#edf2f7]">
                  {tabs.map((t) => {
                    const Icon = t.icon;
                    const active = activeTab === t.id;

                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleTabChange(t.id)}
                        className={[
                          "flex-1 inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition",
                          active
                            ? "bg-white text-black shadow-sm border border-transparent"
                            : "text-[#6b7280] hover:bg-white/70",
                        ].join(" ")}
                      >
                        <Icon className="h-4 w-4" />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tab content */}
              <div className="px-5 py-5">
                {activeTab === "domestic" && (
                  <DomesticRateCalculator
                    onRatesCalculated={handleRatesCalculated}
                    onResetAll={handleResetAll}
                  />
                )}

                {activeTab === "export" && (
                  <ExportRateCalculator
                    onRatesCalculated={handleRatesCalculated}
                    onResetAll={handleResetAll}
                  />
                )}

                {activeTab === "import" && (
                  <ImportRateCalculator
                    onRatesCalculated={handleRatesCalculated}
                    onResetAll={handleResetAll}
                  />
                )}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          {showRates ? (
            <div className="w-full">
              <CalculatedRateCalculator
                rates={rates}
                meta={ratesMeta}
                onBookShipment={handleBookShipment} // ✅ NEW
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
