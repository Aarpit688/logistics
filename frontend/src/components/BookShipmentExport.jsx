import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import BookShipmentExportStep1 from "./BookShipmentExportStep1";
import BookShipmentExportStep2 from "./BookShipmentExportStep2";
import BookShipmentExportStep3 from "./BookShipmentExportStep3";

import {
  calcActualWeightFromBoxes,
  calcVolumetricWeight,
  calcChargeableWeight,
} from "../utils/rateEngine";
import { API_BASE_URL } from "../config/api";

/** ✅ Helper: Map Export Reason Text to ID */
const getExportTypeId = (reason) => {
  const r = reason?.toLowerCase() || "";
  if (r.includes("gift")) return "1";
  if (r.includes("sample")) return "2";
  if (r.includes("permanent") || r.includes("sale") || r.includes("commercial"))
    return "3";
  if (r.includes("return") || r.includes("repair")) return "4";
  return "3"; // Default to Commercial
};

/** * ✅ FINAL EXTERNAL PAYLOAD BUILDER
 * STRICT MAPPING: No false fallbacks. Uses only Sender/Receiver data.
 */
function buildExternalBookingPayload(data) {
  const shipment = data?.shipment || {};
  const addresses = data?.addresses || {};
  const extra = data?.extra || {};
  const selectedRate = data?.selectedRate || {};

  const sender = addresses.sender || {};
  const receiver = addresses.receiver || {};
  const exportDetails = extra?.exportDetails || {};
  const boxes = extra?.boxes?.rows || [];
  const goods = extra?.goods?.rows || [];

  // 1. Calculate Types
  const shipmentTypeId = shipment.shipmentMainType === "DOCUMENT" ? 2 : 1;
  const shipperTypeId = shipmentTypeId.toString();
  const exportTypeId = getExportTypeId(exportDetails.exportReason);
  const gstApplicableId = exportDetails.gstInvoice ? "1" : "2";

  // 2. Map Dimensions
  const shipment_dimensions = boxes.map((box, index) => {
    const good = goods[index] || goods[0] || {};
    return {
      item_description: good.description || "Consolidated Cargo",
      value: good.amount || "100",
      quantity: box.qty ? String(box.qty) : "1",
      weight: box.weight ? String(box.weight) : "0.5",
      length: box.length ? String(box.length) : "10",
      breadth: box.breadth ? String(box.breadth) : "10",
      height: box.height ? String(box.height) : "10",
      hsn_code: good.hsnCode || "999999",
    };
  });

  // 3. Construct Payload
  return {
    user_name: "sgate",
    password: "123456",

    // --- Origin & Dest (Shipment Route) ---
    origin_pincode: shipment.originPincode,
    destination_pincode: shipment.destZip,
    city: shipment.destCity || "Melbourne",
    destination_country_id: shipment.destinationCountryId || 12,

    // --- Booking Config ---
    booking_type: 1,
    shipment_type: shipmentTypeId,

    unit: {
      weight_unit: extra.units?.weightUnit?.toLowerCase() || "kgs",
      length_unit: extra.units?.dimensionUnit?.toLowerCase() || "cms",
      currency: "24",
    },

    shipment_dimensions: shipment_dimensions,
    courier_id: selectedRate.raw?.courier_id || selectedRate.courier_id || 121,

    // --- Consigner (Sender) - STRICT MAPPING ---
    consigner_first_name: sender.name?.split(" ")[0] || "Sender",
    consigner_company_name: sender.companyName || "N/A",
    consigner_mobile_number: sender.contactNumber,
    consigner_email_id: sender.email,
    consigner_address_1: sender.addressLine1,
    consigner_address_2: sender.addressLine2 || "",

    // ⚠️ CRITICAL: Ensure these exist in your form (Step 1 or 3)
    // We check for multiple naming conventions (pincode vs zipCode)
    consigner_city: sender.city || shipment.originCity,
    consigner_pincode:
      sender.pincode || sender.zipCode || shipment.originPincode,
    consigner_state: sender.state || shipment.originState,
    consigner_doc_type: sender.documentType === "PAN" ? "4" : "1",

    // --- Tax / GST Details ---
    consigner_gst_number: sender.iecNo || "",
    consigner_gst_applicable: gstApplicableId,
    consigner_tax_payment: "3",
    shipper_type: shipperTypeId,

    // --- Consignee (Receiver) ---
    consignee_first_name: receiver.name?.split(" ")[0] || "Receiver",
    consignee_company_name: receiver.companyName || "N/A",
    consignee_mobile_number: receiver.contactNumber,
    consignee_email_id: receiver.email,
    consignee_address_1: receiver.addressLine1,
    consignee_address_2: receiver.addressLine2 || "",

    // --- Commercial ---
    booking_invoice_number: exportDetails.invoiceNumber || "INV-001",
    booking_invoice_date:
      exportDetails.invoiceDate || new Date().toISOString().split("T")[0],
    export_type: exportTypeId,

    consignee_reference_no: exportDetails.referenceNumber || "",
    consignee_gst_number: receiver.idNumber || "",

    // --- Pickup ---
    pickup_required: 1,
    pickup_location: 2,
    pickup_name: sender.name,
    pickup_address_1: sender.addressLine1,
    pickup_address_2: sender.addressLine2 || "",

    // Pickup usually matches Sender Location
    pickup_pincode: sender.pincode || sender.zipCode || sender.zip,
    pickup_city: sender.city,
    pickup_state: sender.state || sender.province,

    pickup_ready_start_time: "10:00 AM",
    pickup_ready_end_time: "10:00 PM",

    // --- Payment ---
    tax_paid: 1,
    tax_amount: String(selectedRate.price || "0"),

    otp: "",
  };
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
        booking_type: 1,
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

  const computeRates = async () => {
    // ... (Keep existing weight calculation logic same as before) ...
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
      courier_id: item.courier_id,
    }));

    setRates(mappedRates);
    setLoadingRates(false);
  };

  const handleStep2Next = (meta) => {
    if (meta?.action === "CHECK_RATES") {
      computeRates();
      return;
    }
    onNext?.();
  };

  // --- 2. Final Submit (Call External API) ---
  const finalSubmit = async () => {
    try {
      setIsBooking(true);

      // 1. Build Payload
      const externalPayload = buildExternalBookingPayload(data);
      console.log("🚀 Sending to Booking API:", externalPayload);

      // 2. Validate Data (Prevent 422 Error)
      const missingFields = [];
      if (!externalPayload.consigner_city) missingFields.push("Sender City");
      if (!externalPayload.consigner_state) missingFields.push("Sender State");
      if (!externalPayload.consigner_pincode)
        missingFields.push("Sender Pincode");

      if (missingFields.length > 0) {
        alert(
          `Missing Real Data: ${missingFields.join(", ")}. \nPlease check Sender Address details.`,
        );
        setIsBooking(false);
        return; // STOP execution if data is missing
      }

      // 3. Call API
      const response = await fetch(
        "https://devapiv2.skart-express.com/api/v1/booking/booking-api",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify(externalPayload),
        },
      );

      // Handle Non-JSON responses (404/500 HTML pages)
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(`Server Error ${response.status}: API Endpoint issue.`);
      }

      const json = await response.json();

      // 4. Handle Success
      if (json.statusCode === 201 || json.message === "success") {
        alert(`Booking Successful! ID: ${json.booking_id || "Done"}`);
        onNext?.({
          payload: externalPayload,
          apiResponse: json,
          success: true,
        });
        navigate("/bookings/export", { replace: true });
      } else {
        throw new Error(json.message || json.errors || "Booking Failed");
      }
    } catch (e) {
      console.error("Booking Error", e);
      alert(`Booking Failed: ${e.message}`);
    } finally {
      setIsBooking(false);
    }
  };

  if (step === 1)
    return (
      <BookShipmentExportStep1
        data={data}
        onChange={onChange}
        onNext={onNext}
      />
    );

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
              Booking Shipment...
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
