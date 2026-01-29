// rateEngine.js

/** ✅ volumetric weight calculation */
export function calcVolumetricWeight({
  shipmentType,
  boxesRows = [],
  dimensionUnit = "CM",
  weightUnit = "KG",
}) {
  return (boxesRows || []).reduce((sum, r) => {
    const qty = Number(r.qty || 0);
    const l = Number(r.length || 0);
    const b = Number(r.breadth || 0);
    const h = Number(r.height || 0);

    if (
      Number.isNaN(qty) ||
      Number.isNaN(l) ||
      Number.isNaN(b) ||
      Number.isNaN(h)
    )
      return sum;

    // 📦 Volumetric weight per box: (L * B * H) / 5000
    const volPerBox = (l * b * h) / 5000;

    return sum + qty * volPerBox;
  }, 0);
}

/** ✅ Actual weight from boxes rows (non-document) */
export function calcActualWeightFromBoxes(boxesRows = []) {
  return (boxesRows || []).reduce((sum, r) => {
    const qty = Number(r.qty || 0);
    const wt = Number(r.weight || 0);
    if (Number.isNaN(qty) || Number.isNaN(wt)) return sum;
    return sum + qty * wt;
  }, 0);
}

/** ✅ Chargeable weight */
export function calcChargeableWeight({
  actualWeight = 0,
  volumetricWeight = 0,
}) {
  return Math.max(Number(actualWeight || 0), Number(volumetricWeight || 0));
}

/** ✅ Dynamic vendor rate generator */
export function generateVendorRates({
  originPincode,
  destPincode,
  shipmentType,
  isCOD,
  chargeableWeight,
}) {
  // ✅ simple weight slabs (you can tune later)
  const wt = Number(chargeableWeight || 0);

  // Example vendor base pricing
  const vendors = [
    {
      id: "delhivery",
      vendorCode: "DELHIVERY",
      base: 180,
      perKg: 55,
      tat: "3-5 Days",
    },
    {
      id: "bluedart",
      vendorCode: "BLUEDART",
      base: 230,
      perKg: 70,
      tat: "2-3 Days",
    },
    { id: "ekart", vendorCode: "EKART", base: 170, perKg: 52, tat: "3-6 Days" },
  ];

  // ✅ COD charge
  const codFee = isCOD ? 60 : 0;

  // ✅ remote / intercity multiplier (basic placeholder)
  const isSamePincode = originPincode === destPincode;
  const routeMultiplier = isSamePincode ? 0.95 : 1;

  return vendors.map((v) => {
    const baseFreight = (v.base + wt * v.perKg) * routeMultiplier;
    const fuelSurcharge = baseFreight * 0.12;
    const subtotal = baseFreight + fuelSurcharge + codFee;
    const gst = subtotal * 0.18;
    const total = subtotal + gst;

    return {
      id: v.id,
      vendorCode: v.vendorCode,
      tat: v.tat,
      chargeableWeight: Number(wt.toFixed(2)),
      price: Number(total.toFixed(2)),
      breakup: [
        { label: "Base Freight", amount: Number(baseFreight.toFixed(2)) },
        { label: "Fuel Surcharge", amount: Number(fuelSurcharge.toFixed(2)) },
        ...(isCOD
          ? [{ label: "COD Charges", amount: Number(codFee.toFixed(2)) }]
          : []),
        { label: "GST", amount: Number(gst.toFixed(2)) },
      ],
    };
  });
}
