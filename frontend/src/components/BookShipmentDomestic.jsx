import React, { useMemo } from "react";

import BookShipmentDomesticStep1 from "./BookShipmentDomesticStep1";
import BookShipmentDomesticStep2 from "./BookShipmentDomesticStep2";
import BookShipmentDomesticStep3 from "./BookShipmentDomesticStep3";
import BookShipmentDomesticStep4 from "./BookShipmentDomesticStep4";

import {
  calcActualWeightFromBoxes,
  calcVolumetricWeight,
  calcChargeableWeight,
  generateVendorRates,
} from "../utils/rateEngine";

/** ✅ final backend payload optimizer */
function buildDomesticBookingPayload(data) {
  const shipment = data?.shipment || {};
  const extra = data?.extra || {};
  const addresses = data?.addresses || {};
  const selectedRate = data?.selectedRate || null;

  const units = extra?.units || {};
  const shipmentExtra = extra?.shipment || {};
  const boxes = extra?.boxes || {};

  const shipmentType = shipment.shipmentType || "Document";
  const isDocument = shipmentType === "Document";
  const isNonDocument = shipmentType === "Non-Document";

  const boxesRows = boxes?.rows || [];

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
   * (you will send files separately in FormData)
   */
  const docs = Array.isArray(addresses.documents) ? addresses.documents : [];
  const docsMeta = docs.map((d) => ({
    type: d.type,
    otherName: d.otherName || "",
    fileName: d.file?.name || "",
    fileType: d.file?.type || "",
    fileSize: d.file?.size || 0,
  }));

  /** ✅ final optimized JSON payload */
  const payload = {
    shipment: {
      shipmentType: shipment.shipmentType,
      originPincode: shipment.originPincode,
      originCity: shipment.originCity,
      destPincode: shipment.destPincode,
      destCity: shipment.destCity,
    },

    units: {
      weightUnit: units.weightUnit,
      currencyUnit: units.currencyUnit,
      dimensionUnit: units.dimensionUnit,
    },

    shipmentDetails: {
      referenceNumber: shipmentExtra.referenceNumber || "",
      isCOD: !!shipmentExtra.isCOD,

      ...(isNonDocument
        ? {
            contentDescription: shipmentExtra.contentDescription || "",
            declaredValue: Number(shipmentExtra.declaredValue || 0),
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
function buildDomesticFormData(data) {
  const payload = buildDomesticBookingPayload(data);

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

export default function BookShipmentDomestic({
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

    const shipmentType = shipment.shipmentType || "Document";
    const isNonDocument = shipmentType === "Non-Document";

    const originPincode = shipment.originPincode || "";
    const destPincode = shipment.destPincode || "";

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

    // COD
    const isCOD = !!shipmentExtra.isCOD;

    // ✅ generate
    if (!originPincode || !destPincode || chargeableWeight <= 0) return [];

    return generateVendorRates({
      originPincode,
      destPincode,
      shipmentType,
      isCOD,
      chargeableWeight,
    });
  }, [data]);

  /** ✅ final submit */
  const finalSubmit = () => {
    // ✅ build both json payload + formData
    const { payload, formData } = buildDomesticFormData(data);

    // ✅ payload ready to send to backend (optimized)
    // console.log("JSON Payload:", payload);

    // ✅ formData ready (contains payload + files)
    // console.log("FormData", formData);

    // pass to parent / api caller
    onNext?.({ payload, formData });
  };

  if (step === 1) {
    return (
      <BookShipmentDomesticStep1
        data={data}
        onChange={onChange}
        onNext={onNext}
      />
    );
  }

  if (step === 2) {
    return (
      <BookShipmentDomesticStep2
        data={data}
        onChange={onChange}
        onNext={onNext}
        onBack={onBack}
      />
    );
  }

  if (step === 3) {
    return (
      <BookShipmentDomesticStep3
        data={data}
        onChange={onChange}
        onNext={onNext}
        onBack={onBack}
      />
    );
  }

  if (step === 4) {
    return (
      <BookShipmentDomesticStep4
        data={{ ...data, rates }}
        onChange={onChange}
        onNext={finalSubmit}
        onBack={onBack}
      />
    );
  }

  return null;
}
