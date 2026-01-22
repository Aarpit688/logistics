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

/**
 * ✅ SIMPLE SYNC HELPERS
 * - Dimensions: always EXACTLY count rows
 * - Goods: keep existing rows but ensure MIN 1 row per box
 */
function ensureDimRows(count, existingRows) {
  const c = clampInt(count || 1, 1, 9999);
  const base = Array.isArray(existingRows) ? existingRows : [];

  return Array.from({ length: c }).map((_, i) => ({
    qty: base[i]?.qty ?? 1,
    weight: base[i]?.weight ?? "",
    length: base[i]?.length ?? "",
    breadth: base[i]?.breadth ?? "",
    height: base[i]?.height ?? "",
  }));
}

function ensureGoodsRows(count, existingRows) {
  const c = clampInt(count || 1, 1, 9999);
  const base = Array.isArray(existingRows) ? existingRows : [];

  // keep only valid box rows
  let filtered = base.filter((r) => Number(r?.boxNo || 1) <= c);

  // ensure min 1 row per box
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
];
const TERMS_OPTIONS = ["DDU", "DDP", "CIF", "C&F", "DAP"];
const EXPORT_REASONS = [
  { value: "COMMERCIAL", label: "COMMERCIAL" },
  { value: "SAMPLE", label: "SAMPLE" },
  { value: "GIFT", label: "GIFT" },
  { value: "RETURN", label: "RETURN" },
  { value: "OTHER", label: "OTHER" },
];

export default function BookShipmentExportStep2({
  data,
  onChange,
  onNext,
  onBack,
}) {
  const shipment = data?.shipment || {};
  const extra = data?.extra || {};

  /** ✅ from Step1 */
  const shipmentMainType = shipment.shipmentMainType || "NON_DOCUMENT";
  const nonDocCategory = shipment.nonDocCategory || "COURIER_SAMPLE";
  const isDocument = shipmentMainType === "DOCUMENT";

  /** ✅ rates from parent */
  const rates = Array.isArray(data?.rates) ? data.rates : [];
  const selectedRate = data?.selectedRate || null;

  /** ✅ payload slices */
  const units = extra.units || {};
  const exportDetails = extra.exportDetails || {};
  const boxes = extra.boxes || {};
  const goods = extra.goods || {};

  /** ✅ units */
  const weightUnit = units.weightUnit || "KG";
  const currencyUnit = units.currencyUnit || "INR";
  const dimensionUnit = units.dimensionUnit || "CM";

  /** ✅ shared fields */
  const referenceNumber = exportDetails.referenceNumber || "";
  const exportFormat = exportDetails.exportFormat || "B2B";

  /** ✅ doc fields */
  const docWeight = exportDetails.docWeight ?? "";
  const generalGoodsDescription = exportDetails.generalGoodsDescription || "";

  /** ✅ NON DOC fields */
  const termsOfInvoice = exportDetails.termsOfInvoice || "";
  const invoiceNumber = exportDetails.invoiceNumber || "";
  const invoiceDate = exportDetails.invoiceDate || "";
  const gstInvoice = exportDetails.gstInvoice ?? false;
  const exportReason = exportDetails.exportReason || "";

  // ✅ category logic
  const isCommercialOrCSBV =
    String(nonDocCategory || "").toUpperCase() === "COMMERCIAL" ||
    String(nonDocCategory || "").toUpperCase() === "CSBV";

  // ✅ extra fields (Commercial / CSBV only)
  const iecNumber = exportDetails.iecNumber || "";
  const lutIgst = exportDetails.lutIgst || ""; // "LUT" | "IGST"
  const lutNumber = exportDetails.lutNumber || "";
  const lutIssueDate = exportDetails.lutIssueDate || "";
  const totalIgst = exportDetails.totalIgst || "";
  const bankAccNumber = exportDetails.bankAccNumber || "";
  const bankIFSC = exportDetails.bankIFSC || "";
  const bankADCode = exportDetails.bankADCode || "";
  const firmType = exportDetails.firmType || "";
  const nfei = exportDetails.nfei ?? false;

  // extra charges (as per image)
  const fobValue = exportDetails.fobValue || "";
  const freightCharges = exportDetails.freightCharges || "";
  const insurance = exportDetails.insurance || "";
  const otherCharges = exportDetails.otherCharges || "";
  const otherChargeName = exportDetails.otherChargeName || "";

  /** ✅ boxes meta */
  const boxesCountRaw = boxes.boxesCount ?? "";
  const boxesCount = clampInt(boxesCountRaw || 1, 1, 9999);

  /** ✅ modal tables */
  const boxRows = Array.isArray(boxes.rows) ? boxes.rows : [];
  const goodsRows = Array.isArray(goods.rows) ? goods.rows : [];

  /** UI */
  const [missingFields, setMissingFields] = useState({});
  const [formError, setFormError] = useState("");

  /** ✅ rates states */
  const [showRates, setShowRates] = useState(false);
  const [selectedId, setSelectedId] = useState(selectedRate?.id || "");
  const [expandedId, setExpandedId] = useState("");

  /** ✅ modals */
  const [openDimsModal, setOpenDimsModal] = useState(false);
  const [openGoodsModal, setOpenGoodsModal] = useState(false);

  const [dimInvalid, setDimInvalid] = useState({}); // { [idx]: { weight:true, length:true, breadth:true, height:true } }
  const [goodsInvalid, setGoodsInvalid] = useState({}); // { [idx]: { description:true, hsnCode:true, qty:true, rate:true } }

  /** patch helpers */
  const patchExtra = (patch) => onChange?.({ extra: { ...extra, ...patch } });
  const patchExportDetails = (patch) =>
    patchExtra({ exportDetails: { ...exportDetails, ...patch } });
  const patchBoxes = (patch) => patchExtra({ boxes: { ...boxes, ...patch } });
  const patchGoods = (patch) => patchExtra({ goods: { ...goods, ...patch } });

  // ✅ Lock page scroll when any modal is open
  useEffect(() => {
    const isOpen = openDimsModal || openGoodsModal;
    if (!isOpen) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [openDimsModal, openGoodsModal]);

  /** ✅ Ensure non-doc starts with 1 box by default */
  useEffect(() => {
    if (isDocument) return;
    if (!boxes.boxesCount || Number(boxes.boxesCount) < 1) {
      patchBoxes({ boxesCount: "1" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDocument]);

  /** ✅ cleanup when flow changes */
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDocument, nonDocCategory]);

  /**
   * ✅ SIMPLE + RELIABLE SYNC
   * - ALWAYS ensure dims has exactly boxesCount rows
   * - ALWAYS ensure goods has min 1 row per box
   */
  useEffect(() => {
    if (isDocument) return;

    const nextDims = ensureDimRows(boxesCount, boxRows);
    if (nextDims.length !== boxRows.length) patchBoxes({ rows: nextDims });

    const nextGoods = ensureGoodsRows(boxesCount, goodsRows);
    if (nextGoods.length !== goodsRows.length) patchGoods({ rows: nextGoods });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxesCount, isDocument]);

  /** ✅ auto compute goods amount (non-doc only) */
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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goodsRows, isDocument]);

  /** ✅ selected rate */
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

  /** ✅ derived: total weight */
  const totalWeightBoxes = useMemo(() => {
    return boxRows.reduce((sum, r) => {
      const qty = safeNum(r.qty);
      const wt = safeNum(r.weight);
      return sum + qty * wt;
    }, 0);
  }, [boxRows]);

  /** ✅ update totalWeight in payload */
  useEffect(() => {
    if (isDocument) return;
    patchBoxes({ totalWeight: Number(totalWeightBoxes.toFixed(2)) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalWeightBoxes, isDocument]);

  /** ===========================
   * ✅ Validation
   * =========================== */
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

      // charges required
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

    // ✅ also validate modal required rows
    const okDims = validateDimsRows();
    const okGoods = validateGoodsRows();

    if (!okDims || !okGoods) {
      setFormError("Please fill all required fields inside the modals");
      return false;
    }

    setFormError("");
    return true;
  };

  /** ===========================
   * ✅ Actions
   * =========================== */
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

  /** ===========================
   * ✅ MODAL: Weight & Dimensions
   * =========================== */
  const updateDimRow = (idx, patch) => {
    const next = [...boxRows];
    if (!next[idx]) return;
    next[idx] = { ...next[idx], ...patch };
    patchBoxes({ rows: next });
  };

  /** ===========================
   * ✅ MODAL: Shipment Content
   * =========================== */
  const addGoodsRowBelow = (idx) => {
    const row = goodsRows[idx];
    const boxNo = Number(row?.boxNo || 1);

    const next = [...goodsRows];
    next.splice(idx + 1, 0, makeGoodsRow(boxNo)); // ✅ insert below clicked row

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

    // cannot delete last row of a box
    if (!stillHas) return;

    patchGoods({ rows: remaining });
  };

  return (
    <>
      <div className="mb-4">
        <h3 className="text-base font-extrabold text-black tracking-wide">
          Export Shipment Details
        </h3>
      </div>

      {/* ✅ Document Flow */}
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
                className="rounded-md bg-black px-7 py-3 text-sm font-extrabold text-white shadow-md hover:bg-gray-900"
              >
                Check Rates
              </button>
            </div>
          ) : null}

          {showRates ? (
            <RatesUI
              rates={rates}
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
          {/* ✅ Non Document */}
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

          {/* ✅ EXTRA FIELDS for COMMERCIAL / CSBV */}
          {isCommercialOrCSBV ? (
            <>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* ✅ GST Invoice */}
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

                {/* ✅ IEC Number */}
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

                {/* ✅ LUT / IGST */}
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

              {/* LUT dependent */}
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

                  {/* NFEI checkbox */}
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

              {/* IGST dependent */}
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

              {/* ✅ Bank details */}
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

              {/* ✅ Firm Type */}
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

              {/* ✅ Charges */}
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
                    boxesCount: String(clampInt(e.target.value, 1, 9999)),
                  })
                }
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none"
              />
            </Field>

            <Field
              label={`TOTAL ACTUAL WEIGHT (${weightUnit})`}
              required={false}
              invalid={false}
              icon={<Scale className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                readOnly
                value={Number(totalWeightBoxes || 0).toFixed(2)}
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

          {/* ✅ modals buttons */}
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                // ✅ ensure rows exist BEFORE modal opens
                patchBoxes({ rows: ensureDimRows(boxesCount, boxRows) });
                setOpenDimsModal(true);
              }}
              className="rounded-md border border-black/10 bg-white px-6 py-4 text-sm font-extrabold text-gray-900 shadow-sm hover:bg-gray-50"
            >
              Add Weight & Dimensions
            </button>

            <button
              type="button"
              onClick={() => {
                // ✅ ensure rows exist BEFORE modal opens
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
                className="rounded-md bg-black px-7 py-3 text-sm font-extrabold text-white shadow-md hover:bg-gray-900"
              >
                Check Rates
              </button>
            </div>
          ) : null}

          {showRates ? (
            <RatesUI
              rates={rates}
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

          {/* ✅ MODALS */}
          {openDimsModal ? (
            <Modal
              title="Weight & Dimensions"
              onClose={() => setOpenDimsModal(false)}
            >
              <div className="text-xs font-bold text-gray-600 mb-3">
                Rows always sync with number of boxes.
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
                        Total Actual Wt.
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {boxRows.map((r, idx) => {
                      const rowTotalWeight = (
                        safeNum(r.qty) * safeNum(r.weight)
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
                                updateDimRow(idx, {
                                  qty: clampInt(e.target.value, 1, 999999),
                                })
                              }
                              className="h-9 w-16 rounded border border-gray-300 px-2 font-bold text-center outline-none focus:border-black"
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
                            {rowTotalWeight}
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
                                onClick={() => addGoodsRowBelow(idx)} // ✅ insert below current row
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

/** ✅ Rates UI */
function RatesUI({
  rates,
  selectedId,
  expandedId,
  onCardClick,
  onToggleBreakup,
  onBack,
  onNext,
  setShowRates,
}) {
  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-extrabold text-black">
          Select Vendor Price
        </div>
        <button
          type="button"
          onClick={() => setShowRates(false)}
          className="text-xs font-extrabold text-gray-700 hover:underline"
        >
          Change Details
        </button>
      </div>

      {rates.length === 0 ? (
        <div className="rounded-md border border-black/10 bg-white p-5 text-sm font-extrabold text-gray-700">
          No vendor rates available.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {rates.map((rate) => {
            const isSelected = rate.id === selectedId;
            const isExpanded = rate.id === expandedId;

            return (
              <div
                key={rate.id}
                onClick={() => onCardClick(rate)}
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
                    onToggleBreakup(rate.id);
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
          className="rounded-md border border-gray-200 bg-gray-50 px-6 py-3 text-sm font-extrabold text-gray-700 hover:bg-gray-100"
        >
          Back
        </button>

        <button
          type="button"
          onClick={onNext}
          className="rounded-md bg-black px-7 py-3 text-sm font-extrabold text-white shadow-md hover:bg-gray-900"
        >
          Next
        </button>
      </div>
    </div>
  );
}

/** ✅ Modal */
function Modal({ title, onClose, children }) {
  // ✅ close on ESC
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[999] bg-black/50 p-4"
      onMouseDown={(e) => {
        // ✅ click outside to close
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      {/* ✅ Modal wrapper (prevents background scroll, enables internal scroll) */}
      <div className="mx-auto flex h-full max-w-6xl items-center">
        <div className="w-full overflow-hidden rounded-xl bg-white shadow-xl">
          {/* ✅ sticky header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
            <div className="text-sm font-extrabold text-black">{title}</div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-md border border-black/10 hover:bg-gray-50"
            >
              <X className="h-4 w-4 text-gray-700" />
            </button>
          </div>

          {/* ✅ Scrollable content */}
          <div className="max-h-[calc(100vh-150px)] overflow-y-auto p-6">
            {children}
          </div>
        </div>
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

/* ✅ Field */
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
