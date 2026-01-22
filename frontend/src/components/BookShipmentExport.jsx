import React, { useMemo, useState } from "react";

import BookShipmentExportStep1 from "./BookShipmentExportStep1";
import BookShipmentExportStep2 from "./BookShipmentExportStep2";
import BookShipmentExportStep3 from "./BookShipmentExportStep3";
import BookShipmentExportStep4 from "./BookShipmentExportStep4";

import {
  calcActualWeightFromBoxes,
  calcVolumetricWeight,
  calcChargeableWeight,
  generateVendorRates,
} from "../utils/rateEngine";

/** ✅ final backend payload optimizer (EXPORT) */
function buildExportBookingPayload(data) {
  const shipment = data?.shipment || {};
  const extra = data?.extra || {};
  const addresses = data?.addresses || {};
  const selectedRate = data?.selectedRate || null;

  const units = extra?.units || {};
  const exportDetails = extra?.exportDetails || {};
  const boxes = extra?.boxes || {};
  const goods = extra?.goods || {};

  const docs = Array.isArray(addresses.documents) ? addresses.documents : [];
  const docsMeta = docs.map((d) => ({
    type: d.type,
    otherName: d.otherName || "",
    fileName: d.file?.name || "",
    fileType: d.file?.type || "",
    fileSize: d.file?.size || 0,
  }));

  const shipmentMainType = shipment.shipmentMainType || "NON_DOCUMENT"; // DOCUMENT | NON_DOCUMENT
  const nonDocCategory = shipment.nonDocCategory || ""; // COURIER_SAMPLE / AMAZON_FBA / ECOMMERCE / etc.

  // ✅ weights calculation
  const isDocument = shipmentMainType === "DOCUMENT";
  const actualWeight = isDocument
    ? Number(exportDetails.docWeight || 0)
    : calcActualWeightFromBoxes(boxes?.rows || []);

  const volumetricWeight = isDocument
    ? 0
    : calcVolumetricWeight({
        shipmentType: "EXPORT",
        boxesRows: boxes?.rows || [],
        dimensionUnit: units.dimensionUnit || "CM",
        weightUnit: units.weightUnit || "KG",
      });

  const chargeableWeight = calcChargeableWeight({
    actualWeight,
    volumetricWeight,
  });

  const payload = {
    shipment: {
      shipmentMainType,
      nonDocCategory,

      originCountry: shipment.originCountry || "INDIA",
      destinationCountry: shipment.destinationCountry || "",
      destinationCountryId: shipment.destinationCountryId || "",

      originPincode: shipment.originPincode || "",
      originCity: shipment.originCity || "",
      originState: shipment.originState || "",

      destinationZip: shipment.destZip || "",
      destinationCity: shipment.destCity || "",
      destinationState: shipment.destState || "",
    },

    units: {
      weightUnit: units.weightUnit || "KG",
      currencyUnit: units.currencyUnit || "INR",
      dimensionUnit: units.dimensionUnit || "CM",
    },

    exportDetails: {
      ...exportDetails,
    },

    boxes: {
      ...boxes,
    },

    goods: {
      ...goods,
    },

    weights: {
      actualWeight: Number(actualWeight.toFixed(2)),
      volumetricWeight: Number(volumetricWeight.toFixed(2)),
      chargeableWeight: Number(chargeableWeight.toFixed(2)),
    },

    addresses: {
      sender: addresses.sender || {},
      receiver: addresses.receiver || {},
    },

    documents: docsMeta,

    selectedVendor: selectedRate
      ? {
          id: selectedRate.id,
          vendorCode: selectedRate.vendorCode,
          tat: selectedRate.tat,
          chargeableWeight: selectedRate.chargeableWeight,
          totalPrice: selectedRate.price,
          breakup: selectedRate.breakup || [],
        }
      : null,
  };

  return payload;
}

/** ✅ create FormData (JSON + files) */
function buildExportFormData(data) {
  const payload = buildExportBookingPayload(data);

  const fd = new FormData();
  fd.append("payload", JSON.stringify(payload));

  const docs = Array.isArray(data?.addresses?.documents)
    ? data.addresses.documents
    : [];

  docs.forEach((d, idx) => {
    if (d?.file) fd.append(`documents[${idx}]`, d.file);
  });

  return { payload, formData: fd };
}

export default function BookShipmentExport({
  step,
  data,
  onChange,
  onNext,
  onBack,
}) {
  const [rates, setRates] = useState([]);

  /** ✅ Parent computes rates on demand (Step2 Check Rates) */
  const computeRates = () => {
    const shipment = data?.shipment || {};
    const extra = data?.extra || {};
    const units = extra?.units || {};
    const exportDetails = extra?.exportDetails || {};
    const boxes = extra?.boxes || {};

    const originPincode = shipment.originPincode || "";
    const destinationCountry = shipment.destinationCountry || "";
    const destZip = shipment.destZip || "";
    const destCity = shipment.destCity || "";
    const shipmentMainType = shipment.shipmentMainType || "NON_DOCUMENT";

    const weightUnit = units.weightUnit || "KG";
    const dimensionUnit = units.dimensionUnit || "CM";

    const actualWeight =
      shipmentMainType === "DOCUMENT"
        ? Number(exportDetails.docWeight || 0)
        : calcActualWeightFromBoxes(boxes?.rows || []);

    const volumetricWeight =
      shipmentMainType === "DOCUMENT"
        ? 0
        : calcVolumetricWeight({
            shipmentType: "EXPORT",
            boxesRows: boxes?.rows || [],
            dimensionUnit,
            weightUnit,
          });

    const chargeableWeight = calcChargeableWeight({
      actualWeight,
      volumetricWeight,
    });

    if (
      !originPincode ||
      !destinationCountry ||
      !destZip ||
      chargeableWeight <= 0
    ) {
      setRates([]);
      return [];
    }

    const next = generateVendorRates({
      originPincode,
      destPincode: destZip,
      shipmentType: "EXPORT",
      isCOD: false,
      chargeableWeight,
      destinationCountry,
      destinationCity: destCity,
    });

    setRates(next);
    return next;
  };

  /** ✅ Step2 special handler: check rates / next */
  const handleStep2Next = (meta) => {
    // meta = { action: "CHECK_RATES" } or { action: "NEXT" }
    if (meta?.action === "CHECK_RATES") {
      computeRates();
      return; // ✅ stay on same step
    }
    if (meta?.action === "NEXT") {
      onNext?.(); // ✅ move step 3
      return;
    }
    onNext?.();
  };

  /** ✅ final submit */
  const finalSubmit = () => {
    const { payload, formData } = buildExportFormData(data);
    onNext?.({ payload, formData });
  };

  if (step === 1) {
    return (
      <BookShipmentExportStep1
        data={data}
        onChange={onChange}
        onNext={onNext}
      />
    );
  }

  if (step === 2) {
    return (
      <BookShipmentExportStep2
        data={{ ...data, rates }}
        onChange={onChange}
        onNext={handleStep2Next}
        onBack={onBack}
      />
    );
  }

  if (step === 3) {
    return (
      <BookShipmentExportStep3
        data={data}
        onChange={onChange}
        onNext={onNext}
        onBack={onBack}
      />
    );
  }

  if (step === 4) {
    return (
      <BookShipmentExportStep4
        data={{ ...data, rates }}
        onChange={onChange}
        onNext={finalSubmit}
        onBack={onBack}
      />
    );
  }

  return null;
}
