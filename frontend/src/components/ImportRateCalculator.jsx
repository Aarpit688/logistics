import React, { useEffect, useMemo, useState } from "react";
import {
  MapPin,
  Map,
  Package,
  Scale,
  ChevronDown,
  ChevronsRight,
  Boxes,
} from "lucide-react";

// ✅ India Post API
async function fetchPincodeDetails(pincode) {
  const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
  const data = await res.json();

  if (!Array.isArray(data) || !data[0]) return null;

  const entry = data[0];
  if (entry.Status !== "Success" || !entry.PostOffice?.length) return null;

  const po = entry.PostOffice[0];
  return {
    city: (po.District || po.Name || "").toUpperCase(),
    state: (po.State || "").toUpperCase(),
    pincode,
  };
}

// ---------- helpers for Non-Doc boxes ----------
function clampInt(val, min, max) {
  const n = Number(val);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

/**
 * Ensure rows sum quantity = boxesCount.
 * If rows are fewer, add rows qty=1.
 * If too many qty sum, reduce from end.
 */
function normalizeRowsToBoxes(rows, boxesCount) {
  const safe = rows.map((r) => ({
    qty: clampInt(r.qty ?? 1, 1, 999999),
    weight: r.weight ?? "",
    length: r.length ?? "",
    breadth: r.breadth ?? "",
    height: r.height ?? "",
  }));

  // If boxesCount is empty/0: return empty list
  if (!boxesCount || boxesCount < 1) return [];

  let total = safe.reduce((acc, r) => acc + r.qty, 0);

  // If total qty is 0 or rows empty -> start from scratch
  if (safe.length === 0 || total === 0) {
    return Array.from({ length: boxesCount }, () => ({
      qty: 1,
      weight: "",
      length: "",
      breadth: "",
      height: "",
    }));
  }

  // If total < boxesCount -> add qty=1 rows until equals
  while (total < boxesCount) {
    safe.push({ qty: 1, weight: "", length: "", breadth: "", height: "" });
    total += 1;
  }

  // If total > boxesCount -> reduce qty from end
  while (total > boxesCount && safe.length > 0) {
    const last = safe[safe.length - 1];
    const canReduce = last.qty - 1;

    if (canReduce >= 1) {
      last.qty -= 1;
      total -= 1;
    } else {
      // qty == 1, remove the row
      safe.pop();
      total -= 1;
    }
  }

  // Ensure no row has qty < 1
  for (const r of safe) r.qty = Math.max(1, r.qty);

  // After reduction, may still have total < boxesCount (rare). Fill again.
  total = safe.reduce((acc, r) => acc + r.qty, 0);
  while (total < boxesCount) {
    safe.push({ qty: 1, weight: "", length: "", breadth: "", height: "" });
    total += 1;
  }

  return safe;
}

function MiniInput({ label, invalid, ...props }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-500 tracking-wide">
        {label}
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

export default function ImportRateCalculator({
  onRatesCalculated,
  onResetAll,
}) {
  const [originPincode, setOriginPincode] = useState("");
  const [destPincode, setDestPincode] = useState("");
  const [shipmentType, setShipmentType] = useState("");
  const [weight, setWeight] = useState("");

  // ✅ Non-doc states
  const [boxesCount, setBoxesCount] = useState("");
  const [boxRows, setBoxRows] = useState([]);

  const [originLoc, setOriginLoc] = useState(null);
  const [destLoc, setDestLoc] = useState(null);

  const [originLoading, setOriginLoading] = useState(false);
  const [destLoading, setDestLoading] = useState(false);

  const [originError, setOriginError] = useState("");
  const [destError, setDestError] = useState("");

  const [originTouched, setOriginTouched] = useState(false);
  const [destTouched, setDestTouched] = useState(false);

  const [formError, setFormError] = useState("");
  const [missingFields, setMissingFields] = useState({});

  const isNonDoc = shipmentType === "Non-Document";
  const isDoc = shipmentType === "Document";

  // ✅ keep boxRows normalized whenever boxesCount changes (non-doc only)
  useEffect(() => {
    if (!isNonDoc) return;

    const count = clampInt(boxesCount || 0, 0, 9999);
    setBoxRows((prev) => normalizeRowsToBoxes(prev, count));
  }, [boxesCount, isNonDoc]);

  // when switching shipment type, reset irrelevant states
  useEffect(() => {
    if (shipmentType === "Document") {
      // reset non-doc fields
      setBoxesCount("");
      setBoxRows([]);
    } else if (shipmentType === "Non-Document") {
      // reset doc field
      setWeight("");
    }
  }, [shipmentType]);

  const validateOriginOnBlur = async () => {
    setOriginTouched(true);

    if (!originPincode) {
      setOriginLoc(null);
      setOriginError("");
      return;
    }

    if (originPincode.length !== 6) {
      setOriginLoc(null);
      setOriginError("Invalid Pincode");
      return;
    }

    try {
      setOriginLoading(true);
      setOriginError("");

      const d = await fetchPincodeDetails(originPincode);
      if (!d) {
        setOriginLoc(null);
        setOriginError("Invalid Pincode");
      } else {
        setOriginLoc(d);
        setOriginError("");
      }
    } catch {
      setOriginLoc(null);
      setOriginError("Invalid Pincode");
    } finally {
      setOriginLoading(false);
    }
  };

  const validateForm = () => {
    const missing = {};

    // required always
    if (!originPincode) missing.originPincode = true;
    if (!destPincode) missing.destPincode = true;
    if (!shipmentType) missing.shipmentType = true;

    // doc/non-doc required fields
    if (shipmentType === "Document") {
      if (!weight) missing.weight = true;
    }

    if (shipmentType === "Non-Document") {
      if (!boxesCount || Number(boxesCount) < 1) missing.boxesCount = true;

      // if boxes exist, validate rows
      const count = clampInt(boxesCount || 0, 0, 9999);
      if (count > 0) {
        boxRows.forEach((r, idx) => {
          if (!r.weight) missing[`row_${idx}_weight`] = true;
          if (!r.length) missing[`row_${idx}_length`] = true;
          if (!r.breadth) missing[`row_${idx}_breadth`] = true;
          if (!r.height) missing[`row_${idx}_height`] = true;
        });
      }
    }

    setMissingFields(missing);

    // any missing?
    if (Object.keys(missing).length > 0) {
      setFormError("All fields are required");
      return false;
    }

    setFormError("");
    return true;
  };

  const validateDestOnBlur = async () => {
    setDestTouched(true);

    if (!destPincode) {
      setDestLoc(null);
      setDestError("");
      return;
    }

    if (destPincode.length !== 6) {
      setDestLoc(null);
      setDestError("Invalid Pincode");
      return;
    }

    try {
      setDestLoading(true);
      setDestError("");

      const d = await fetchPincodeDetails(destPincode);
      if (!d) {
        setDestLoc(null);
        setDestError("Invalid Pincode");
      } else {
        setDestLoc(d);
        setDestError("");
      }
    } catch {
      setDestLoc(null);
      setDestError("Invalid Pincode");
    } finally {
      setDestLoading(false);
    }
  };

  const handleReset = () => {
    setOriginPincode("");
    setDestPincode("");
    setShipmentType("");
    setWeight("");

    setBoxesCount("");
    setBoxRows([]);

    setOriginLoc(null);
    setDestLoc(null);

    setOriginLoading(false);
    setDestLoading(false);

    setOriginError("");
    setDestError("");

    setOriginTouched(false);
    setDestTouched(false);

    onResetAll?.();
  };

  const showRoute =
    originLoc?.city &&
    originLoc?.state &&
    destLoc?.city &&
    destLoc?.state &&
    !originError &&
    !destError;

  // ✅ Change quantity logic: sum must stay = boxesCount
  const handleQtyChange = (rowIndex, nextQtyRaw) => {
    const count = clampInt(boxesCount || 0, 0, 9999);
    if (count < 1) return;

    setBoxRows((prev) => {
      let rows = normalizeRowsToBoxes(prev, count);
      if (!rows[rowIndex]) return rows;

      // desired qty
      let nextQty = clampInt(nextQtyRaw, 1, 999999);
      rows[rowIndex].qty = nextQty;

      // normalize again so total qty becomes count
      rows = normalizeRowsToBoxes(rows, count);

      // Ensure the edited row doesn't get deleted (edge case)
      if (!rows[rowIndex]) return rows;

      return rows;
    });
  };

  const handleRowFieldChange = (rowIndex, key, value) => {
    setBoxRows((prev) => {
      const copy = [...prev];
      if (!copy[rowIndex]) return prev;
      copy[rowIndex] = { ...copy[rowIndex], [key]: value };
      return copy;
    });
  };

  const handleGetQuotation = () => {
    const ok = validateForm();
    if (!ok) return;

    // ✅ Example computed rates
    const computedRates = [
      {
        carrier: "sKart Domestic North",
        serviceName: "Standard",
        productType: "VENP160",
        cost: 44,
        tatDays: 0,
        chargeableWeight: Number(weight || 1).toFixed(2),
      },
      {
        carrier: "BlueDart Surface",
        serviceName: "Surface",
        productType: "SURF",
        cost: 62,
        tatDays: 2,
        chargeableWeight: Number(weight || 1).toFixed(2),
      },
    ];

    onRatesCalculated?.(computedRates, {
      origin: originPincode,
      destination: destPincode,
      shipmentType,
    });
  };

  return (
    <>
      {/* ✅ Route Preview */}
      {showRoute ? (
        <div className="pb-4">
          <div className="rounded-md bg-[#fff7e6] border border-[#fde6b3] px-6 py-5">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <div className="text-left">
                <div className="text-sm font-medium text-[#111827]">
                  City : <span className="font-bold">{originLoc.city}</span>
                </div>
                <div className="text-sm font-medium text-[#111827] mt-1">
                  State : <span className="font-bold">{originLoc.state}</span>
                </div>
              </div>

              <div className="relative w-20 h-10 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-[slideRight_1.2s_linear_infinite] text-[#f2b632]">
                    <ChevronsRight className="h-10 w-10" />
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-medium text-[#111827]">
                  City : <span className="font-bold">{destLoc.city}</span>
                </div>
                <div className="text-sm font-medium text-[#111827] mt-1">
                  State : <span className="font-bold">{destLoc.state}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="ORIGIN PINCODE"
          required
          invalid={missingFields.originPincode}
          icon={<MapPin className="h-4 w-4 text-[#6b7280]" />}
          hint={
            originTouched
              ? originLoading
                ? "Validating..."
                : originError
                ? originError
                : ""
              : ""
          }
          hintType={originError ? "error" : "muted"}
        >
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={originPincode}
            onChange={(e) => {
              setOriginPincode(e.target.value.replace(/\D/g, ""));
              setOriginError("");
              setOriginLoc(null);
            }}
            onBlur={validateOriginOnBlur}
            placeholder="Enter origin pincode"
            className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
          />
        </Field>

        <Field
          label="DESTINATION PINCODE"
          required
          invalid={missingFields.destPincode}
          icon={<Map className="h-4 w-4 text-[#6b7280]" />}
          hint={
            destTouched
              ? destLoading
                ? "Validating..."
                : destError
                ? destError
                : ""
              : ""
          }
          hintType={destError ? "error" : "muted"}
        >
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={destPincode}
            onChange={(e) => {
              setDestPincode(e.target.value.replace(/\D/g, ""));
              setDestError("");
              setDestLoc(null);
            }}
            onBlur={validateDestOnBlur}
            placeholder="Enter destination pincode"
            className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
          />
        </Field>

        {/* Shipment Type */}
        <Field
          label="SHIPMENT TYPE"
          required
          invalid={missingFields.shipmentType}
          icon={<Package className="h-4 w-4 text-[#6b7280]" />}
        >
          <div className="relative w-full">
            <div className="absolute inset-0 rounded-none opacity-60" />
            <select
              value={shipmentType}
              onChange={(e) => setShipmentType(e.target.value)}
              className={[
                "relative z-10 h-11 w-full appearance-none bg-transparent",
                "px-4 pr-12 text-sm tracking-wide text-[#111827]",
                "outline-none cursor-pointer",
              ].join(" ")}
            >
              <option value="" disabled className="font-semibold">
                Select shipment type
              </option>
              <option value="Document">Document</option>
              <option value="Non-Document">Non-Document</option>
            </select>

            <div className="pointer-events-none absolute right-0 top-0 h-full flex items-center">
              <div className="mr-3 grid h-8 w-8 place-items-center rounded-lg">
                <ChevronDown className="h-4 w-4 text-[#b45309]" />
              </div>
            </div>
          </div>
        </Field>

        {/* ✅ Document => Weight | ✅ Non-Doc => Boxes count */}
        {isDoc ? (
          <Field
            label="WEIGHT (kg)"
            required
            invalid={missingFields.weight}
            icon={<Scale className="h-4 w-4 text-[#6b7280]" />}
          >
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Enter weight"
              className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
            />
          </Field>
        ) : isNonDoc ? (
          <Field
            label="NUMBER OF BOXES  "
            required
            invalid={missingFields.boxesCount}
            icon={<Boxes className="h-4 w-4 text-[#6b7280]" />}
          >
            <input
              type="number"
              min={1}
              value={boxesCount}
              onChange={(e) => {
                const v = e.target.value;
                setBoxesCount(v);
              }}
              placeholder="Enter number of boxes"
              className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
            />
          </Field>
        ) : (
          // if shipmentType not selected, keep same layout
          <Field
            label="WEIGHT (kg)"
            required
            invalid={missingFields.weight}
            icon={<Scale className="h-4 w-4 text-[#6b7280]" />}
          >
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Enter weight"
              className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
            />
          </Field>
        )}
      </div>

      {/* ✅ Non-doc rows (minimal) */}
      {isNonDoc && clampInt(boxesCount || 0, 0, 9999) > 0 ? (
        <div className="mt-4 space-y-3">
          {boxRows.map((row, idx) => (
            <div
              key={idx}
              className="rounded-md border border-[#e5e7eb] bg-white p-3"
            >
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {/* Qty */}
                <MiniInput
                  label="Qty"
                  type="number"
                  min={1}
                  value={row.qty}
                  onChange={(e) => handleQtyChange(idx, e.target.value)}
                />

                {/* Weight */}
                <MiniInput
                  label="Weight (kg)"
                  type="number"
                  invalid={missingFields[`row_${idx}_weight`]}
                  min={0}
                  value={row.weight}
                  placeholder="kg"
                  onChange={(e) =>
                    handleRowFieldChange(idx, "weight", e.target.value)
                  }
                />

                {/* Length */}
                <MiniInput
                  label="Length (cm)"
                  type="number"
                  invalid={missingFields[`row_${idx}_length`]}
                  min={1}
                  value={row.length}
                  placeholder="cm"
                  onChange={(e) =>
                    handleRowFieldChange(idx, "length", e.target.value)
                  }
                />

                {/* Breadth */}
                <MiniInput
                  label="Breadth (cm)"
                  type="number"
                  invalid={missingFields[`row_${idx}_breadth`]}
                  min={1}
                  value={row.breadth}
                  placeholder="cm"
                  onChange={(e) =>
                    handleRowFieldChange(idx, "breadth", e.target.value)
                  }
                />

                {/* Height */}
                <MiniInput
                  label="Height (cm)"
                  type="number"
                  invalid={missingFields[`row_${idx}_height`]}
                  min={1}
                  value={row.height}
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

      {/* Buttons */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleReset}
          className="w-full rounded-md border border-gray-200 bg-gray-50 py-3 text-sm font-bold text-gray-700 hover:bg-gray-100 transition active:scale-[0.99]"
        >
          Reset
        </button>

        <button
          onClick={handleGetQuotation}
          type="button"
          className="w-full rounded-md bg-white py-3 text-sm font-extrabold text-black border border-black shadow-md transition hover:bg-gray-50 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-black/20"
        >
          Get Quotation
        </button>
      </div>
      {formError ? (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-extrabold text-red-700 tracking-wider">
          {formError}
        </div>
      ) : null}

      <p className="mt-4 text-xs text-gray-500">
        Tip: Enter correct pincode to avoid ODA surprises.
      </p>

      <style>{`
        @keyframes slideRight {
          0%   { transform: translateX(-16px); opacity: 0.4; }
          20%  { opacity: 1; }
          50%  { transform: translateX(0px);  opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateX(16px); opacity: 0.4; }
        }
      `}</style>
    </>
  );
}

function Field({
  label,
  required,
  icon,
  hint,
  hintType = "muted",
  invalid,
  children,
}) {
  const hintClass =
    hintType === "error"
      ? "text-red-600"
      : hintType === "success"
      ? "text-emerald-700"
      : "text-gray-500";

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <label className="block text-sm font-bold text-[#111827] tracking-wide">
          {label} {required && <span className="text-red-500">*</span>}
        </label>

        {hint ? (
          <span className={`text-[11px] font-bold ${hintClass}`}>{hint}</span>
        ) : null}
      </div>

      <div
        className={[
          "mt-2 flex items-center overflow-hidden rounded-md bg-white shadow-sm",
          invalid
            ? "border border-red-300 focus-within:ring-2 focus-within:ring-red-200"
            : "border border-[#dbeafe] focus-within:ring-2 focus-within:ring-[#f2b632]/40",
        ].join(" ")}
      >
        <div
          className={[
            "grid h-11 w-11 place-items-center border-r bg-white",
            invalid ? "border-red-200" : "border-[#dbeafe]",
          ].join(" ")}
        >
          {icon}
        </div>
        {children}
      </div>
    </div>
  );
}
