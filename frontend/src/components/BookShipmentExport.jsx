import React, { useMemo } from "react";

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
  const shipmentExtra = extra?.shipment || {};
  const boxes = extra?.boxes || {};

  const shipmentType = shipment.shipmentType || "Non-Document";
  const isDocument = shipmentType === "Document";
  const isNonDocument = shipmentType === "Non-Document";

  const boxesRows = boxes?.rows || [];

  // ✅ weights
  const actualWeight = isNonDocument
    ? calcActualWeightFromBoxes(boxesRows)
    : Number(shipmentExtra.docWeight || 0);

  const volumetricWeight = isNonDocument
    ? calcVolumetricWeight({
        shipmentType,
        boxesRows,
        dimensionUnit: units.dimensionUnit || "CM",
        weightUnit: units.weightUnit || "KG",
      })
    : 0;

  const chargeableWeight = calcChargeableWeight({
    actualWeight,
    volumetricWeight,
  });

  /** ✅ Strip File objects into metadata for JSON
   * Files will go separately in FormData
   */
  const docs = Array.isArray(addresses.documents) ? addresses.documents : [];
  const docsMeta = docs.map((d) => ({
    type: d.type,
    otherName: d.otherName || "",
    fileName: d.file?.name || "",
    fileType: d.file?.type || "",
    fileSize: d.file?.size || 0,
  }));

  /** ✅ final optimized JSON payload (EXPORT) */
  const payload = {
    shipment: {
      shipmentType,
      // origin fixed India, destination selected
      originCountry: shipment.originCountry || "INDIA",
      destinationCountry: shipment.destinationCountry || "",

      // origin (India)
      originPincode: shipment.originPincode || "",
      originCity: shipment.originCity || "",
      originState: shipment.originState || "",

      // destination (international)
      destinationZip: shipment.destZip || "",
      destinationCity: shipment.destCity || "",
      destinationState: shipment.destState || "",
    },

    units: {
      weightUnit: units.weightUnit || "KG",
      currencyUnit: units.currencyUnit || "INR",
      dimensionUnit: units.dimensionUnit || "CM",
    },

    shipmentDetails: {
      referenceNumber: shipmentExtra.referenceNumber || "",
      isCOD: !!shipmentExtra.isCOD,

      ...(isNonDocument
        ? {
            contentDescription: shipmentExtra.contentDescription || "",
            declaredValue: Number(shipmentExtra.declaredValue || 0),
            // export may not use ewaybill but keeping optional
            ewaybillNumber: shipmentExtra.ewaybillNumber || "",
          }
        : {
            docWeight: Number(shipmentExtra.docWeight || 0),
          }),
    },

    package: isNonDocument
      ? {
          boxesCount: Number(boxes.boxesCount || 0),
          rows: boxesRows.map((r) => ({
            qty: Number(r.qty || 0),
            weight: Number(r.weight || 0),
            length: Number(r.length || 0),
            breadth: Number(r.breadth || 0),
            height: Number(r.height || 0),
          })),
        }
      : null,

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
    if (d?.file) {
      fd.append(`documents[${idx}]`, d.file);
    }
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
  /** ✅ Create rates dynamically from entered details */
  const rates = useMemo(() => {
    const shipment = data?.shipment || {};
    const extra = data?.extra || {};

    const units = extra?.units || {};
    const shipmentExtra = extra?.shipment || {};
    const boxes = extra?.boxes || {};

    const shipmentType = shipment.shipmentType || "Non-Document";
    const isNonDocument = shipmentType === "Non-Document";

    // ✅ Export inputs
    const originPincode = shipment.originPincode || "";
    const destinationCountry = shipment.destinationCountry || "";

    const destZip = shipment.destZip || "";
    const destCity = shipment.destCity || "";

    // weights
    const actualWeight = isNonDocument
      ? calcActualWeightFromBoxes(boxes?.rows || [])
      : Number(shipmentExtra.docWeight || 0);

    const volumetricWeight = isNonDocument
      ? calcVolumetricWeight({
          shipmentType,
          boxesRows: boxes?.rows || [],
          dimensionUnit: units.dimensionUnit || "CM",
          weightUnit: units.weightUnit || "KG",
        })
      : 0;

    const chargeableWeight = calcChargeableWeight({
      actualWeight,
      volumetricWeight,
    });

    // COD (normally false for export, but still allowed if you enable)
    const isCOD = !!shipmentExtra.isCOD;

    // ✅ generate only if required inputs exist
    if (
      !originPincode ||
      !destinationCountry ||
      !destZip ||
      chargeableWeight <= 0
    )
      return [];

    return generateVendorRates({
      // ✅ use same interface, but include export destination inputs
      originPincode,
      destPincode: destZip, // for export, treat zip as destination code
      shipmentType: "EXPORT",
      isCOD,
      chargeableWeight,

      // extra signals you may use inside engine (optional)
      destinationCountry,
      destinationCity: destCity,
    });
  }, [data]);

  /** ✅ final submit */
  const finalSubmit = () => {
    const { payload, formData } = buildExportFormData(data);

    // payload & formData ready for backend
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
        data={data}
        onChange={onChange}
        onNext={onNext}
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
