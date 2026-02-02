import React, { useEffect, useMemo, useState } from "react";
import {
  Scale,
  Boxes,
  Hash,
  ChevronDown,
  Plus,
  Clock,
  PackageCheck,
  Weight,
  ChevronUp,
  X,
  IndianRupee,
  Loader2,
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

function normalizeRowsToBoxes(rows, boxesCount) {
  const safe = rows.map((r) => ({
    qty: clampInt(r.qty ?? 1, 1, 999999),
    weight: r.weight ?? "",
    length: r.length ?? "",
    breadth: r.breadth ?? "",
    height: r.height ?? "",
  }));

  if (!boxesCount || boxesCount < 1) return [];

  let total = safe.reduce((a, r) => a + r.qty, 0);

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
    total++;
  }

  while (total > boxesCount && safe.length) {
    const last = safe[safe.length - 1];
    if (last.qty > 1) {
      last.qty--;
      total--;
    } else {
      safe.pop();
      total--;
    }
  }

  return safe;
}

function ensureGoodsRows(count, existingRows) {
  const c = clampInt(count || 1, 1, 9999);
  const base = Array.isArray(existingRows) ? existingRows : [];

  let filtered = base.filter((r) => Number(r?.boxNo || 1) <= c);

  const grouped = {};
  filtered.forEach((r) => {
    const b = Number(r?.boxNo || 1);
    grouped[b] = (grouped[b] || 0) + 1;
  });

  for (let b = 1; b <= c; b++) {
    if (!grouped[b]) filtered.push(makeGoodsRow(b));
  }

  filtered.sort((a, b) => Number(a.boxNo || 1) - Number(b.boxNo || 1));
  return filtered;
}

/* ✅ dropdowns */
const EXPORT_FORMATS = [
  { value: "B2B", label: "B2B" },
  { value: "B2C", label: "B2C" },
  { value: "C2C", label: "C2C" }, // Added C2C
];
const TERMS_OPTIONS = [
  "CFR (Cost & Freight)",
  "CIF (Cost, Insurance & Freight)",
  "DDP (Delivery Duty Paid)",
  "DDU (Delivery Duty Unpaid)",
  "DAP (Delivered At Place)",
  "EXW (Ex Works)",
];
const EXPORT_REASONS = [
  { value: "SAMPLE", label: "Samples Not for Sale" },
  { value: "PERSONAL", label: "Personal Not For Resale" },
  { value: "GIFT", label: "Bonafide Gift" },
  { value: "SALE", label: "Sale of Goods" },
  { value: "RETURN_REPAIR", label: "Return for Repair" },
  { value: "RETURN_AFTER_REPAIR", label: "Return after Repair" },
];

export default function BookShipmentExportStep2({
  data,
  isLoadingRates,
  onChange,
  onNext,
  onBack,
}) {
  const shipment = data?.shipment || {};
  const extra = data?.extra || {};

  const shipmentMainType = shipment.shipmentMainType || "NON_DOCUMENT";
  const nonDocCategory = shipment.nonDocCategory || "COURIER";
  const isDocument = shipmentMainType === "DOCUMENT";

  const rates = Array.isArray(data?.rates) ? data.rates : [];
  const selectedRate = data?.selectedRate || null;

  const units = extra.units || {};
  const exportDetails = extra.exportDetails || {};
  const boxes = extra.boxes || {};
  const goods = extra.goods || {};

  const weightUnit = units.weightUnit || "KG";
  const dimensionUnit = units.dimensionUnit || "CM";

  const referenceNumber = exportDetails.referenceNumber || "";
  const exportFormat = exportDetails.exportFormat || "B2B";

  const docWeight = exportDetails.docWeight ?? "";
  const generalGoodsDescription = exportDetails.generalGoodsDescription || "";

  const termsOfInvoice = exportDetails.termsOfInvoice || "";
  const invoiceNumber = exportDetails.invoiceNumber || "";
  const invoiceDate = exportDetails.invoiceDate || "";
  const gstInvoice = exportDetails.gstInvoice ?? false;
  const exportReason = exportDetails.exportReason || "";

  const isCommercialOrCSBV =
    String(nonDocCategory || "").toUpperCase() === "COMMERCIAL" ||
    String(nonDocCategory || "").toUpperCase() === "CSBV";

  const iecNumber = exportDetails.iecNumber || "";
  const lutIgst = exportDetails.lutIgst || "";
  const lutNumber = exportDetails.lutNumber || "";
  const lutIssueDate = exportDetails.lutIssueDate || "";
  const totalIgst = exportDetails.totalIgst || "";
  const bankAccNumber = exportDetails.bankAccNumber || "";
  const bankIFSC = exportDetails.bankIFSC || "";
  const bankADCode = exportDetails.bankADCode || "";
  const firmType = exportDetails.firmType || "";
  const nfei = exportDetails.nfei ?? false;

  const fobValue = exportDetails.fobValue || "";
  const freightCharges = exportDetails.freightCharges || "";
  const insurance = exportDetails.insurance || "";
  const otherCharges = exportDetails.otherCharges || "";
  const otherChargeName = exportDetails.otherChargeName || "";

  const boxesCountRaw = boxes.boxesCount ?? "";
  const boxesCount = clampInt(boxesCountRaw || 1, 1, 9999);

  const boxRows = Array.isArray(boxes.rows) ? boxes.rows : [];
  const goodsRows = Array.isArray(goods.rows) ? goods.rows : [];

  const [missingFields, setMissingFields] = useState({});
  const [formError, setFormError] = useState("");

  const [showRates, setShowRates] = useState(false);
  const [selectedId, setSelectedId] = useState(selectedRate?.id || "");
  const [expandedId, setExpandedId] = useState("");

  const [openDimsModal, setOpenDimsModal] = useState(false);
  const [openGoodsModal, setOpenGoodsModal] = useState(false);

  const [dimInvalid, setDimInvalid] = useState({});
  const [goodsInvalid, setGoodsInvalid] = useState({});

  const patchExtra = (patch) => onChange?.({ extra: { ...extra, ...patch } });
  const patchExportDetails = (patch) =>
    patchExtra({ exportDetails: { ...exportDetails, ...patch } });
  const patchBoxes = (patch) => patchExtra({ boxes: { ...boxes, ...patch } });
  const patchGoods = (patch) => patchExtra({ goods: { ...goods, ...patch } });

  // Lock page scroll when any modal is open
  useEffect(() => {
    const isOpen = openDimsModal || openGoodsModal;
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [openDimsModal, openGoodsModal]);

  // Ensure non-doc starts with 1 box by default
  useEffect(() => {
    if (isDocument) return;
    if (!boxes.boxesCount || Number(boxes.boxesCount) < 1) {
      patchBoxes({ boxesCount: "1" });
    }
  }, [isDocument]);

  // Cleanup when flow changes (based on Step1 type)
  useEffect(() => {
    setMissingFields({});
    setFormError("");
    setShowRates(false);
    setExpandedId("");
    setSelectedId(selectedRate?.id || "");

    if (isDocument) {
      patchBoxes({ boxesCount: "", rows: [], totalWeight: 0 });
      patchGoods({ rows: [] });
    }
  }, [shipmentMainType]);

  // Auto compute goods amount (non-doc only)
  useEffect(() => {
    if (isDocument) return;

    const next = goodsRows.map((r) => {
      const qty = safeNum(r.qty);
      const rate = safeNum(r.rate);
      const amount = Number((qty * rate).toFixed(2));
      return { ...r, amount };
    });

    const changed = next.some(
      (r, i) => Number(r.amount || 0) !== Number(goodsRows[i]?.amount || 0),
    );

    if (changed) patchGoods({ rows: next });
  }, [goodsRows, isDocument]);

  const pickedRate = useMemo(() => {
    return rates.find((r) => r.id === selectedId) || null;
  }, [rates, selectedId]);

  const patchSelection = (rate) => onChange?.({ selectedRate: rate });

  const handleCardClick = (rate) => {
    setSelectedId(rate.id);
    patchSelection(rate);
    setFormError("");
  };

  const handleToggleBreakup = (rateId) => {
    setExpandedId((prev) => (prev === rateId ? "" : rateId));
  };

  const validateDocumentDetails = () => {
    const missing = {};
    if (!exportFormat) missing.exportFormat = true;

    const w = Number(docWeight);
    if (!docWeight || Number.isNaN(w) || w <= 0) missing.docWeight = true;
    if (!generalGoodsDescription) missing.generalGoodsDescription = true;

    setMissingFields(missing);
    if (Object.keys(missing).length) {
      setFormError("Please fill the highlighted fields");
      return false;
    }
    setFormError("");
    return true;
  };

  const validateDimsRows = () => {
    const bad = {};
    boxRows.forEach((r, idx) => {
      const rowBad = {};
      if (safeNum(r.weight) <= 0) rowBad.weight = true;
      if (safeNum(r.length) <= 0) rowBad.length = true;
      if (safeNum(r.breadth) <= 0) rowBad.breadth = true;
      if (safeNum(r.height) <= 0) rowBad.height = true;
      if (safeNum(r.qty) <= 0) rowBad.qty = true;
      if (Object.keys(rowBad).length) bad[idx] = rowBad;
    });
    setDimInvalid(bad);
    return Object.keys(bad).length === 0;
  };

  const validateGoodsRows = () => {
    const bad = {};
    goodsRows.forEach((r, idx) => {
      const rowBad = {};
      if (!String(r.description || "").trim()) rowBad.description = true;
      if (!String(r.hsnCode || "").trim()) rowBad.hsnCode = true;
      if (safeNum(r.qty) <= 0) rowBad.qty = true;
      if (safeNum(r.rate) < 0) rowBad.rate = true;
      if (Object.keys(rowBad).length) bad[idx] = rowBad;
    });
    setGoodsInvalid(bad);
    return Object.keys(bad).length === 0;
  };

  const validateNonDocDetails = () => {
    const missing = {};
    if (!exportFormat) missing.exportFormat = true;
    if (!termsOfInvoice) missing.termsOfInvoice = true;
    if (!exportReason) missing.exportReason = true;
    if (!invoiceNumber) missing.invoiceNumber = true;
    if (!invoiceDate) missing.invoiceDate = true;
    if (boxesCount < 1) missing.boxesCount = true;
    if (!generalGoodsDescription) missing.generalGoodsDescription = true;

    if (isCommercialOrCSBV) {
      if (!iecNumber) missing.iecNumber = true;
      if (!lutIgst) missing.lutIgst = true;
      if (lutIgst === "LUT") {
        if (!lutNumber) missing.lutNumber = true;
        if (!lutIssueDate) missing.lutIssueDate = true;
      }
      if (lutIgst === "IGST") {
        if (!totalIgst) missing.totalIgst = true;
      }
      if (!bankAccNumber) missing.bankAccNumber = true;
      if (!bankIFSC) missing.bankIFSC = true;
      if (!bankADCode) missing.bankADCode = true;
      if (!firmType) missing.firmType = true;
      if (!fobValue) missing.fobValue = true;
      if (!freightCharges) missing.freightCharges = true;
      if (!insurance) missing.insurance = true;
      if (!otherCharges) missing.otherCharges = true;
      if (!otherChargeName) missing.otherChargeName = true;
    }

    setMissingFields(missing);
    if (Object.keys(missing).length) {
      setFormError("Please fill the highlighted fields");
      return false;
    }
    const okDims = validateDimsRows();
    const okGoods = validateGoodsRows();
    if (!okDims || !okGoods) {
      setFormError("Please fill all required fields inside the modals");
      return false;
    }
    setFormError("");
    return true;
  };

  const handleCheckRates = () => {
    const ok = isDocument ? validateDocumentDetails() : validateNonDocDetails();
    if (!ok) return;
    setShowRates(true);
    onNext?.({ action: "CHECK_RATES" });
  };

  const handleNext = () => {
    if (!pickedRate) {
      setFormError("Please select a vendor to continue");
      return;
    }
    patchSelection(pickedRate);
    setFormError("");
    onNext?.({ action: "NEXT" });
  };

  const totalActualWeight = useMemo(() => {
    return boxRows.reduce(
      (sum, r) => sum + safeNum(r.qty) * safeNum(r.weight),
      0,
    );
  }, [boxRows]);

  const totalVolumetricWeight = useMemo(() => {
    return boxRows.reduce((sum, r) => {
      const vol =
        (safeNum(r.length) * safeNum(r.breadth) * safeNum(r.height)) / 5000;
      return sum + safeNum(r.qty) * vol;
    }, 0);
  }, [boxRows]);

  const chargeableWeight = useMemo(() => {
    return Math.max(totalActualWeight, totalVolumetricWeight);
  }, [totalActualWeight, totalVolumetricWeight]);

  useEffect(() => {
    if (isDocument) return;
    patchBoxes({
      totalWeight: Number(chargeableWeight.toFixed(2)),
      actualWeight: Number(totalActualWeight.toFixed(2)),
      volumetricWeight: Number(totalVolumetricWeight.toFixed(2)),
    });
  }, [chargeableWeight, isDocument]);

  const updateDimQty = (rowIndex, nextQtyRaw) => {
    patchBoxes({
      rows: normalizeRowsToBoxes(
        boxRows.map((r, i) =>
          i === rowIndex ? { ...r, qty: clampInt(nextQtyRaw, 1, 999999) } : r,
        ),
        boxesCount,
      ),
    });
  };

  const updateDimRow = (idx, patch) => {
    const next = [...boxRows];
    if (!next[idx]) return;
    next[idx] = { ...next[idx], ...patch };
    patchBoxes({ rows: next });
  };

  const addGoodsRowBelow = (idx) => {
    const row = goodsRows[idx];
    const boxNo = Number(row?.boxNo || 1);
    const next = [...goodsRows];
    next.splice(idx + 1, 0, makeGoodsRow(boxNo));
    patchGoods({ rows: next });
  };

  const updateGoodsRow = (idx, patch) => {
    const next = [...goodsRows];
    if (!next[idx]) return;
    next[idx] = { ...next[idx], ...patch };
    patchGoods({ rows: next });
  };

  const removeGoodsRow = (idx) => {
    const row = goodsRows[idx];
    const boxNo = Number(row?.boxNo || 1);
    const remaining = goodsRows.filter((_, i) => i !== idx);
    const stillHas = remaining.some((r) => Number(r.boxNo || 1) === boxNo);
    if (!stillHas) return;
    patchGoods({ rows: remaining });
  };

  return (
    <>
      <div className="mb-4">
        <h3 className="text-base font-extrabold text-black tracking-wide">
          Export Shipment Details
        </h3>
        <div className="mt-2 rounded-md border border-black/10 bg-gray-50 px-4 py-3 text-xs font-extrabold text-gray-700">
          Shipment Type selected:{" "}
          <span className="text-black">
            {shipmentMainType === "DOCUMENT"
              ? "Document"
              : `Non-Document (${nonDocCategory})`}
          </span>
        </div>
      </div>

      {isDocument ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field
              label="REFERENCE NO. (OPTIONAL)"
              required={false}
              invalid={false}
              icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                value={referenceNumber}
                onChange={(e) =>
                  patchExportDetails({ referenceNumber: e.target.value })
                }
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none"
              />
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

            <Field
              label={`WEIGHT (${weightUnit})`}
              required
              invalid={missingFields.docWeight}
              icon={<Scale className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                value={docWeight}
                onChange={(e) =>
                  patchExportDetails({
                    docWeight: e.target.value.replace(/[^\d.]/g, ""),
                  })
                }
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none"
                placeholder="Weight"
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field
              label="GENERAL DESCRIPTION OF GOODS"
              required
              invalid={missingFields.generalGoodsDescription}
              icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                value={generalGoodsDescription}
                onChange={(e) =>
                  patchExportDetails({
                    generalGoodsDescription: e.target.value,
                  })
                }
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none"
              />
            </Field>
          </div>

          {!showRates ? (
            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onBack}
                className="rounded-md border border-gray-200 bg-gray-50 px-6 py-3 text-sm font-extrabold text-gray-700 hover:bg-gray-100"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleCheckRates}
                disabled={isLoadingRates}
                className="flex items-center gap-2 rounded-md bg-black px-7 py-3 text-sm font-extrabold text-white shadow-md hover:bg-gray-900 disabled:opacity-70"
              >
                {isLoadingRates && <Loader2 className="h-4 w-4 animate-spin" />}
                Check Rates
              </button>
            </div>
          ) : null}

          {showRates ? (
            <RatesUI
              rates={rates}
              isLoading={isLoadingRates}
              selectedId={selectedId}
              expandedId={expandedId}
              onCardClick={handleCardClick}
              onToggleBreakup={handleToggleBreakup}
              onBack={onBack}
              onNext={handleNext}
              setShowRates={setShowRates}
            />
          ) : null}

          {formError ? <ErrorText text={formError} /> : null}
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field
              label="REFERENCE NO. (OPTIONAL)"
              required={false}
              invalid={false}
              icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                value={referenceNumber}
                onChange={(e) =>
                  patchExportDetails({ referenceNumber: e.target.value })
                }
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none"
              />
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
                    Select
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
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field
              label="EXPORT REASON"
              required
              invalid={missingFields.exportReason}
              icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
            >
              <div className="relative w-full">
                <select
                  value={exportReason}
                  onChange={(e) =>
                    patchExportDetails({ exportReason: e.target.value })
                  }
                  className="h-11 w-full appearance-none bg-transparent px-4 pr-10 text-sm font-extrabold text-[#111827] outline-none"
                >
                  <option value="" disabled>
                    Select
                  </option>
                  {EXPORT_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              </div>
            </Field>

            <Field
              label="INVOICE NO."
              required
              invalid={missingFields.invoiceNumber}
              icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                value={invoiceNumber}
                onChange={(e) =>
                  patchExportDetails({ invoiceNumber: e.target.value })
                }
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none"
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
          </div>

          {isCommercialOrCSBV ? (
            <>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field
                  label="GST INVOICE?"
                  required
                  invalid={missingFields.gstInvoice}
                  icon={<PackageCheck className="h-4 w-4 text-[#6b7280]" />}
                >
                  <div className="flex h-11 w-full items-center gap-6 px-4">
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-[#111827]">
                      <input
                        type="radio"
                        checked={!gstInvoice}
                        onChange={() =>
                          patchExportDetails({ gstInvoice: false })
                        }
                        className="h-4 w-4 accent-black"
                      />
                      No
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-[#111827]">
                      <input
                        type="radio"
                        checked={!!gstInvoice}
                        onChange={() =>
                          patchExportDetails({ gstInvoice: true })
                        }
                        className="h-4 w-4 accent-black"
                      />
                      Yes
                    </label>
                  </div>
                </Field>

                <Field
                  label="IEC NUMBER"
                  required
                  invalid={missingFields.iecNumber}
                  icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
                >
                  <input
                    value={iecNumber}
                    onChange={(e) =>
                      patchExportDetails({
                        iecNumber: e.target.value.replace(/[^\d]/g, ""),
                      })
                    }
                    className="h-11 w-full px-4 text-sm text-gray-800 outline-none"
                    placeholder="IEC Number"
                  />
                </Field>

                <Field
                  label="LUT / IGST"
                  required
                  invalid={missingFields.lutIgst}
                  icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
                >
                  <div className="relative w-full">
                    <select
                      value={lutIgst}
                      onChange={(e) =>
                        patchExportDetails({ lutIgst: e.target.value })
                      }
                      className="h-11 w-full appearance-none bg-transparent px-4 pr-10 text-sm font-extrabold text-[#111827] outline-none"
                    >
                      <option value="" disabled>
                        Select
                      </option>
                      <option value="LUT">LUT</option>
                      <option value="IGST">IGST</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  </div>
                </Field>
              </div>

              {lutIgst === "LUT" ? (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field
                    label="LUT NUMBER"
                    required
                    invalid={missingFields.lutNumber}
                    icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
                  >
                    <input
                      value={lutNumber}
                      onChange={(e) =>
                        patchExportDetails({ lutNumber: e.target.value })
                      }
                      className="h-11 w-full px-4 text-sm text-gray-800 outline-none"
                    />
                  </Field>

                  <Field
                    label="LUT ISSUE DATE"
                    required
                    invalid={missingFields.lutIssueDate}
                    icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
                  >
                    <input
                      type="date"
                      value={lutIssueDate}
                      onChange={(e) =>
                        patchExportDetails({ lutIssueDate: e.target.value })
                      }
                      className="h-11 w-full px-4 text-sm text-gray-800 outline-none"
                    />
                  </Field>

                  <Field
                    label="NFEI"
                    required={false}
                    invalid={false}
                    icon={<PackageCheck className="h-4 w-4 text-[#6b7280]" />}
                  >
                    <div className="flex h-11 w-full items-center px-4">
                      <label className="flex items-center gap-3 text-sm font-bold text-gray-900">
                        <input
                          type="checkbox"
                          checked={!!nfei}
                          onChange={(e) =>
                            patchExportDetails({ nfei: e.target.checked })
                          }
                          className="h-4 w-4 accent-black"
                        />
                        NFEI
                      </label>
                    </div>
                  </Field>
                </div>
              ) : null}

              {lutIgst === "IGST" ? (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field
                    label="TOTAL IGST"
                    required
                    invalid={missingFields.totalIgst}
                    icon={<IndianRupee className="h-4 w-4 text-[#6b7280]" />}
                  >
                    <input
                      value={totalIgst}
                      onChange={(e) =>
                        patchExportDetails({
                          totalIgst: e.target.value.replace(/[^\d.]/g, ""),
                        })
                      }
                      className="h-11 w-full px-4 text-sm text-gray-800 outline-none"
                    />
                  </Field>
                </div>
              ) : null}

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field
                  label="BANK A/C NUMBER"
                  required
                  invalid={missingFields.bankAccNumber}
                  icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
                >
                  <input
                    value={bankAccNumber}
                    onChange={(e) =>
                      patchExportDetails({ bankAccNumber: e.target.value })
                    }
                    className="h-11 w-full px-4 text-sm text-gray-800 outline-none"
                  />
                </Field>

                <Field
                  label="BANK IFSC"
                  required
                  invalid={missingFields.bankIFSC}
                  icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
                >
                  <input
                    value={bankIFSC}
                    onChange={(e) =>
                      patchExportDetails({
                        bankIFSC: e.target.value.toUpperCase(),
                      })
                    }
                    className="h-11 w-full px-4 text-sm text-gray-800 outline-none"
                  />
                </Field>

                <Field
                  label="BANK AD CODE"
                  required
                  invalid={missingFields.bankADCode}
                  icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
                >
                  <input
                    value={bankADCode}
                    onChange={(e) =>
                      patchExportDetails({ bankADCode: e.target.value })
                    }
                    className="h-11 w-full px-4 text-sm text-gray-800 outline-none"
                  />
                </Field>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field
                  label="FIRM TYPE"
                  required
                  invalid={missingFields.firmType}
                  icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
                >
                  <input
                    value={firmType}
                    onChange={(e) =>
                      patchExportDetails({ firmType: e.target.value })
                    }
                    className="h-11 w-full px-4 text-sm text-gray-800 outline-none"
                    placeholder="Proprietor / Pvt Ltd / LLP etc."
                  />
                </Field>
              </div>

              <div className="mt-5 rounded-md border border-black/10 bg-white p-4">
                <div className="text-sm font-extrabold text-black mb-3">
                  Charges
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="FOB VALUE"
                    required
                    invalid={missingFields.fobValue}
                    icon={<IndianRupee className="h-4 w-4 text-[#6b7280]" />}
                  >
                    <input
                      value={fobValue}
                      onChange={(e) =>
                        patchExportDetails({
                          fobValue: e.target.value.replace(/[^\d.]/g, ""),
                        })
                      }
                      className="h-11 w-full px-4 text-sm text-gray-800 outline-none"
                    />
                  </Field>

                  <Field
                    label="FREIGHT CHARGES"
                    required
                    invalid={missingFields.freightCharges}
                    icon={<IndianRupee className="h-4 w-4 text-[#6b7280]" />}
                  >
                    <input
                      value={freightCharges}
                      onChange={(e) =>
                        patchExportDetails({
                          freightCharges: e.target.value.replace(/[^\d.]/g, ""),
                        })
                      }
                      className="h-11 w-full px-4 text-sm text-gray-800 outline-none"
                    />
                  </Field>

                  <Field
                    label="INSURANCE"
                    required
                    invalid={missingFields.insurance}
                    icon={<IndianRupee className="h-4 w-4 text-[#6b7280]" />}
                  >
                    <input
                      value={insurance}
                      onChange={(e) =>
                        patchExportDetails({
                          insurance: e.target.value.replace(/[^\d.]/g, ""),
                        })
                      }
                      className="h-11 w-full px-4 text-sm text-gray-800 outline-none"
                    />
                  </Field>

                  <Field
                    label="OTHER CHARGES"
                    required
                    invalid={missingFields.otherCharges}
                    icon={<IndianRupee className="h-4 w-4 text-[#6b7280]" />}
                  >
                    <input
                      value={otherCharges}
                      onChange={(e) =>
                        patchExportDetails({
                          otherCharges: e.target.value.replace(/[^\d.]/g, ""),
                        })
                      }
                      className="h-11 w-full px-4 text-sm text-gray-800 outline-none"
                    />
                  </Field>

                  <Field
                    label="OTHER CHARGE NAME"
                    required
                    invalid={missingFields.otherChargeName}
                    icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
                  >
                    <input
                      value={otherChargeName}
                      onChange={(e) =>
                        patchExportDetails({ otherChargeName: e.target.value })
                      }
                      className="h-11 w-full px-4 text-sm text-gray-800 outline-none"
                    />
                  </Field>
                </div>
              </div>
            </>
          ) : null}

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field
              label="NO. OF BOXES"
              required
              invalid={missingFields.boxesCount}
              icon={<Boxes className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                type="number"
                min={1}
                value={boxesCount}
                onChange={(e) =>
                  patchBoxes({
                    boxesCount: clampInt(e.target.value, 1, 9999),
                  })
                }
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none"
              />
            </Field>

            <Field
              label={`TOTAL CHARGEABLE WEIGHT (${weightUnit})`}
              required={false}
              invalid={false}
              icon={<Scale className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                readOnly
                value={Number(chargeableWeight || 0).toFixed(2)}
                className="h-11 w-full cursor-not-allowed bg-gray-50 px-4 text-sm font-extrabold text-gray-900 outline-none"
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
                    checked={!gstInvoice}
                    onChange={() => patchExportDetails({ gstInvoice: false })}
                    className="h-4 w-4 accent-black"
                  />
                  No
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-[#111827]">
                  <input
                    type="radio"
                    checked={!!gstInvoice}
                    onChange={() => patchExportDetails({ gstInvoice: true })}
                    className="h-4 w-4 accent-black"
                  />
                  Yes
                </label>
              </div>
            </Field>
          </div>

          {/* Buttons for Modals */}
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                patchBoxes({
                  rows: normalizeRowsToBoxes(boxRows, boxesCount),
                });
                setOpenDimsModal(true);
              }}
              className="rounded-md border border-black/10 bg-white px-6 py-4 text-sm font-extrabold text-gray-900 shadow-sm hover:bg-gray-50"
            >
              Add Weight & Dimensions
            </button>

            <button
              type="button"
              onClick={() => {
                patchGoods({ rows: ensureGoodsRows(boxesCount, goodsRows) });
                setOpenGoodsModal(true);
              }}
              className="rounded-md border border-black/10 bg-white px-6 py-4 text-sm font-extrabold text-gray-900 shadow-sm hover:bg-gray-50"
            >
              Add Shipment Contents
            </button>
          </div>

          <div className="mt-5">
            <Field
              label="GENERAL DESCRIPTION OF GOODS"
              required
              invalid={missingFields.generalGoodsDescription}
              icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                value={generalGoodsDescription}
                onChange={(e) =>
                  patchExportDetails({
                    generalGoodsDescription: e.target.value,
                  })
                }
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none"
              />
            </Field>
          </div>

          {!showRates ? (
            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onBack}
                className="rounded-md border border-gray-200 bg-gray-50 px-6 py-3 text-sm font-extrabold text-gray-700 hover:bg-gray-100"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleCheckRates}
                disabled={isLoadingRates}
                className="flex items-center gap-2 rounded-md bg-black px-7 py-3 text-sm font-extrabold text-white shadow-md hover:bg-gray-900 disabled:opacity-70"
              >
                {isLoadingRates && <Loader2 className="h-4 w-4 animate-spin" />}
                Check Rates
              </button>
            </div>
          ) : null}

          {showRates ? (
            <RatesUI
              rates={rates}
              isLoading={isLoadingRates}
              selectedId={selectedId}
              expandedId={expandedId}
              onCardClick={handleCardClick}
              onToggleBreakup={handleToggleBreakup}
              onBack={onBack}
              onNext={handleNext}
              setShowRates={setShowRates}
            />
          ) : null}

          {formError ? <ErrorText text={formError} /> : null}

          {/* Modals for Dims and Goods */}
          {openDimsModal ? (
            <Modal
              title="Weight & Dimensions"
              onClose={() => setOpenDimsModal(false)}
            >
              <div className="text-xs font-bold text-gray-600 mb-3">
                Qty based row rebalance is enabled. Sum of qty must match number
                of boxes.
              </div>

              <div className="overflow-auto rounded-md border border-black/10">
                <table className="w-full text-sm min-w-[900px]">
                  <thead className="bg-gray-50 text-[11px] uppercase font-extrabold text-gray-600 tracking-wider">
                    <tr>
                      <th className="px-2 py-3 text-center w-12">#</th>
                      <th className="px-2 py-3 text-left">Qty</th>
                      <th className="px-2 py-3 text-left">
                        Wt. ({weightUnit})
                      </th>
                      <th className="px-2 py-3 text-left">
                        L ({dimensionUnit})
                      </th>
                      <th className="px-2 py-3 text-left">
                        B ({dimensionUnit})
                      </th>
                      <th className="px-2 py-3 text-left">
                        H ({dimensionUnit})
                      </th>
                      <th className="px-2 py-3 text-right bg-gray-100 text-gray-800">
                        Total Chargeable Wt.
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {boxRows.map((r, idx) => {
                      const actual = safeNum(r.qty) * safeNum(r.weight);

                      const volumetric =
                        safeNum(r.qty) *
                        ((safeNum(r.length) *
                          safeNum(r.breadth) *
                          safeNum(r.height)) /
                          5000);

                      const rowChargeableWeight = Math.max(
                        actual,
                        volumetric,
                      ).toFixed(2);

                      const err = dimInvalid[idx] || {};
                      const dimInputClass = (bad) =>
                        [
                          "h-9 w-24 rounded border px-2 font-bold outline-none",
                          bad
                            ? "border-red-400 focus:border-red-600"
                            : "border-gray-300 focus:border-black",
                        ].join(" ");

                      return (
                        <tr key={idx}>
                          <td className="px-2 py-2 text-center font-extrabold text-gray-700">
                            {idx + 1}
                          </td>

                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min={1}
                              value={r.qty}
                              onChange={(e) =>
                                updateDimQty(idx, e.target.value)
                              }
                              className="h-9 w-16 rounded border px-2 font-bold text-center"
                            />
                          </td>

                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min={0}
                              value={r.weight}
                              onChange={(e) =>
                                updateDimRow(idx, { weight: e.target.value })
                              }
                              className={dimInputClass(err.weight)}
                            />
                          </td>

                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min={0}
                              value={r.length}
                              onChange={(e) =>
                                updateDimRow(idx, { length: e.target.value })
                              }
                              className={dimInputClass(err.length)}
                            />
                          </td>

                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min={0}
                              value={r.breadth}
                              onChange={(e) =>
                                updateDimRow(idx, { breadth: e.target.value })
                              }
                              className={dimInputClass(err.breadth)}
                            />
                          </td>

                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min={0}
                              value={r.height}
                              onChange={(e) =>
                                updateDimRow(idx, { height: e.target.value })
                              }
                              className={dimInputClass(err.height)}
                            />
                          </td>

                          <td className="px-2 py-2 text-right bg-gray-50 font-extrabold">
                            {rowChargeableWeight}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setOpenDimsModal(false)}
                  className="rounded-md bg-black px-8 py-2.5 text-sm font-extrabold text-white hover:bg-gray-800 shadow-sm"
                >
                  Save Dimensions
                </button>
              </div>
            </Modal>
          ) : null}

          {openGoodsModal ? (
            <Modal
              title="Shipment Contents"
              onClose={() => setOpenGoodsModal(false)}
            >
              <div className="text-xs font-bold text-gray-600 mb-3">
                Minimum 1 row per box. Auto synced with box count.
              </div>

              <div className="overflow-auto rounded-md border border-black/10">
                <table className="w-full text-sm min-w-[900px]">
                  <thead className="bg-gray-50 text-[11px] uppercase font-extrabold text-gray-600 tracking-wider">
                    <tr>
                      <th className="px-2 py-3 text-center w-14">Box</th>
                      <th className="px-2 py-3 text-left">Description</th>
                      <th className="px-2 py-3 text-left w-32">HSN</th>
                      <th className="px-2 py-3 text-left w-20">Qty</th>
                      <th className="px-2 py-3 text-left w-24">Unit</th>
                      <th className="px-2 py-3 text-left w-28">Rate</th>
                      <th className="px-2 py-3 text-left w-28">Amt.</th>
                      <th className="px-2 py-3 text-center w-20">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {goodsRows.map((r, idx) => {
                      const boxNo = Number(r.boxNo || 1);
                      const canDelete =
                        goodsRows.filter((x) => Number(x.boxNo || 1) === boxNo)
                          .length > 1;

                      const err = goodsInvalid[idx] || {};
                      const goodsInputClass = (bad) =>
                        [
                          "h-9 w-full rounded border px-2 outline-none",
                          bad
                            ? "border-red-400 focus:border-red-600"
                            : "border-gray-300 focus:border-black",
                        ].join(" ");

                      return (
                        <tr key={idx}>
                          <td className="px-2 py-2 text-center font-extrabold">
                            {boxNo}
                          </td>

                          <td className="px-2 py-2">
                            <input
                              value={r.description}
                              onChange={(e) =>
                                updateGoodsRow(idx, {
                                  description: e.target.value,
                                })
                              }
                              className={goodsInputClass(err.description)}
                            />
                          </td>

                          <td className="px-2 py-2">
                            <input
                              value={r.hsnCode}
                              onChange={(e) =>
                                updateGoodsRow(idx, {
                                  hsnCode: e.target.value.replace(/[^\d]/g, ""),
                                })
                              }
                              className={goodsInputClass(err.hsnCode)}
                            />
                          </td>

                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min={1}
                              value={r.qty}
                              onChange={(e) =>
                                updateGoodsRow(idx, { qty: e.target.value })
                              }
                              className={[
                                goodsInputClass(err.qty),
                                "font-bold text-center",
                              ].join(" ")}
                            />
                          </td>

                          <td className="px-2 py-2">
                            <select
                              value={r.unit}
                              onChange={(e) =>
                                updateGoodsRow(idx, { unit: e.target.value })
                              }
                              className="h-9 w-full rounded border border-gray-300 bg-white px-2 text-xs font-bold outline-none focus:border-black"
                            >
                              <option value="PCS">PCS</option>
                              <option value="KGS">KGS</option>
                              <option value="BOX">BOX</option>
                              <option value="SET">SET</option>
                            </select>
                          </td>

                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min={0}
                              value={r.rate}
                              onChange={(e) =>
                                updateGoodsRow(idx, { rate: e.target.value })
                              }
                              className={goodsInputClass(err.rate)}
                            />
                          </td>

                          <td className="px-2 py-2">
                            <div className="h-9 w-full rounded border border-gray-200 bg-gray-50 px-2 flex items-center font-extrabold text-gray-700">
                              {Number(r.amount || 0).toFixed(2)}
                            </div>
                          </td>

                          <td className="px-2 py-2 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => addGoodsRowBelow(idx)}
                                className="grid h-8 w-8 place-items-center rounded-md border border-gray-200 hover:bg-black hover:text-white"
                              >
                                <Plus className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => removeGoodsRow(idx)}
                                disabled={!canDelete}
                                className={[
                                  "grid h-8 w-8 place-items-center rounded-md border transition",
                                  canDelete
                                    ? "border-red-100 hover:bg-red-600 hover:text-white"
                                    : "border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed",
                                ].join(" ")}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setOpenGoodsModal(false)}
                  className="rounded-md bg-black px-8 py-2.5 text-sm font-extrabold text-white hover:bg-gray-800 shadow-sm"
                >
                  Save Contents
                </button>
              </div>
            </Modal>
          ) : null}
        </>
      )}
    </>
  );
}

/** * ✅ Rates UI - Enhanced Table Layout */
function RatesUI({
  rates,
  isLoading,
  selectedId,
  expandedId,
  onCardClick,
  onToggleBreakup,
  onBack,
  onNext,
  setShowRates,
}) {
  if (isLoading) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center rounded-md border border-black/10 bg-white py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <p className="mt-4 text-sm font-bold text-gray-600">
          Fetching best rates from vendors...
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm font-extrabold text-black">
          Select Vendor Rate
        </div>
        <button
          type="button"
          onClick={() => setShowRates(false)}
          className="text-xs font-extrabold text-blue-600 hover:underline"
        >
          Modify Details
        </button>
      </div>

      {rates.length === 0 ? (
        <div className="rounded-md border border-black/10 bg-white p-6 text-center text-sm font-extrabold text-gray-700">
          No rates found for this shipment criteria.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500 font-bold">
              <tr>
                <th className="px-6 py-4 text-left">Vendor</th>
                <th className="px-6 py-4 text-center">TAT</th>
                <th className="px-6 py-4 text-center">Weight</th>
                <th className="px-6 py-4 text-right">Total Price</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rates.map((rate) => {
                const isSelected = rate.id === selectedId;
                const isExpanded = rate.id === expandedId;

                return (
                  <React.Fragment key={rate.id}>
                    {/* Main Row */}
                    <tr
                      onClick={() => onCardClick(rate)}
                      className={[
                        "cursor-pointer transition-colors duration-150",
                        isSelected ? "bg-blue-50/50" : "hover:bg-gray-50",
                      ].join(" ")}
                    >
                      {/* Vendor Cell */}
                      <td className="px-6 py-5 align-middle">
                        <div className="flex items-center gap-4">
                          {/* Radio Indicator */}
                          <div
                            className={[
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all",
                              isSelected
                                ? "border-black bg-black"
                                : "border-gray-300 bg-white",
                            ].join(" ")}
                          >
                            {isSelected && (
                              <div className="h-2 w-2 rounded-full bg-white" />
                            )}
                          </div>
                          <span className="font-extrabold text-gray-900 text-base">
                            {rate.vendorCode || "Unknown Vendor"}
                          </span>
                        </div>
                      </td>

                      {/* TAT */}
                      <td className="px-6 py-5 text-center align-middle font-bold text-gray-600">
                        {rate.tat || "-"}
                      </td>

                      {/* Weight */}
                      <td className="px-6 py-5 text-center align-middle font-bold text-gray-600">
                        {rate.chargeableWeight} {rate.weightUnit || "KG"}
                      </td>

                      {/* Price */}
                      <td className="px-6 py-5 text-right align-middle">
                        <div className="inline-flex items-center text-lg font-extrabold text-black">
                          <IndianRupee className="h-4 w-4 mr-1" />
                          {Number(rate.price || 0).toFixed(2)}
                        </div>
                      </td>

                      {/* Toggle Button */}
                      <td className="px-6 py-5 text-center align-middle">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleBreakup(rate.id);
                          }}
                          className="rounded-full p-2 text-gray-500 hover:bg-gray-200 transition"
                          title="View Price Breakup"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Breakup Row */}
                    {isExpanded && (
                      <tr className="bg-gray-50/60 shadow-inner">
                        <td colSpan={5} className="px-8 py-4">
                          <div className="rounded-md border border-black/5 bg-white p-5">
                            <h4 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-gray-400">
                              Price Breakup
                            </h4>
                            {Array.isArray(rate.breakup) &&
                            rate.breakup.length > 0 ? (
                              <div className="flex flex-col space-y-2">
                                {rate.breakup.map((b, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center justify-between border-b border-gray-100 pb-1 last:border-0 last:pb-0"
                                  >
                                    <span className="text-xs font-bold text-gray-600">
                                      {b.label}
                                    </span>
                                    <span className="text-xs font-extrabold text-gray-900">
                                      ₹{Number(b.amount || 0).toFixed(2)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs italic text-gray-500">
                                No detailed breakup provided by vendor.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-gray-200 bg-white px-6 py-3 text-sm font-extrabold text-gray-700 hover:bg-gray-50 transition"
        >
          Back
        </button>

        <button
          type="button"
          onClick={onNext}
          className="rounded-md bg-black px-8 py-3 text-sm font-extrabold text-white shadow-lg hover:bg-gray-800 transition transform active:scale-95"
        >
          Next
        </button>
      </div>
    </div>
  );
}

/** ✅ Modal */
function Modal({ title, onClose, children }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[999] bg-black/50 p-4 flex items-center justify-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="w-full max-w-5xl rounded-xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b bg-white px-6 py-4 shrink-0">
          <div className="text-base font-extrabold text-black">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        <div className="overflow-y-auto p-6 grow">{children}</div>
      </div>
    </div>
  );
}

function ErrorText({ text }) {
  return (
    <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-extrabold tracking-wider text-red-700">
      {text}
    </div>
  );
}

function Field({ label, required, icon, invalid, children }) {
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
    </div>
  );
}
