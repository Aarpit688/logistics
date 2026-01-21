import React, { useEffect, useMemo, useState } from "react";
import {
  Scale,
  Ruler,
  IndianRupee,
  PackageCheck,
  Boxes,
  Hash,
  ChevronDown,
  Plus,
  Trash2,
} from "lucide-react";

/* ✅ ---------- helpers ---------- */
function clampInt(val, min, max) {
  const n = Number(val);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function safeNum(v) {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
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

/* ✅ export constants */
const SHIPMENT_TYPES = [
  { value: "CSB-IV", label: "CSB-IV" },
  { value: "CSB-V", label: "CSB-V" },
  { value: "ECOMMERCE", label: "ECOMMERCE" },
  { value: "DOCUMENT", label: "DOCUMENT" },
  { value: "SAMPLE", label: "SAMPLE" },
  { value: "GIFT", label: "GIFT" },
];

const TERMS_OPTIONS = ["DDU", "DDP", "CIF", "C&F", "DAP"];
const EXPORT_FORMATS = [
  { value: "B2B", label: "B2B" },
  { value: "B2C", label: "B2C" },
];

function makeGoodsRow(boxNo = 1) {
  return {
    boxNo,
    description: "",
    hsnCode: "",
    qty: "",
    unit: "PCS",
    rate: "",
    amount: 0,
  };
}

export default function BookShipmentExportStep2({
  data,
  onChange,
  onNext,
  onBack,
}) {
  const extra = data?.extra || {};

  /** ✅ payload */
  const units = extra.units || {};
  const exportDetails = extra.exportDetails || {};
  const boxes = extra.boxes || {};
  const goods = extra.goods || {};

  /** ✅ units */
  const weightUnit = units.weightUnit || "KG";
  const currencyUnit = units.currencyUnit || "INR";
  const dimensionUnit = units.dimensionUnit || "CM";

  /** ✅ shipment type + optional ref */
  const shipmentType = exportDetails.shipmentType || "CSB-IV";
  const isDocument = shipmentType === "DOCUMENT";
  const referenceNumber = exportDetails.referenceNumber || "";

  /** ✅ document weight */
  const docWeight = exportDetails.docWeight ?? "";

  /** ✅ boxes */
  const boxesCount = boxes.boxesCount ?? "";
  const boxRows = boxes.rows ?? [];

  /** ✅ goods rows */
  const goodsRows = Array.isArray(goods.rows) ? goods.rows : [];

  /** ✅ invoice/export */
  const termsOfInvoice = exportDetails.termsOfInvoice || "";
  const invoiceNumber = exportDetails.invoiceNumber || "";
  const invoiceDate = exportDetails.invoiceDate || "";
  const gstInvoice = exportDetails.gstInvoice ?? false;
  const exportReason = exportDetails.exportReason || "";
  const exportFormat = exportDetails.exportFormat || "B2B";

  /** UI */
  const [missingFields, setMissingFields] = useState({});
  const [formError, setFormError] = useState("");

  /** patch helpers */
  const patchExtra = (patch) => {
    onChange?.({
      extra: {
        ...extra,
        ...patch,
      },
    });
  };

  const patchUnits = (patch) => patchExtra({ units: { ...units, ...patch } });
  const patchExportDetails = (patch) =>
    patchExtra({ exportDetails: { ...exportDetails, ...patch } });
  const patchBoxes = (patch) => patchExtra({ boxes: { ...boxes, ...patch } });
  const patchGoods = (patch) => patchExtra({ goods: { ...goods, ...patch } });

  /** ✅ document mode cleanup */
  useEffect(() => {
    setMissingFields({});
    setFormError("");

    if (isDocument) {
      // clear non-doc fields
      patchBoxes({ boxesCount: "", rows: [], totalWeight: 0 });
      patchGoods({ rows: [] });
      patchExportDetails({
        termsOfInvoice: "",
        invoiceNumber: "",
        invoiceDate: "",
        gstInvoice: false,
        exportReason: "",
        exportFormat: "B2B",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipmentType]);

  /** ✅ total weight */
  const totalWeightBoxes = useMemo(() => {
    return boxRows.reduce((sum, r) => {
      const qty = Number(r.qty || 0);
      const wt = Number(r.weight || 0);
      if (Number.isNaN(qty) || Number.isNaN(wt)) return sum;
      return sum + qty * wt;
    }, 0);
  }, [boxRows]);

  /** ✅ normalize box rows */
  useEffect(() => {
    if (isDocument) return;

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
  }, [boxesCount, boxRows, isDocument]);

  /** ✅ save total weight */
  useEffect(() => {
    if (isDocument) return;
    patchBoxes({ totalWeight: Number(totalWeightBoxes.toFixed(2)) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalWeightBoxes, isDocument]);

  /** ✅ Ensure at least 1 content per box (auto-create) */
  useEffect(() => {
    if (isDocument) return;

    const count = clampInt(boxesCount || 0, 0, 9999);
    if (count < 1) {
      if (goodsRows.length) patchGoods({ rows: [] });
      return;
    }

    const grouped = {};
    goodsRows.forEach((r) => {
      const b = Number(r.boxNo || 1);
      grouped[b] = grouped[b] || [];
      grouped[b].push(r);
    });

    const next = [];
    for (let boxNo = 1; boxNo <= count; boxNo++) {
      const rowsForBox = grouped[boxNo] || [];
      if (rowsForBox.length === 0) next.push(makeGoodsRow(boxNo));
      else next.push(...rowsForBox);
    }

    const same = JSON.stringify(next) === JSON.stringify(goodsRows);
    if (!same) patchGoods({ rows: next });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxesCount, isDocument]);

  /** ✅ auto compute amount */
  useEffect(() => {
    const next = goodsRows.map((r) => {
      const qty = safeNum(r.qty);
      const rate = safeNum(r.rate);
      return { ...r, amount: Number((qty * rate).toFixed(2)) };
    });

    const same = JSON.stringify(next) === JSON.stringify(goodsRows);
    if (!same) patchGoods({ rows: next });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goodsRows]);

  /** handlers */
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

  const updateGoodsRow = (idx, patch) => {
    const next = [...goodsRows];
    next[idx] = { ...next[idx], ...patch };
    patchGoods({ rows: next });
  };

  const addContentForBox = (boxNo) => {
    const next = [...goodsRows, makeGoodsRow(boxNo)];
    patchGoods({ rows: next });
  };

  const removeGoodsRow = (idx) => {
    const row = goodsRows[idx];
    const boxNo = Number(row?.boxNo || 1);

    const remaining = goodsRows.filter((_, i) => i !== idx);

    // ensure at least 1 row per box
    const stillHas = remaining.some((r) => Number(r.boxNo || 1) === boxNo);
    const count = clampInt(boxesCount || 0, 0, 9999);

    const finalRows = [...remaining];
    if (!stillHas && boxNo >= 1 && boxNo <= count) {
      finalRows.push(makeGoodsRow(boxNo));
    }

    patchGoods({ rows: finalRows });
  };

  /** ✅ validation */
  const validateStep2 = () => {
    const missing = {};

    // Units always required
    if (!weightUnit) missing.weightUnit = true;

    // Document flow
    if (isDocument) {
      const w = Number(docWeight);
      if (!docWeight || Number.isNaN(w) || w <= 0) missing.docWeight = true;

      setMissingFields(missing);
      if (Object.keys(missing).length) {
        setFormError("All fields are required");
        return false;
      }
      setFormError("");
      return true;
    }

    // non-document units
    if (!currencyUnit) missing.currencyUnit = true;
    if (!dimensionUnit) missing.dimensionUnit = true;

    // shipment type
    if (!shipmentType) missing.shipmentType = true;

    // boxes
    const count = clampInt(boxesCount || 0, 0, 9999);
    if (!boxesCount || Number.isNaN(count) || count <= 0)
      missing.boxesCount = true;

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

    // goods
    goodsRows.forEach((r, idx) => {
      if (!r.description) missing[`goods_${idx}_description`] = true;
      if (!r.hsnCode) missing[`goods_${idx}_hsnCode`] = true;
      if (!r.qty || safeNum(r.qty) <= 0) missing[`goods_${idx}_qty`] = true;
      if (!r.rate || safeNum(r.rate) <= 0) missing[`goods_${idx}_rate`] = true;
      if (!r.unit) missing[`goods_${idx}_unit`] = true;
    });

    // invoice/export
    if (!termsOfInvoice) missing.termsOfInvoice = true;
    if (!invoiceNumber) missing.invoiceNumber = true;
    if (!invoiceDate) missing.invoiceDate = true;
    if (!exportReason) missing.exportReason = true;
    if (!exportFormat) missing.exportFormat = true;

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

  /** group goods by box */
  const goodsByBox = useMemo(() => {
    const map = {};
    goodsRows.forEach((r, idx) => {
      const b = Number(r.boxNo || 1);
      map[b] = map[b] || [];
      map[b].push({ row: r, index: idx });
    });
    return map;
  }, [goodsRows]);

  const countBoxes = clampInt(boxesCount || 0, 0, 9999);

  return (
    <>
      {/* ✅ Title */}
      <div className="mb-4">
        <h3 className="text-base font-extrabold text-black tracking-wide">
          Export Shipment Details
        </h3>
      </div>

      {/* ✅ Weight Unit ALWAYS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

        {/* ✅ Document: show weight only */}
        {isDocument ? (
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
                patchExportDetails({
                  docWeight: e.target.value.replace(/[^\d.]/g, ""),
                })
              }
              placeholder="Enter document weight"
              className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
            />
          </Field>
        ) : (
          <>
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
                onChange={(e) => patchUnits({ dimensionUnit: e.target.value })}
                className="h-11 w-full bg-transparent px-4 text-sm font-bold text-[#111827] outline-none"
              >
                <option value="CM">CM</option>
                <option value="INCH">INCH</option>
              </select>
            </Field>
          </>
        )}
      </div>

      {/* ✅ Shipment type + optional ref */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="SHIPMENT TYPE"
          required
          invalid={missingFields.shipmentType}
          icon={<PackageCheck className="h-4 w-4 text-[#6b7280]" />}
        >
          <div className="relative w-full">
            <select
              value={shipmentType}
              onChange={(e) =>
                patchExportDetails({ shipmentType: e.target.value })
              }
              className="h-11 w-full appearance-none bg-transparent px-4 pr-10 text-sm font-extrabold text-[#111827] outline-none"
            >
              {SHIPMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          </div>
        </Field>

        {/* ✅ reference NOT required */}
        <Field
          label="REFERENCE NO / ORDER ID (OPTIONAL)"
          required={false}
          invalid={false}
          icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
        >
          <input
            type="text"
            value={referenceNumber}
            onChange={(e) =>
              patchExportDetails({ referenceNumber: e.target.value })
            }
            placeholder="Enter reference no"
            className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
          />
        </Field>
      </div>

      {/* ✅ if DOCUMENT stop here */}
      {isDocument ? (
        <>
          <div className="mt-6 flex items-center justify-between gap-3">
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
      ) : null}

      {/* ✅ NON DOCUMENT FIELDS */}
      {!isDocument ? (
        <>
          {/* ✅ Invoice / Export fields */}
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="TERMS OF INVOICE"
              required
              invalid={missingFields.termsOfInvoice}
              icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
            >
              <div className="relative w-full">
                <select
                  value={termsOfInvoice}
                  onChange={(e) =>
                    patchExportDetails({ termsOfInvoice: e.target.value })
                  }
                  className="h-11 w-full appearance-none bg-transparent px-4 pr-10 text-sm font-extrabold text-[#111827] outline-none"
                >
                  <option value="" disabled>
                    Select Terms
                  </option>
                  {TERMS_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              </div>
            </Field>

            <Field
              label="EXPORT REASON"
              required
              invalid={missingFields.exportReason}
              icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                type="text"
                value={exportReason}
                onChange={(e) =>
                  patchExportDetails({ exportReason: e.target.value })
                }
                placeholder="E.g. Commercial sale"
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
              />
            </Field>

            <Field
              label="INVOICE NUMBER"
              required
              invalid={missingFields.invoiceNumber}
              icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) =>
                  patchExportDetails({ invoiceNumber: e.target.value })
                }
                placeholder="Enter invoice number"
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
              />
            </Field>

            <Field
              label="INVOICE DATE"
              required
              invalid={missingFields.invoiceDate}
              icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) =>
                  patchExportDetails({ invoiceDate: e.target.value })
                }
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none"
              />
            </Field>

            <Field
              label="GST INVOICE?"
              required={false}
              invalid={false}
              icon={<PackageCheck className="h-4 w-4 text-[#6b7280]" />}
            >
              <div className="flex h-11 w-full items-center gap-6 px-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-[#111827]">
                  <input
                    type="radio"
                    name="gstInvoice"
                    value="no"
                    checked={!gstInvoice}
                    onChange={() => patchExportDetails({ gstInvoice: false })}
                    className="h-4 w-4 accent-black"
                  />
                  No
                </label>

                <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-[#111827]">
                  <input
                    type="radio"
                    name="gstInvoice"
                    value="yes"
                    checked={!!gstInvoice}
                    onChange={() => patchExportDetails({ gstInvoice: true })}
                    className="h-4 w-4 accent-black"
                  />
                  Yes
                </label>
              </div>
            </Field>

            <Field
              label="EXPORT FORMAT"
              required
              invalid={missingFields.exportFormat}
              icon={<Boxes className="h-4 w-4 text-[#6b7280]" />}
            >
              <div className="relative w-full">
                <select
                  value={exportFormat}
                  onChange={(e) =>
                    patchExportDetails({ exportFormat: e.target.value })
                  }
                  className="h-11 w-full appearance-none bg-transparent px-4 pr-10 text-sm font-extrabold text-[#111827] outline-none"
                >
                  {EXPORT_FORMATS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              </div>
            </Field>
          </div>
          {/* Boxes + Dimensions */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
              />
            </Field>

            <div />
          </div>

          {clampInt(boxesCount || 0, 0, 9999) > 0 ? (
            <div className="mt-3 space-y-3">
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
                      onChange={(e) =>
                        handleRowFieldChange(idx, "height", e.target.value)
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {/* ✅ Add Description: per box */}
          {countBoxes > 0 ? (
            <div className="mt-5 space-y-4">
              {Array.from({ length: countBoxes }, (_, i) => i + 1).map(
                (boxNo) => {
                  const rows = goodsByBox[boxNo] || [];
                  return (
                    <div
                      key={boxNo}
                      className="rounded-md border border-black/10 bg-white p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-extrabold text-black">
                          Box {boxNo} Contents
                        </div>

                        <button
                          type="button"
                          onClick={() => addContentForBox(boxNo)}
                          className="inline-flex items-center gap-2 rounded-md border border-black/10 bg-gray-50 px-3 py-2 text-xs font-extrabold text-gray-900 hover:bg-gray-100"
                        >
                          <Plus className="h-4 w-4" />
                          Add Content
                        </button>
                      </div>

                      <div className="mt-3 space-y-3">
                        {rows.map(({ row, index }) => (
                          <div
                            key={index}
                            className="rounded-md border border-[#e5e7eb] bg-white p-3"
                          >
                            {/* ✅ 1 line fields */}
                            <div className="grid grid-cols-2 sm:grid-cols-10 gap-3">
                              <div className="sm:col-span-3">
                                <MiniInput
                                  label="Description"
                                  invalid={
                                    missingFields[`goods_${index}_description`]
                                  }
                                  value={row.description}
                                  onChange={(e) =>
                                    updateGoodsRow(index, {
                                      description: e.target.value,
                                    })
                                  }
                                  placeholder="Product name"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <MiniInput
                                  label="HSN Code"
                                  invalid={
                                    missingFields[`goods_${index}_hsnCode`]
                                  }
                                  value={row.hsnCode}
                                  onChange={(e) =>
                                    updateGoodsRow(index, {
                                      hsnCode: e.target.value.replace(
                                        /[^\d]/g,
                                        "",
                                      ),
                                    })
                                  }
                                  placeholder="HSN"
                                />
                              </div>
                              <MiniInput
                                label="Qty"
                                type="number"
                                min={1}
                                invalid={missingFields[`goods_${index}_qty`]}
                                value={row.qty}
                                onChange={(e) =>
                                  updateGoodsRow(index, { qty: e.target.value })
                                }
                              />

                              {/* ✅ unit select PCS/KGS */}
                              <div>
                                <label className="block text-[11px] font-bold text-gray-500 tracking-wide">
                                  Unit
                                </label>
                                <select
                                  value={row.unit}
                                  onChange={(e) =>
                                    updateGoodsRow(index, {
                                      unit: e.target.value,
                                    })
                                  }
                                  className={[
                                    "mt-2 h-10 w-full rounded-md px-3 text-sm font-semibold outline-none bg-white",
                                    missingFields[`goods_${index}_unit`]
                                      ? "border border-red-300 focus:ring-2 focus:ring-red-200"
                                      : "border border-[#e5e7eb] text-[#111827] focus:ring-2 focus:ring-[#f2b632]/30",
                                  ].join(" ")}
                                >
                                  <option value="PCS">PCS</option>
                                  <option value="KGS">KGS</option>
                                </select>
                              </div>

                              <MiniInput
                                label={`Rate (${currencyUnit})`}
                                type="number"
                                min={1}
                                invalid={missingFields[`goods_${index}_rate`]}
                                value={row.rate}
                                onChange={(e) =>
                                  updateGoodsRow(index, {
                                    rate: e.target.value,
                                  })
                                }
                              />

                              <div className="">
                                <label className="block text-[11px] font-bold text-gray-500 tracking-wide">
                                  Amount ({currencyUnit})
                                </label>
                                <div className="mt-2 h-10 w-full rounded-md border border-[#e5e7eb] bg-gray-50 px-3 text-sm font-extrabold text-gray-900 flex items-center">
                                  {Number(row.amount || 0).toFixed(2)}
                                </div>
                              </div>

                              <div className="flex items-end justify-end">
                                <button
                                  type="button"
                                  onClick={() => removeGoodsRow(index)}
                                  className="grid h-10 w-10 place-items-center rounded-md border border-black/10 hover:bg-gray-50"
                                  title="Remove"
                                >
                                  <Trash2 className="h-4 w-4 text-gray-700" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          ) : null}

          {/* Back / Next */}
          <div className="mt-7 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBack}
              className="rounded-md border border-gray-200 bg-gray-gray-50 px-6 py-3 text-sm font-extrabold text-gray-700 hover:bg-gray-100 transition active:scale-[0.99]"
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
