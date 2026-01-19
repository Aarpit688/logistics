import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import BookShipmentDomestic from "../components/BookShipmentDomestic";
import BookShipmentExport from "../components/BookShipmentExport";
import BookShipmentImport from "../components/BookShipmentImport";

const tabs = [
  { id: "domestic", label: "Domestic" },
  { id: "export", label: "Export" },
  { id: "import", label: "Import" },
];

export default function BookShipment() {
  const location = useLocation();

  // bookingData = { tab, rate, meta } when navigated from calculator
  const bookingData = location?.state || null;

  // ✅ active tab
  const [activeTab, setActiveTab] = useState("domestic");

  // ✅ step control (1=shipment, 2=package, 3=address, 4=review etc)
  const [step, setStep] = useState(1);

  // ✅ Prefill only if came from calculator with valid meta+rate
  const prefill = useMemo(() => {
    if (!bookingData?.meta || !bookingData?.rate) return null;
    return bookingData;
  }, [bookingData]);

  // ✅ Maintain data for all tabs, so switching tabs does not lose filled values
  const [formData, setFormData] = useState({
    domestic: { shipment: {}, address: {}, extra: {} },
    export: { shipment: {}, address: {}, extra: {} },
    import: { shipment: {}, address: {}, extra: {} },
  });

  // ✅ Update tab based data helper
  const updateTabData = (tab, patch) => {
    setFormData((prev) => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        ...patch,
      },
    }));
  };

  // ✅ Initial tab selection when navigated from calculator
  useEffect(() => {
    if (bookingData?.tab) setActiveTab(bookingData.tab);
  }, [bookingData]);

  // ✅ Apply prefill data from calculator into formData of selected tab
  useEffect(() => {
    if (!prefill?.tab) return;

    setActiveTab(prefill.tab);

    setFormData((prev) => ({
      ...prev,
      [prefill.tab]: {
        ...prev[prefill.tab],
        shipment: {
          ...prev[prefill.tab].shipment,
          ...prefill.meta, // rate calculator meta
        },
        extra: {
          ...prev[prefill.tab].extra,
          rate: prefill.rate,
        },
      },
    }));
  }, [prefill]);

  // ✅ Navigation handlers
  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  // ✅ (Optional) Submit final payload (called in step 4)
  const handleSubmit = async () => {
    const payload = {
      tab: activeTab,
      ...formData[activeTab],
    };

    console.log("✅ Final Booking Payload:", payload);

    // TODO: call backend API
    // await fetch("/api/book-shipment", { method: "POST", body: JSON.stringify(payload) })
  };

  return (
    <div className="w-full">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-4">
        <div className="w-full rounded-md border border-black/10 bg-white">
          {/* Title */}
          <div className="border-b border-black/10 px-5 py-4">
            <h2 className="text-lg font-extrabold text-black">Book Shipment</h2>
          </div>

          {/* ✅ Tabs should ONLY show on step 1 */}
          {step === 1 && (
            <div className="px-5 pt-4">
              <div className="flex items-center gap-8 text-sm font-bold text-black">
                {tabs.map((t) => {
                  const active = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(t.id);
                        setStep(1); // ensure always on step 1 when tab changes
                      }}
                      className={[
                        "pb-2 transition",
                        active
                          ? "border-b-2 border-black"
                          : "text-black/50 hover:text-black",
                      ].join(" ")}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="px-5 py-6">
            {activeTab === "domestic" && (
              <BookShipmentDomestic
                step={step}
                data={formData.domestic}
                prefill={prefill}
                onChange={(patch) => updateTabData("domestic", patch)}
                onNext={handleNext}
                onBack={handleBack}
                onSubmit={handleSubmit}
              />
            )}

            {activeTab === "export" && (
              <BookShipmentExport
                step={step}
                data={formData.export}
                prefill={prefill}
                onChange={(patch) => updateTabData("export", patch)}
                onNext={handleNext}
                onBack={handleBack}
                onSubmit={handleSubmit}
              />
            )}

            {activeTab === "import" && (
              <BookShipmentImport
                step={step}
                data={formData.import}
                prefill={prefill}
                onChange={(patch) => updateTabData("import", patch)}
                onNext={handleNext}
                onBack={handleBack}
                onSubmit={handleSubmit}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
