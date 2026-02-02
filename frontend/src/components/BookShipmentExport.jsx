import React, { useState } from "react";
import { Loader2 } from "lucide-react";

import BookShipmentExportStep1 from "./BookShipmentExportStep1";
import BookShipmentExportStep2 from "./BookShipmentExportStep2";
import BookShipmentExportStep3 from "./BookShipmentExportStep3";

import {
  calcActualWeightFromBoxes,
  calcVolumetricWeight,
  calcChargeableWeight,
} from "../utils/rateEngine";
import { API_BASE_URL } from "../config/api";
import { useNavigate } from "react-router-dom";

/** ✅ final backend payload optimizer (EXPORT) */
function buildExportBookingPayload(data) {
  const shipment = data?.shipment || {};
  const extra = data?.extra || {};
  const addresses = data?.addresses || {};
  const selectedRate = data?.selectedRate || null;

  const sender = addresses.sender || {};
  const receiver = addresses.receiver || {};

  const senderPayload = {
    ...sender,
    kycType: sender.documentType, // Map Document Type to KYC Type
    kycNo: sender.documentNumber, // Map Document Number to KYC Number
  };

  const receiverPayload = {
    ...receiver,
    // Add the new commercial fields
    airportCode: receiver.airportCode || "",
    airportDestination: receiver.airportDestination || "",
    handlingInfo: receiver.handlingInfo || "",
  };

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

  const shipmentMainType = shipment.shipmentMainType || "NON_DOCUMENT";
  const nonDocCategory = shipment.nonDocCategory || "";

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
    exportDetails: { ...exportDetails },
    boxes: { ...boxes },
    goods: { ...goods },
    weights: {
      actualWeight: Number(actualWeight.toFixed(2)),
      volumetricWeight: Number(volumetricWeight.toFixed(2)),
      chargeableWeight: Number(chargeableWeight.toFixed(2)),
    },
    addresses: {
      sender: senderPayload || {},
      receiver: receiverPayload || {},
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
          ...selectedRate.raw,
        }
      : null,
  };

  return payload;
}

/** ✅ Helper: Build FormData (JSON + Files) */
function buildExportFormData(data) {
  const payload = buildExportBookingPayload(data);
  const fd = new FormData();

  // Append the JSON data as a string (Backend expects req.body.payload)
  fd.append("payload", JSON.stringify(payload));

  // Append actual files
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

/** ✅ Create Booking API - Updated for FormData */
async function bookShipmentAPI(formData) {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // ❌ NO Content-Type header here; browser sets multipart boundary automatically
      },
      body: formData, // Send FormData object
    });

    const json = await res.json();
    return json;
  } catch (error) {
    console.error("Booking failed", error);
    throw error;
  }
}

/** ✅ Fetch Rates API */
async function fetchRatesAPI(params) {
  try {
    const res = await fetch(`/api/proxy/booking/rate-calculator`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_name: "sgate",
        password: "123456",
        booking_type: 1, // Export
        origin_pincode: params.originPincode,
        destination_pincode: params.destZip,
        destination_country: params.destinationCountry,
        shipment_type: params.isDocument ? 2 : 1,
        weight: params.chargeableWeight,
        quantity: params.boxesCount,
        length: params.length,
        width: params.width,
        height: params.height,
      }),
    });

    const json = await res.json();
    if (json.statusCode === 200 && Array.isArray(json.data)) {
      return json.data;
    }
    return [];
  } catch (error) {
    console.error("Rate fetch failed", error);
    return [];
  }
}

export default function BookShipmentExport({
  step,
  data,
  onChange,
  onNext,
  onBack,
}) {
  const navigate = useNavigate();

  const [rates, setRates] = useState([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  /** ✅ Parent computes rates on demand */
  const computeRates = async () => {
    const shipment = data?.shipment || {};
    const extra = data?.extra || {};
    const units = extra?.units || {};
    const exportDetails = extra?.exportDetails || {};
    const boxes = extra?.boxes || {};

    const originPincode = shipment.originPincode || "";
    const destinationCountry = shipment.destinationCountry || "";
    const destZip = shipment.destZip || "";
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
      return;
    }

    const boxesRows = boxes?.rows || [];
    const maxLen = boxesRows.reduce(
      (m, r) => Math.max(m, Number(r.length || 0)),
      0,
    );
    const maxWidth = boxesRows.reduce(
      (m, r) => Math.max(m, Number(r.breadth || 0)),
      0,
    );
    const maxHeight = boxesRows.reduce(
      (m, r) => Math.max(m, Number(r.height || 0)),
      0,
    );

    setLoadingRates(true);

    const apiData = await fetchRatesAPI({
      originPincode,
      destZip,
      destinationCountry,
      isDocument: shipmentMainType === "DOCUMENT",
      chargeableWeight,
      boxesCount: Number(boxes.boxesCount || 1),
      length: maxLen || 1,
      width: maxWidth || 1,
      height: maxHeight || 1,
    });

    const mappedRates = apiData.map((item, idx) => ({
      id: `RATE_${idx}_${item.product_name}`,
      vendorCode: item.product_name,
      tat: item.tat_days ? `${item.tat_days} Days` : "N/A",
      chargeableWeight: chargeableWeight,
      price: item.grand_total_with_gst,
      breakup: (item.charges || []).map((c) => ({
        label: c.charge_name,
        amount: c.charge_amount_show,
      })),
      raw: item,
    }));

    setRates(mappedRates);
    setLoadingRates(false);
  };

  /** ✅ Handle Rate Selection & Next */
  const handleStep2Next = (meta) => {
    if (meta?.action === "CHECK_RATES") {
      computeRates();
      return;
    }
    if (meta?.action === "NEXT") {
      onNext?.();
      return;
    }
    onNext?.();
  };

  const finalSubmit = async () => {
    try {
      setIsBooking(true);

      // 1. Build FormData (JSON string + Files)
      const { formData, payload } = buildExportFormData(data);

      // 2. Call Backend
      const response = await bookShipmentAPI(formData);

      // 3. Pass result up
      onNext?.({
        payload: payload,
        apiResponse: response,
        success: response.statusCode === 200,
      });
      if (response?.statusCode === 200) {
        // ✅ Redirect to booking list (fresh load)
        navigate("/bookings/export", { replace: true });
        return;
      }
    } catch (e) {
      console.error("Booking Error", e);
      alert("Booking Failed. Check console.");
    } finally {
      setIsBooking(false);
    }
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
        isLoadingRates={loadingRates}
        onChange={onChange}
        onNext={handleStep2Next}
        onBack={onBack}
      />
    );
  }

  if (step === 3) {
    return (
      <div className="relative">
        {isBooking && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm">
            <Loader2 className="h-10 w-10 animate-spin text-black" />
            <div className="mt-3 font-extrabold text-black">
              Creating Shipment...
            </div>
          </div>
        )}
        <BookShipmentExportStep3
          data={data}
          onChange={onChange}
          onNext={finalSubmit}
          onBack={onBack}
        />
      </div>
    );
  }

  return null;
}
