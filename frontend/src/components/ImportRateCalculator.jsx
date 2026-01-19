import React, { useEffect, useMemo, useState } from "react";
import { MapPin, Map, Package, Scale, ChevronDown, Boxes } from "lucide-react";

// ✅ India Post API (only for India destination pincode)
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
  // ✅ Import fields
  const [destPincode, setDestPincode] = useState(""); // India
  const [originCountry, setOriginCountry] = useState("");
  const [originZipcode, setOriginZipcode] = useState("");

  const destinationCountry = "India"; // fixed

  // ✅ Shipment
  const [shipmentType, setShipmentType] = useState("");
  const [weight, setWeight] = useState("");

  // ✅ Non-doc
  const [boxesCount, setBoxesCount] = useState("");
  const [boxRows, setBoxRows] = useState([]);

  // ✅ Dest location lookup (India pincode)
  const [destLoc, setDestLoc] = useState(null);
  const [destLoading, setDestLoading] = useState(false);
  const [destError, setDestError] = useState("");
  const [destTouched, setDestTouched] = useState(false);

  // ✅ Origin ZIP basic validation only
  const [originZipTouched, setOriginZipTouched] = useState(false);
  const [originZipError, setOriginZipError] = useState("");

  // ✅ Countries
  const [countries, setCountries] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(false);

  // ✅ Errors
  const [formError, setFormError] = useState("");
  const [missingFields, setMissingFields] = useState({});

  const isNonDoc = shipmentType === "Non-Document";
  const isDoc = shipmentType === "Document";

  // ✅ TOTAL WEIGHT for Non-Doc = sum(qty * row.weight)
  const totalWeightNonDoc = useMemo(() => {
    return boxRows.reduce((sum, r) => {
      const qty = Number(r.qty || 0);
      const wt = Number(r.weight || 0);
      if (Number.isNaN(qty) || Number.isNaN(wt)) return sum;
      return sum + qty * wt;
    }, 0);
  }, [boxRows]);

  // ✅ Load countries
  useEffect(() => {
    let cancelled = false;

    async function loadCountries() {
      try {
        setCountriesLoading(true);

        const res = await fetch(
          "https://restcountries.com/v3.1/all?fields=name,cca2",
        );
        const data = await res.json();

        if (cancelled) return;

        const list = (Array.isArray(data) ? data : [])
          .map((c) => ({
            name: c?.name?.common || "",
            code: c?.cca2 || "",
          }))
          .filter((c) => c.name && c.code)
          .sort((a, b) => a.name.localeCompare(b.name));

        setCountries(list);
      } catch (err) {
        if (!cancelled) setCountries([]);
      } finally {
        if (!cancelled) setCountriesLoading(false);
      }
    }

    loadCountries();
    return () => {
      cancelled = true;
    };
  }, []);

  // ✅ keep boxRows normalized whenever boxesCount changes (non-doc only)
  useEffect(() => {
    if (!isNonDoc) return;

    const count = clampInt(boxesCount || 0, 0, 9999);
    setBoxRows((prev) => normalizeRowsToBoxes(prev, count));
  }, [boxesCount, isNonDoc]);

  // when switching shipment type, reset irrelevant states
  useEffect(() => {
    if (shipmentType === "Document") {
      setBoxesCount("");
      setBoxRows([]);
    } else if (shipmentType === "Non-Document") {
      setWeight("");
    }
  }, [shipmentType]);

  // ✅ Destination pincode blur -> India Post API
  const validateDestOnBlur = async () => {
    setDestTouched(true);

    if (!destPincode) {
      setDestLoc(null);
      setDestError("Required");
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

  const validateOriginZipOnBlur = () => {
    setOriginZipTouched(true);

    if (!originZipcode) {
      setOriginZipError("Required");
      return;
    }

    setOriginZipError("");
  };

  const validateForm = () => {
    const missing = {};

    // required always
    if (!destPincode) missing.destPincode = true;
    if (!shipmentType) missing.shipmentType = true;
    if (!originCountry) missing.originCountry = true;
    if (originCountry && !originZipcode) missing.originZipcode = true;

    // Destination pincode errors
    if (destError) missing.destPincode = true;
    if (originZipError) missing.originZipcode = true;

    // Doc required
    if (shipmentType === "Document") {
      if (!weight || Number(weight) <= 0) missing.weight = true;
    }

    // Non-doc required
    if (shipmentType === "Non-Document") {
      const count = clampInt(boxesCount || 0, 0, 9999);
      const totWt = Number(totalWeightNonDoc);

      if (!boxesCount || Number.isNaN(count) || count < 1)
        missing.boxesCount = true;

      // ✅ total weight must be > 0
      if (!totWt || Number.isNaN(totWt) || totWt <= 0)
        missing.totalWeightNonDoc = true;

      if (count > 0) {
        boxRows.forEach((r, idx) => {
          if (!r.weight || Number(r.weight) <= 0)
            missing[`row_${idx}_weight`] = true;
          if (!r.length || Number(r.length) <= 0)
            missing[`row_${idx}_length`] = true;
          if (!r.breadth || Number(r.breadth) <= 0)
            missing[`row_${idx}_breadth`] = true;
          if (!r.height || Number(r.height) <= 0)
            missing[`row_${idx}_height`] = true;
        });
      }
    }

    setMissingFields(missing);

    if (Object.keys(missing).length > 0) {
      setFormError("All fields are required");
      return false;
    }

    setFormError("");
    return true;
  };

  const handleReset = () => {
    setDestPincode("");
    setDestLoc(null);
    setDestError("");
    setDestTouched(false);

    setOriginCountry("");
    setOriginZipcode("");
    setOriginZipTouched(false);
    setOriginZipError("");

    setShipmentType("");
    setWeight("");

    setBoxesCount("");
    setBoxRows([]);

    setFormError("");
    setMissingFields({});

    onResetAll?.();
  };

  const handleQtyChange = (rowIndex, nextQtyRaw) => {
    const count = clampInt(boxesCount || 0, 0, 9999);
    if (count < 1) return;

    setBoxRows((prev) => {
      let rows = normalizeRowsToBoxes(prev, count);
      if (!rows[rowIndex]) return rows;

      let nextQty = clampInt(nextQtyRaw, 1, 999999);
      rows[rowIndex].qty = nextQty;

      rows = normalizeRowsToBoxes(rows, count);
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

    const computedRates = [
      {
        carrier: "Import Service",
        serviceName: "Standard",
        productType: "IMPRT",
        cost: 120,
        tatDays: 3,
        chargeableWeight: isNonDoc
          ? totalWeightNonDoc.toFixed(2)
          : Number(weight || 1).toFixed(2),
        breakup: [
          { label: "FUEL SURCHARGE", amount: 20 },
          { label: "FREIGHT", amount: 100 },
        ],
      },
    ];

    const metaPayload = {
      calculatorType: "import",

      shipmentType,

      destinationCountry,
      destinationPincode: destPincode,
      destLoc,

      originCountry,
      originZipcode,

      // doc
      weight,

      // non-doc
      boxesCount,
      boxRows,
      totalWeightNonDoc: totalWeightNonDoc.toFixed(2),

      // derived
      chargeableWeight: isNonDoc
        ? totalWeightNonDoc.toFixed(2)
        : Number(weight || 1).toFixed(2),

      createdAt: new Date().toISOString(),
    };

    onRatesCalculated?.(computedRates, metaPayload);
  };

  const showOriginZip = !!originCountry;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* ✅ DESTINATION COUNTRY (Fixed: India) */}
        <Field
          label="DESTINATION COUNTRY"
          required
          icon={<Map className="h-4 w-4 text-[#6b7280]" />}
          hintType="success"
        >
          <div className="relative w-full">
            <input
              value="India"
              disabled
              className="h-11 w-full px-4 text-sm font-extrabold text-[#111827] bg-gray-50 outline-none cursor-not-allowed"
            />

            <div className="pointer-events-none absolute right-0 top-0 h-full flex items-center">
              <div className="mr-3 grid h-8 w-8 place-items-center rounded-lg">
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </Field>

        {/* ✅ DESTINATION PINCODE (India Post validation) */}
        <Field
          label="DESTINATION PINCODE"
          required
          invalid={missingFields.destPincode}
          icon={<MapPin className="h-4 w-4 text-[#6b7280]" />}
          hint={
            destTouched
              ? destLoading
                ? "Validating..."
                : destError
                  ? destError
                  : destLoc
                    ? `${destLoc.city}, ${destLoc.state}`
                    : ""
              : ""
          }
          hintType={
            destTouched
              ? destError
                ? "error"
                : destLoc
                  ? "success"
                  : "muted"
              : "muted"
          }
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

        {/* ✅ ORIGIN COUNTRY */}
        <Field
          label="ORIGIN COUNTRY"
          required
          invalid={missingFields.originCountry}
          icon={<Map className="h-4 w-4 text-[#6b7280]" />}
        >
          <div className="relative w-full">
            <select
              value={originCountry}
              onChange={(e) => {
                setOriginCountry(e.target.value);
                setOriginZipcode("");
                setOriginZipTouched(false);
                setOriginZipError("");
                setMissingFields((p) => ({ ...p, originCountry: false }));
              }}
              className={[
                "relative z-10 h-11 w-full appearance-none bg-transparent",
                "px-4 pr-12 text-sm tracking-wide text-[#111827]",
                "outline-none cursor-pointer",
              ].join(" ")}
            >
              <option value="" disabled>
                {countriesLoading ? "Loading..." : "Select origin country"}
              </option>

              {countries.map((c) => (
                <option key={c.code} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            <div className="pointer-events-none absolute right-0 top-0 h-full flex items-center">
              <div className="mr-3 grid h-8 w-8 place-items-center rounded-lg">
                <ChevronDown className="h-4 w-4 text-[#b45309]" />
              </div>
            </div>
          </div>
        </Field>

        {/* ✅ ORIGIN ZIPCODE */}
        {showOriginZip ? (
          <Field
            label="ORIGIN ZIPCODE"
            required
            invalid={missingFields.originZipcode}
            icon={<MapPin className="h-4 w-4 text-[#6b7280]" />}
            hint={originZipTouched ? originZipError : ""}
            hintType={originZipError ? "error" : "muted"}
          >
            <input
              type="text"
              value={originZipcode}
              onChange={(e) => {
                setOriginZipcode(e.target.value);
                setOriginZipError("");
              }}
              onBlur={validateOriginZipOnBlur}
              placeholder="Enter origin zipcode"
              className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
            />
          </Field>
        ) : null}

        {/* Shipment Type */}
        <Field
          label="SHIPMENT TYPE"
          required
          invalid={missingFields.shipmentType}
          icon={<Package className="h-4 w-4 text-[#6b7280]" />}
        >
          <div className="relative w-full">
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

        {/* ✅ Document => Weight | ✅ Non-Doc => Boxes */}
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
            label="NUMBER OF BOXES"
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
                const n = clampInt(v || 0, 0, 9999);
                setBoxesCount(n === 0 ? "" : String(n));
              }}
              placeholder="Enter number of boxes"
              className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
            />
          </Field>
        ) : (
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

      {/* ✅ Non-doc mini rows */}
      {isNonDoc && clampInt(boxesCount || 0, 0, 9999) > 0 ? (
        <div className="mt-4 space-y-3">
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
                  onChange={(e) => handleQtyChange(idx, e.target.value)}
                />
                <MiniInput
                  label="Weight (kg)"
                  type="number"
                  min={0}
                  invalid={missingFields[`row_${idx}_weight`]}
                  value={row.weight}
                  placeholder="kg"
                  onChange={(e) =>
                    handleRowFieldChange(idx, "weight", e.target.value)
                  }
                />
                <MiniInput
                  label="Length (cm)"
                  type="number"
                  min={1}
                  invalid={missingFields[`row_${idx}_length`]}
                  value={row.length}
                  placeholder="cm"
                  onChange={(e) =>
                    handleRowFieldChange(idx, "length", e.target.value)
                  }
                />
                <MiniInput
                  label="Breadth (cm)"
                  type="number"
                  min={1}
                  invalid={missingFields[`row_${idx}_breadth`]}
                  value={row.breadth}
                  placeholder="cm"
                  onChange={(e) =>
                    handleRowFieldChange(idx, "breadth", e.target.value)
                  }
                />
                <MiniInput
                  label="Height (cm)"
                  type="number"
                  min={1}
                  invalid={missingFields[`row_${idx}_height`]}
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
        Tip: Destination pincode is validated with India Post.
      </p>
    </>
  );
}

/* --- Field UI same as Export component --- */
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
      <label className="block text-sm font-bold text-[#111827] tracking-wide">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

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

      {hint ? (
        <p className={`mt-2 text-[11px] font-bold ${hintClass}`}>{hint}</p>
      ) : (
        <div className="mt-2 h-[14px]" />
      )}
    </div>
  );
}
