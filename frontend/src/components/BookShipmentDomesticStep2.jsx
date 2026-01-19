import React, { useState } from "react";
import { Scale, Ruler, IndianRupee, PackageCheck } from "lucide-react";

export default function BookShipmentDomesticStep2({
  data,
  onChange,
  onNext,
  onBack,
}) {
  const extra = data?.extra || {}; // store unit selection and shipment details in extra

  // ✅ Units
  const weightUnit = extra.weightUnit || "KG";
  const currencyUnit = extra.currencyUnit || "INR";
  const dimensionUnit = extra.dimensionUnit || "CM";

  // ✅ Shipment detail fields
  const weight = extra.weight || "";
  const length = extra.length || "";
  const breadth = extra.breadth || "";
  const height = extra.height || "";
  const invoiceValue = extra.invoiceValue || "";
  const pieces = extra.pieces || "1";

  const [missingFields, setMissingFields] = useState({});
  const [formError, setFormError] = useState("");

  // ✅ helper
  const patchExtra = (patch) => {
    onChange?.({
      extra: {
        ...extra,
        ...patch,
      },
    });
  };

  const validateStep2 = () => {
    const missing = {};

    // ✅ Units required
    if (!weightUnit) missing.weightUnit = true;
    if (!currencyUnit) missing.currencyUnit = true;
    if (!dimensionUnit) missing.dimensionUnit = true;

    // ✅ Basic shipment detail validation
    if (!weight) missing.weight = true;
    if (!invoiceValue) missing.invoiceValue = true;
    if (!pieces) missing.pieces = true;

    // Dimensions optional? If required, uncomment below
    if (!length) missing.length = true;
    if (!breadth) missing.breadth = true;
    if (!height) missing.height = true;

    setMissingFields(missing);

    if (Object.keys(missing).length > 0) {
      setFormError("All fields are required");
      return false;
    }

    setFormError("");
    return true;
  };

  const handleNext = () => {
    const ok = validateStep2();
    if (!ok) return;
    onNext?.();
  };

  return (
    <>
      {/* ✅ Title */}
      <div className="mb-5">
        <h3 className="text-base font-extrabold text-black tracking-wide">
          Shipment Details
        </h3>
      </div>

      {/* ✅ Units selection */}
      <div className="rounded-md">
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Weight Unit */}
          <Field
            label="WEIGHT UNIT"
            required
            invalid={missingFields.weightUnit}
            icon={<Scale className="h-4 w-4 text-[#6b7280]" />}
          >
            <select
              value={weightUnit}
              onChange={(e) => patchExtra({ weightUnit: e.target.value })}
              className="h-11 w-full bg-transparent px-4 text-sm font-bold text-[#111827] outline-none"
            >
              <option value="KG">KG</option>
              <option value="GM">GM</option>
            </select>
          </Field>

          {/* Currency Unit */}
          <Field
            label="CURRENCY"
            required
            invalid={missingFields.currencyUnit}
            icon={<IndianRupee className="h-4 w-4 text-[#6b7280]" />}
          >
            <select
              value={currencyUnit}
              onChange={(e) => patchExtra({ currencyUnit: e.target.value })}
              className="h-11 w-full bg-transparent px-4 text-sm font-bold text-[#111827] outline-none"
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </Field>

          {/* Dimension Unit */}
          <Field
            label="DIMENSION UNIT"
            required
            invalid={missingFields.dimensionUnit}
            icon={<Ruler className="h-4 w-4 text-[#6b7280]" />}
          >
            <select
              value={dimensionUnit}
              onChange={(e) => patchExtra({ dimensionUnit: e.target.value })}
              className="h-11 w-full bg-transparent px-4 text-sm font-bold text-[#111827] outline-none"
            >
              <option value="CM">CM</option>
              <option value="INCH">INCH</option>
            </select>
          </Field>
        </div>
      </div>

      {/* ✅ Other shipment details */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label={`INVOICE VALUE (${currencyUnit})`}
          required
          invalid={missingFields.invoiceValue}
          icon={<IndianRupee className="h-4 w-4 text-[#6b7280]" />}
        >
          <input
            type="text"
            inputMode="numeric"
            value={invoiceValue}
            onChange={(e) =>
              patchExtra({
                invoiceValue: e.target.value.replace(/[^\d]/g, ""),
              })
            }
            placeholder="Enter invoice value"
            className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
          />
        </Field>
        <Field
          label={`WEIGHT (${weightUnit})`}
          required
          invalid={missingFields.weight}
          icon={<Scale className="h-4 w-4 text-[#6b7280]" />}
        >
          <input
            type="text"
            inputMode="decimal"
            value={weight}
            onChange={(e) =>
              patchExtra({ weight: e.target.value.replace(/[^\d.]/g, "") })
            }
            placeholder="Enter weight"
            className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
          />
        </Field>

        <Field
          label="NO. OF PIECES"
          required
          invalid={missingFields.pieces}
          icon={<PackageCheck className="h-4 w-4 text-[#6b7280]" />}
        >
          <input
            type="text"
            inputMode="numeric"
            value={pieces}
            onChange={(e) =>
              patchExtra({ pieces: e.target.value.replace(/\D/g, "") })
            }
            placeholder="Enter pieces"
            className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
          />
        </Field>

        <Field
          label={`LENGTH (${dimensionUnit})`}
          required
          invalid={missingFields.length}
          icon={<Ruler className="h-4 w-4 text-[#6b7280]" />}
        >
          <input
            type="text"
            inputMode="decimal"
            value={length}
            onChange={(e) =>
              patchExtra({ length: e.target.value.replace(/[^\d.]/g, "") })
            }
            placeholder="Enter length"
            className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
          />
        </Field>

        <Field
          label={`BREADTH (${dimensionUnit})`}
          required
          invalid={missingFields.breadth}
          icon={<Ruler className="h-4 w-4 text-[#6b7280]" />}
        >
          <input
            type="text"
            inputMode="decimal"
            value={breadth}
            onChange={(e) =>
              patchExtra({ breadth: e.target.value.replace(/[^\d.]/g, "") })
            }
            placeholder="Enter breadth"
            className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
          />
        </Field>

        <Field
          label={`HEIGHT (${dimensionUnit})`}
          required
          invalid={missingFields.height}
          icon={<Ruler className="h-4 w-4 text-[#6b7280]" />}
        >
          <input
            type="text"
            inputMode="decimal"
            value={height}
            onChange={(e) =>
              patchExtra({ height: e.target.value.replace(/[^\d.]/g, "") })
            }
            placeholder="Enter height"
            className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
          />
        </Field>
      </div>

      {/* ✅ Back / Next */}
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
          onClick={handleNext}
          className="rounded-md bg-black px-7 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-gray-900 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-black/20"
        >
          Next
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

/** ✅ same Field component as Step1 */
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
      <label className="block text-sm font-bold tracking-wide text-[#111827]">
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
