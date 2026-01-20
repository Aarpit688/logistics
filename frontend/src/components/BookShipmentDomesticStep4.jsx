import React, { useMemo, useState } from "react";
import {
  IndianRupee,
  PackageCheck,
  Clock,
  Weight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function BookShipmentDomesticStep4({
  data,
  onChange,
  onNext,
  onBack,
}) {
  const rates = data?.rates || [];
  const selected = data?.selectedRate || null;

  const [selectedId, setSelectedId] = useState(selected?.id || "");
  const [expandedId, setExpandedId] = useState("");
  const [formError, setFormError] = useState("");

  const selectedRate = useMemo(() => {
    return rates.find((r) => r.id === selectedId) || null;
  }, [rates, selectedId]);

  const patchSelection = (rate) => {
    onChange?.({ selectedRate: rate });
  };

  const handleCardClick = (rate) => {
    setSelectedId(rate.id);
    patchSelection(rate);
    setFormError("");
  };

  const handleToggleBreakup = (rateId) => {
    setExpandedId((prev) => (prev === rateId ? "" : rateId));
  };

  const handleSubmit = () => {
    if (!selectedRate) {
      setFormError("Please select a vendor to continue");
      return;
    }
    setFormError("");
    onNext?.();
  };

  return (
    <>
      <div className="mb-5">
        <h3 className="text-base font-extrabold text-black tracking-wide">
          Select Vendor Price
        </h3>
        <p className="mt-1 text-xs font-bold text-gray-500">
          Choose one vendor rate to book the shipment.
        </p>
      </div>

      {rates.length === 0 ? (
        <div className="rounded-md border border-black/10 bg-white p-5 text-sm font-extrabold text-gray-700">
          No vendor rates available for this shipment.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {rates.map((rate) => {
            const isSelected = rate.id === selectedId;
            const isExpanded = rate.id === expandedId;

            return (
              <div
                key={rate.id}
                onClick={() => handleCardClick(rate)}
                className={[
                  "cursor-pointer rounded-md border bg-white p-4 shadow-sm transition",
                  isSelected
                    ? "border-black ring-2 ring-black/20"
                    : "border-black/10 hover:border-black/30",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-extrabold tracking-wide text-black">
                      {rate.vendorCode || "VENDOR"}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-bold text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        TAT: {rate.tat || "-"}
                      </span>

                      <span className="inline-flex items-center gap-1">
                        <Weight className="h-4 w-4" />
                        Chargeable Wt:{" "}
                        <span className="font-extrabold text-gray-900">
                          {rate.chargeableWeight ?? "-"}
                        </span>
                      </span>
                    </div>
                  </div>

                  {isSelected ? (
                    <div className="inline-flex items-center gap-2 rounded-md bg-black px-3 py-2 text-xs font-extrabold text-white">
                      <PackageCheck className="h-4 w-4" />
                      Selected
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 flex items-end justify-between">
                  <div className="text-xs font-bold text-gray-500">
                    Total Price
                  </div>

                  <div className="flex items-center gap-1 text-lg font-extrabold text-black">
                    <IndianRupee className="h-5 w-5" />
                    {Number(rate.price || 0).toFixed(2)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleBreakup(rate.id);
                  }}
                  className="mt-4 inline-flex items-center gap-2 text-xs font-bold hover:underline"
                >
                  Price Breakup{" "}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {isExpanded ? (
                  <div className="mt-3 rounded-md border border-black/10 bg-gray-50 p-3">
                    {Array.isArray(rate.breakup) && rate.breakup.length > 0 ? (
                      <div className="space-y-2">
                        {rate.breakup.map((b, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-xs font-bold text-gray-700"
                          >
                            <span>{b.label}</span>
                            <span className="font-extrabold text-gray-900">
                              ₹{Number(b.amount || 0).toFixed(2)}
                            </span>
                          </div>
                        ))}

                        <div className="mt-3 border-t border-black/10 pt-2 flex items-center justify-between text-xs font-extrabold text-black">
                          <span>Total</span>
                          <span>₹{Number(rate.price || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs font-bold text-gray-600">
                        No breakup available.
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-7 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-gray-200 bg-gray-50 px-6 py-3 text-sm font-extrabold text-gray-700 hover:bg-gray-100 transition active:scale-[0.99]"
        >
          Back
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          className="rounded-md bg-black px-7 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-gray-900 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-black/20"
        >
          Submit
        </button>
      </div>

      {formError ? (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-extrabold tracking-wider text-red-700">
          {formError}
        </div>
      ) : null}
    </>
  );
}
