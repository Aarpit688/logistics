import React, { useEffect, useMemo, useState } from "react";
import { MapPin, Boxes, Scale } from "lucide-react";

// ---------- helpers for Non-Doc boxes ----------
function clampInt(val, min, max) {
  const n = Number(val);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function normalizeRowsToBoxes(rows, boxesCount) {
  const safe = rows.map((r) => ({
    qty: clampInt(r.qty ?? 1, 1, 999999),
    weight: r.weight ?? "",
    length: r.length ?? "",
    breadth: r.breadth ?? "",
    height: r.height ?? "",
  }));

  if (!boxesCount || boxesCount < 1) return [];

  let total = safe.reduce((acc, r) => acc + r.qty, 0);

  if (safe.length === 0 || total === 0) {
    return Array.from({ length: boxesCount }, () => ({
      qty: 1,
      weight: "",
      length: "",
      breadth: "",
      height: "",
    }));
  }

  while (total < boxesCount) {
    safe.push({ qty: 1, weight: "", length: "", breadth: "", height: "" });
    total += 1;
  }

  while (total > boxesCount && safe.length > 0) {
    const last = safe[safe.length - 1];
    const canReduce = last.qty - 1;

    if (canReduce >= 1) {
      last.qty -= 1;
      total -= 1;
    } else {
      safe.pop();
      total -= 1;
    }
  }

  for (const r of safe) r.qty = Math.max(1, r.qty);

  total = safe.reduce((acc, r) => acc + r.qty, 0);
  while (total < boxesCount) {
    safe.push({ qty: 1, weight: "", length: "", breadth: "", height: "" });
    total += 1;
  }

  return safe;
}

function classNames(...a) {
  return a.filter(Boolean).join(" ");
}

function LabelRow({ label, required }) {
  return (
    <label className="block text-sm font-bold text-[#111827] tracking-wide uppercase">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
  );
}

function HintRow({ hint, invalid }) {
  if (hint) {
    return (
      <p
        className={classNames(
          "mt-2 text-[11px] font-bold",
          invalid ? "text-red-600" : "text-gray-500",
        )}
      >
        {hint}
      </p>
    );
  }
  return <div className="mt-2 h-[14px]" />;
}

function Field({ label, required, invalid, hint, leftIcon, children }) {
  return (
    <div>
      <LabelRow label={label} required={required} />
      <div
        className={classNames(
          "mt-2 flex items-center overflow-hidden rounded-md bg-white shadow-sm",
          invalid
            ? "border border-red-300 focus-within:ring-2 focus-within:ring-red-200"
            : "border border-[#dbeafe] focus-within:ring-2 focus-within:ring-[#f2b632]/40",
        )}
      >
        <div
          className={classNames(
            "grid h-11 w-11 place-items-center border-r bg-white",
            invalid ? "border-red-200" : "border-[#dbeafe]",
          )}
        >
          {leftIcon ?? <MapPin className="h-4 w-4 text-gray-500" />}
        </div>
        {children}
      </div>
      <HintRow hint={hint} invalid={invalid} />
    </div>
  );
}

function MiniInput({ label, invalid, ...props }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-500 tracking-wide">
        {label} <span className="text-red-500">*</span>
      </label>

      <input
        {...props}
        className={[
          "mt-2 h-10 w-full rounded-md px-3 text-sm font-semibold outline-none",
          invalid
            ? "border border-red-300 focus:ring-2 focus:ring-red-200"
            : "border border-[#e5e7eb] text-[#111827] focus:ring-2 focus:ring-[#f2b632]/30",
        ].join(" ")}
      />
    </div>
  );
}

function SummaryRoutePanel({ origin, destination }) {
  return (
    <div className="w-full max-w-4xl mx-auto rounded-md bg-white shadow-xl border border-[#e9eef7] overflow-hidden mb-6">
      <div className="px-8 py-2">
        <div className="flex items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-extrabold text-[#111827] tracking-wide">
              ORIGIN
            </p>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-md border border-[#e5e7eb] bg-[#f9fbff] grid place-items-center text-xs font-extrabold text-[#111827]">
                {origin.code}
              </div>
              <div className="min-w-[170px] rounded-md border border-[#e5e7eb] px-4 py-1">
                <div className="text-lg font-black text-[#111827] leading-tight">
                  {origin.country}
                </div>
                <div className="text-sm font-bold text-gray-500 mt-1">
                  ({origin.pincode})
                </div>
                <div className="text-xs font-bold text-gray-500 mt-1">
                  {origin.city}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-3 w-full max-w-xs">
              <div className="flex-1 border-t border-dashed border-gray-300" />
              <span className="text-xl font-black text-[#111827]">✈</span>
              <div className="flex-1 border-t border-dashed border-gray-300" />
            </div>
          </div>

          <div className="flex flex-col gap-2 items-end">
            <p className="text-sm font-extrabold text-[#111827] tracking-wide">
              DESTINATION
            </p>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-md border border-[#e5e7eb] bg-[#f9fbff] grid place-items-center text-xs font-extrabold text-[#111827]">
                {destination.code}
              </div>
              <div className="min-w-[170px] rounded-md border border-[#e5e7eb] px-4 py-1 text-right">
                <div className="text-lg font-black text-[#111827] leading-tight">
                  {destination.country}
                </div>
                <div className="text-sm font-bold text-gray-500 mt-1">
                  ({destination.pincode})
                </div>
                <div className="text-xs font-bold text-gray-500 mt-1">
                  {destination.city}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ✅ helper for empty check
const isEmpty = (v) => String(v ?? "").trim() === "";

export default function SpotPricingDetails({
  data,
  onReset,
  onChange,
  onSubmit,
  loading,
}) {
  const [shipmentType, setShipmentType] = useState("");
  const [quotedBy, setQuotedBy] = useState("");
  const [commodityType, setCommodityType] = useState("");
  const [vendor, setVendor] = useState("");

  const [boxesCount, setBoxesCount] = useState("");
  const [boxRows, setBoxRows] = useState([]);

  // ✅ Error UI states
  const [formError, setFormError] = useState("");
  const [missing, setMissing] = useState({}); // stores missing field flags

  useEffect(() => {
    const count = clampInt(boxesCount || 0, 0, 9999);
    setBoxRows((prev) => normalizeRowsToBoxes(prev, count));
  }, [boxesCount]);

  const totalWeight = useMemo(() => {
    return boxRows.reduce((sum, r) => {
      const qty = Number(r.qty || 0);
      const wt = Number(r.weight || 0);
      if (Number.isNaN(qty) || Number.isNaN(wt)) return sum;
      return sum + qty * wt;
    }, 0);
  }, [boxRows]);

  // ✅ send data to parent whenever values change (OK)
  useEffect(() => {
    onChange?.({
      shipmentType,
      quotedBy,
      commodityType,
      vendor,
      boxesCount,
      boxRows,
      totalWeight,
    });
  }, [
    shipmentType,
    quotedBy,
    commodityType,
    vendor,
    boxesCount,
    boxRows,
    totalWeight,
  ]);

  // ✅ live remove error highlight when user starts typing/selecting
  const clearMissing = (key) => {
    setMissing((p) => ({ ...p, [key]: false }));
    setFormError("");
  };

  // ✅ validate all required fields
  const validateBeforeSubmit = () => {
    const m = {};

    if (isEmpty(shipmentType)) m.shipmentType = true;
    if (isEmpty(quotedBy)) m.quotedBy = true;
    if (isEmpty(commodityType)) m.commodityType = true;
    if (isEmpty(vendor)) m.vendor = true;

    const count = clampInt(boxesCount || 0, 0, 9999);
    if (!count || count < 1) m.boxesCount = true;

    // ✅ validate each row fields
    if (count > 0) {
      boxRows.forEach((r, idx) => {
        if (!r.qty || Number(r.qty) < 1) m[`row_${idx}_qty`] = true;
        if (isEmpty(r.weight) || Number(r.weight) <= 0)
          m[`row_${idx}_weight`] = true;
        if (isEmpty(r.length) || Number(r.length) <= 0)
          m[`row_${idx}_length`] = true;
        if (isEmpty(r.breadth) || Number(r.breadth) <= 0)
          m[`row_${idx}_breadth`] = true;
        if (isEmpty(r.height) || Number(r.height) <= 0)
          m[`row_${idx}_height`] = true;
      });
    }

    if (Object.keys(m).length) {
      setMissing(m);
      setFormError("All fields are required");
      return false;
    }

    setMissing({});
    setFormError("");
    return true;
  };

  // ✅ updated submit click
  const handleGetQuote = () => {
    const ok = validateBeforeSubmit();
    if (!ok) return;

    // ✅ only if valid -> call parent submit
    onSubmit?.();
  };

  const handleQtyChange = (rowIndex, nextQtyRaw) => {
    const count = clampInt(boxesCount || 0, 0, 9999);
    if (count < 1) return;

    clearMissing(`row_${rowIndex}_qty`);

    setBoxRows((prev) => {
      let rows = normalizeRowsToBoxes(prev, count);
      if (!rows[rowIndex]) return rows;

      let nextQty = clampInt(nextQtyRaw, 1, 999999);
      rows[rowIndex].qty = nextQty;

      return normalizeRowsToBoxes(rows, count);
    });
  };

  const handleRowFieldChange = (rowIndex, key, value) => {
    clearMissing(`row_${rowIndex}_${key}`);

    setBoxRows((prev) => {
      const copy = [...prev];
      if (!copy[rowIndex]) return prev;
      copy[rowIndex] = { ...copy[rowIndex], [key]: value };
      return copy;
    });
  };

  return (
    <div>
      <SummaryRoutePanel origin={data.origin} destination={data.destination} />

      <div className="mx-auto w-full max-w-4xl">
        <div className="w-full rounded-md bg-white shadow-xl border border-[#e9eef7] overflow-hidden mb-1">
          <div className="px-8 py-6 border-b border-[#edf2f7] flex justify-between items-center">
            <h2 className="text-2xl font-extrabold text-[#111827]">
              Shipment Details
            </h2>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGetQuote}
                disabled={loading}
                className="h-12 w-44 px-4 rounded-md bg-[#f2b632] text-white font-extrabold shadow-lg hover:brightness-95 transition active:scale-[0.99] disabled:opacity-60"
              >
                {loading ? "Submitting..." : "GET QUOTE"}
              </button>

              <button
                type="button"
                onClick={onReset}
                className="h-12 w-44 rounded-md border border-[#111827] bg-white text-[#111827] font-extrabold shadow hover:bg-gray-50 transition active:scale-[0.99]"
              >
                Back / Reset
              </button>
            </div>
          </div>

          {/* ✅ show error on top */}
          {formError ? (
            <div className="mx-8 mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-extrabold text-red-700 tracking-wider">
              {formError}
            </div>
          ) : null}

          <div className="px-8 py-4 grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1">
            <Field
              label="SHIPMENT TYPE"
              required
              invalid={!!missing.shipmentType}
            >
              <select
                value={shipmentType}
                onChange={(e) => {
                  setShipmentType(e.target.value);
                  clearMissing("shipmentType");
                }}
                className="h-11 w-full px-4 text-sm font-semibold outline-none bg-transparent"
              >
                <option value="" disabled>
                  Select Shipment Type
                </option>
                <option value="Commercial">Commercial</option>
                <option value="Cargo Commercial">Cargo Commercial</option>
                <option value="Personal">Personal</option>
                <option value="Sample">Sample</option>
                <option value="Gift">Gift</option>
              </select>
            </Field>

            <Field label="QUOTED BY" required invalid={!!missing.quotedBy}>
              <input
                value={quotedBy}
                onChange={(e) => {
                  setQuotedBy(e.target.value);
                  clearMissing("quotedBy");
                }}
                className="h-11 w-full px-4 text-sm font-semibold outline-none"
                placeholder="Enter name"
              />
            </Field>

            <Field
              label="COMMODITY TYPE"
              required
              invalid={!!missing.commodityType}
            >
              <select
                value={commodityType}
                onChange={(e) => {
                  setCommodityType(e.target.value);
                  clearMissing("commodityType");
                }}
                className="h-11 w-full px-4 text-sm font-semibold outline-none bg-transparent"
              >
                <option value="" disabled>
                  Select Commodity Type
                </option>
                <option value="General">General</option>
                <option value="Electronics">Electronics</option>
                <option value="Pharma">Pharma</option>
              </select>
            </Field>

            <Field label="VENDOR" required invalid={!!missing.vendor}>
              <select
                value={vendor}
                onChange={(e) => {
                  setVendor(e.target.value);
                  clearMissing("vendor");
                }}
                className="h-11 w-full px-4 text-sm font-semibold outline-none bg-transparent"
              >
                <option value="" disabled>
                  Select Vendor
                </option>
                <option value="DHL">DHL</option>
                <option value="FedEx">FedEx</option>
                <option value="UPS">UPS</option>
              </select>
            </Field>

            <Field
              label="TOTAL WEIGHT (kg)"
              required
              invalid={false}
              leftIcon={<Scale className="h-4 w-4 text-gray-500" />}
            >
              <input
                value={Number(totalWeight || 0).toFixed(2)}
                readOnly
                className="h-11 w-full px-4 text-sm font-extrabold outline-none bg-gray-50 cursor-not-allowed"
              />
            </Field>

            <Field
              label="NUMBER OF BOXES"
              required
              invalid={!!missing.boxesCount}
              leftIcon={<Boxes className="h-4 w-4 text-gray-500" />}
            >
              <input
                type="number"
                min={1}
                value={boxesCount}
                onChange={(e) => {
                  setBoxesCount(e.target.value);
                  clearMissing("boxesCount");
                }}
                placeholder="Enter number of boxes"
                className="h-11 w-full px-4 text-sm font-semibold outline-none placeholder:text-[#9ca3af]"
              />
            </Field>
          </div>

          {/* ✅ Box rows */}
          {clampInt(boxesCount || 0, 0, 9999) > 0 ? (
            <div className="px-8 pb-6 space-y-3">
              {boxRows.map((row, idx) => (
                <div
                  key={idx}
                  className="rounded-md border border-[#e5e7eb] bg-white p-3"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <MiniInput
                      label="Qty"
                      type="number"
                      min={1}
                      value={row.qty}
                      invalid={!!missing[`row_${idx}_qty`]}
                      onChange={(e) => handleQtyChange(idx, e.target.value)}
                    />

                    <MiniInput
                      label="Weight (kg)"
                      type="number"
                      min={0}
                      value={row.weight}
                      invalid={!!missing[`row_${idx}_weight`]}
                      placeholder="kg"
                      onChange={(e) =>
                        handleRowFieldChange(idx, "weight", e.target.value)
                      }
                    />

                    <MiniInput
                      label="Length (cm)"
                      type="number"
                      min={1}
                      value={row.length}
                      invalid={!!missing[`row_${idx}_length`]}
                      placeholder="cm"
                      onChange={(e) =>
                        handleRowFieldChange(idx, "length", e.target.value)
                      }
                    />

                    <MiniInput
                      label="Breadth (cm)"
                      type="number"
                      min={1}
                      value={row.breadth}
                      invalid={!!missing[`row_${idx}_breadth`]}
                      placeholder="cm"
                      onChange={(e) =>
                        handleRowFieldChange(idx, "breadth", e.target.value)
                      }
                    />

                    <MiniInput
                      label="Height (cm)"
                      type="number"
                      min={1}
                      value={row.height}
                      invalid={!!missing[`row_${idx}_height`]}
                      placeholder="cm"
                      onChange={(e) =>
                        handleRowFieldChange(idx, "height", e.target.value)
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
