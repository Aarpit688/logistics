import React, { useEffect, useMemo, useState } from "react";
import {
  Scale,
  Ruler,
  IndianRupee,
  PackageCheck,
  Boxes,
  Hash,
} from "lucide-react";

/* ✅ ---------- helpers (copied from calculator) ---------- */
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

export default function BookShipmentDomesticStep2({
  data,
  onChange,
  onNext,
  onBack,
}) {
  const extra = data?.extra || {};
  const shipmentFromStep1 = data?.shipment || {};

  // ✅ Step1 shipment type
  const shipmentType = shipmentFromStep1.shipmentType || "Document";
  const isNonDocument = shipmentType === "Non-Document";
  const isDocument = shipmentType === "Document";

  const units = extra.units || {};
  const shipment = extra.shipment || {};
  const boxes = extra.boxes || {};

  // ✅ Units
  const weightUnit = units.weightUnit || "KG";
  const currencyUnit = units.currencyUnit || "INR";
  const dimensionUnit = units.dimensionUnit || "CM";

  // ✅ Shipment fields
  const contentDescription = shipment.contentDescription ?? "";
  const declaredValue = shipment.declaredValue ?? "";
  const referenceNumber = shipment.referenceNumber ?? "";
  const isCOD = shipment.isCOD ?? false;

  // ✅ Document-only field
  const docWeight = shipment.docWeight ?? ""; // ✅ store doc weight in shipment

  // ✅ E-waybill logic (only for Non-Doc)
  const declaredValueNum = Number(declaredValue || 0);
  const showEwayBill =
    isNonDocument &&
    !Number.isNaN(declaredValueNum) &&
    declaredValueNum >= 50000;
  const ewaybillNumber = shipment.ewaybillNumber ?? "";

  // ✅ Boxes (Non-Doc only)
  const boxesCount = boxes.boxesCount ?? "";
  const boxRows = boxes.rows ?? [];

  // ✅ Total weight from mini rows
  const totalWeightBoxes = useMemo(() => {
    return boxRows.reduce((sum, r) => {
      const qty = Number(r.qty || 0);
      const wt = Number(r.weight || 0);
      if (Number.isNaN(qty) || Number.isNaN(wt)) return sum;
      return sum + qty * wt;
    }, 0);
  }, [boxRows]);

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

  const patchUnits = (patch) => patchExtra({ units: { ...units, ...patch } });
  const patchShipment = (patch) =>
    patchExtra({ shipment: { ...shipment, ...patch } });
  const patchBoxes = (patch) => patchExtra({ boxes: { ...boxes, ...patch } });

  /* ✅ Non-document: normalize box rows */
  useEffect(() => {
    if (!isNonDocument) return;

    const count = clampInt(boxesCount || 0, 0, 9999);

    if (!count || count < 1) {
      if (boxRows.length) patchBoxes({ rows: [], totalWeight: 0 });
      return;
    }

    const normalized = normalizeRowsToBoxes(boxRows, count);

    const same =
      normalized.length === boxRows.length &&
      normalized.every(
        (r, i) => JSON.stringify(r) === JSON.stringify(boxRows[i]),
      );

    if (!same) patchBoxes({ rows: normalized });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxesCount, boxRows, isNonDocument]);

  /* ✅ Non-document: store totalWeight */
  useEffect(() => {
    if (!isNonDocument) return;
    patchBoxes({ totalWeight: Number(totalWeightBoxes.toFixed(2)) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalWeightBoxes, isNonDocument]);

  /* ✅ clear ewaybill when not required */
  useEffect(() => {
    if (!showEwayBill && ewaybillNumber) patchShipment({ ewaybillNumber: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showEwayBill]);

  /* ✅ Reset irrelevant data when switching type */
  useEffect(() => {
    setMissingFields({});
    setFormError("");

    if (isDocument) {
      // clear non-doc-only
      patchBoxes({ boxesCount: "", rows: [], totalWeight: 0 });
      patchShipment({
        contentDescription: "",
        declaredValue: "",
        isCOD: false,
        ewaybillNumber: "",
      });
    } else if (isNonDocument) {
      // clear doc-only
      patchShipment({ docWeight: "" });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipmentType]);

  const handleQtyChange = (rowIndex, nextQtyRaw) => {
    const count = clampInt(boxesCount || 0, 0, 9999);
    if (count < 1) return;

    let rows = normalizeRowsToBoxes(boxRows, count);
    if (!rows[rowIndex]) return;

    rows[rowIndex].qty = clampInt(nextQtyRaw, 1, 999999);
    rows = normalizeRowsToBoxes(rows, count);

    patchBoxes({ rows });
  };

  const handleRowFieldChange = (rowIndex, key, value) => {
    const copy = [...boxRows];
    if (!copy[rowIndex]) return;
    copy[rowIndex] = { ...copy[rowIndex], [key]: value };
    patchBoxes({ rows: copy });
  };

  const validateStep2 = () => {
    const missing = {};

    // ✅ Document validations
    if (isDocument) {
      const w = Number(docWeight);
      if (!docWeight || Number.isNaN(w) || w <= 0) missing.docWeight = true;
    }

    // ✅ Non-document validations
    if (isNonDocument) {
      if (!weightUnit) missing.weightUnit = true;
      if (!currencyUnit) missing.currencyUnit = true;
      if (!dimensionUnit) missing.dimensionUnit = true;

      if (!contentDescription) missing.contentDescription = true;

      const v = Number(declaredValue);
      if (!declaredValue || Number.isNaN(v) || v <= 0)
        missing.declaredValue = true;

      const count = clampInt(boxesCount || 0, 0, 9999);
      if (!boxesCount || Number.isNaN(count) || count <= 0)
        missing.boxesCount = true;

      if (showEwayBill) {
        if (!ewaybillNumber || ewaybillNumber.length < 6)
          missing.ewaybillNumber = true;
      }

      if (count > 0) {
        if (!totalWeightBoxes || totalWeightBoxes <= 0)
          missing.totalWeightBoxes = true;

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

      {/* ✅ DOCUMENT VIEW */}
      {isDocument ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label={`WEIGHT (${weightUnit})`}
            required
            invalid={missingFields.docWeight}
            icon={<Scale className="h-4 w-4 text-[#6b7280]" />}
          >
            <input
              type="text"
              inputMode="decimal"
              value={docWeight}
              onChange={(e) =>
                patchShipment({
                  docWeight: e.target.value.replace(/[^\d.]/g, ""),
                })
              }
              placeholder="Enter document weight"
              className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
            />
          </Field>

          <Field
            label="REFERENCE NUMBER"
            invalid={missingFields.referenceNumber}
            icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
          >
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) =>
                patchShipment({ referenceNumber: e.target.value })
              }
              placeholder="Enter reference number"
              className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
            />
          </Field>
        </div>
      ) : null}

      {/* ✅ NON DOCUMENT VIEW */}
      {isNonDocument ? (
        <>
          {/* Units selection */}
          <div className="rounded-md">
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field
                label="WEIGHT UNIT"
                required
                invalid={missingFields.weightUnit}
                icon={<Scale className="h-4 w-4 text-[#6b7280]" />}
              >
                <select
                  value={weightUnit}
                  onChange={(e) => patchUnits({ weightUnit: e.target.value })}
                  className="h-11 w-full bg-transparent px-4 text-sm font-bold text-[#111827] outline-none"
                >
                  <option value="KG">KG</option>
                  <option value="GM">GM</option>
                </select>
              </Field>

              <Field
                label="CURRENCY"
                required
                invalid={missingFields.currencyUnit}
                icon={<IndianRupee className="h-4 w-4 text-[#6b7280]" />}
              >
                <select
                  value={currencyUnit}
                  onChange={(e) => patchUnits({ currencyUnit: e.target.value })}
                  className="h-11 w-full bg-transparent px-4 text-sm font-bold text-[#111827] outline-none"
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </Field>

              <Field
                label="DIMENSION UNIT"
                required
                invalid={missingFields.dimensionUnit}
                icon={<Ruler className="h-4 w-4 text-[#6b7280]" />}
              >
                <select
                  value={dimensionUnit}
                  onChange={(e) =>
                    patchUnits({ dimensionUnit: e.target.value })
                  }
                  className="h-11 w-full bg-transparent px-4 text-sm font-bold text-[#111827] outline-none"
                >
                  <option value="CM">CM</option>
                  <option value="INCH">INCH</option>
                </select>
              </Field>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Number of boxes */}
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
                onChange={(e) => patchBoxes({ boxesCount: e.target.value })}
                placeholder="Enter number of boxes"
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
              />
            </Field>

            <Field
              label={`TOTAL WEIGHT (${weightUnit})`}
              required
              invalid={!!missingFields.totalWeightBoxes}
              icon={<Scale className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                readOnly
                value={totalWeightBoxes.toFixed(2)}
                className="h-11 w-full px-4 text-sm font-extrabold text-gray-900 outline-none bg-gray-50 cursor-not-allowed"
                placeholder="0.00"
              />
            </Field>

            <div />

            {/* Mini fields */}
            {clampInt(boxesCount || 0, 0, 9999) > 0 ? (
              <div className="mt-4 space-y-3 col-span-3">
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
                        label={`Weight (${weightUnit})`}
                        type="number"
                        invalid={missingFields[`row_${idx}_weight`]}
                        min={0}
                        value={row.weight}
                        placeholder={weightUnit.toLowerCase()}
                        onChange={(e) =>
                          handleRowFieldChange(idx, "weight", e.target.value)
                        }
                      />

                      <MiniInput
                        label={`Length (${dimensionUnit})`}
                        type="number"
                        invalid={missingFields[`row_${idx}_length`]}
                        min={1}
                        value={row.length}
                        placeholder={dimensionUnit.toLowerCase()}
                        onChange={(e) =>
                          handleRowFieldChange(idx, "length", e.target.value)
                        }
                      />

                      <MiniInput
                        label={`Breadth (${dimensionUnit})`}
                        type="number"
                        invalid={missingFields[`row_${idx}_breadth`]}
                        min={1}
                        value={row.breadth}
                        placeholder={dimensionUnit.toLowerCase()}
                        onChange={(e) =>
                          handleRowFieldChange(idx, "breadth", e.target.value)
                        }
                      />

                      <MiniInput
                        label={`Height (${dimensionUnit})`}
                        type="number"
                        invalid={missingFields[`row_${idx}_height`]}
                        min={1}
                        value={row.height}
                        placeholder={dimensionUnit.toLowerCase()}
                        onChange={(e) =>
                          handleRowFieldChange(idx, "height", e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Shipment content */}
            <Field
              label="SHIPMENT CONTENT"
              required
              invalid={missingFields.contentDescription}
              icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                type="text"
                value={contentDescription}
                onChange={(e) =>
                  patchShipment({ contentDescription: e.target.value })
                }
                placeholder="E.g. Mobile accessories"
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
              />
            </Field>

            {/* Shipment value */}
            <Field
              label={`SHIPMENT VALUE (${currencyUnit})`}
              required
              invalid={missingFields.declaredValue}
              icon={<IndianRupee className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                type="text"
                inputMode="numeric"
                value={declaredValue}
                onChange={(e) =>
                  patchShipment({
                    declaredValue: e.target.value.replace(/[^\d]/g, ""),
                  })
                }
                placeholder="Enter declared shipment value"
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
              />
            </Field>

            {/* E-WayBill */}
            {showEwayBill ? (
              <Field
                label="E-WAYBILL NUMBER"
                required
                invalid={missingFields.ewaybillNumber}
                icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
              >
                <input
                  type="text"
                  value={ewaybillNumber}
                  onChange={(e) =>
                    patchShipment({
                      ewaybillNumber: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  placeholder="Enter E-waybill number"
                  className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
                />
              </Field>
            ) : (
              <div />
            )}

            {/* Reference number */}
            <Field
              label="REFERENCE NUMBER"
              invalid={missingFields.referenceNumber}
              icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) =>
                  patchShipment({ referenceNumber: e.target.value })
                }
                placeholder="Enter reference number"
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
              />
            </Field>

            {/* Is COD */}
            <Field
              label="IS COD?"
              required={false}
              invalid={false}
              icon={<PackageCheck className="h-4 w-4 text-[#6b7280]" />}
            >
              <div className="flex h-11 w-full items-center gap-6 px-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-[#111827]">
                  <input
                    type="radio"
                    name="isCOD"
                    value="no"
                    checked={!isCOD}
                    onChange={() => patchShipment({ isCOD: false })}
                    className="h-4 w-4 accent-black"
                  />
                  No
                </label>

                <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-[#111827]">
                  <input
                    type="radio"
                    name="isCOD"
                    value="yes"
                    checked={!!isCOD}
                    onChange={() => patchShipment({ isCOD: true })}
                    className="h-4 w-4 accent-black"
                  />
                  Yes
                </label>
              </div>
            </Field>
          </div>
        </>
      ) : null}

      {/* Back / Next */}
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

/** ✅ Field component unchanged */
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
