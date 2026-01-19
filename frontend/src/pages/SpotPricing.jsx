import React, { useState } from "react";
import SpotPricingDetails from "../components/SpotPricingDetails";
import SpotPricingServiceability from "../components/SpotPricingServiceability";
import { API_BASE_URL } from "../config/api";

export default function SpotPricingEnquiry() {
  const [checked, setChecked] = useState(false);

  // ✅ Serviceability form full values
  const [routeData, setRouteData] = useState(null);

  // ✅ Details form full values
  const [detailsData, setDetailsData] = useState(null);

  const [loading, setLoading] = useState(false);

  // ✅ called when user clicks CHECK in serviceability
  const handleChecked = (payload) => {
    setRouteData(payload);
    setChecked(true);
  };

  // ✅ called continuously when user types in details form
  const handleDetailsChange = (payload) => {
    setDetailsData(payload);
  };

  const handleResetAll = () => {
    setRouteData(null);
    setDetailsData(null);
    setChecked(false);
  };

  // ✅ Submit both components data together
  const handleFinalSubmit = async () => {
    if (!routeData) return alert("Serviceability data missing");
    if (!detailsData) return alert("Shipment details missing");

    const payload = {
      serviceability: routeData,
      shipmentDetails: detailsData,
    };

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/api/auth/spot-pricing/enquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result?.message || "Submit failed");

      alert("✅ Spot Pricing Enquiry Submitted!");
      handleResetAll();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* ✅ details only after check */}
      {checked && routeData ? (
        <SpotPricingDetails
          data={routeData}
          onReset={handleResetAll}
          onChange={handleDetailsChange}
          onSubmit={handleFinalSubmit}
          loading={loading}
        />
      ) : null}

      {/* ✅ serviceability visible before check */}
      {checked && routeData ? null : (
        <SpotPricingServiceability
          onChecked={handleChecked}
          onResetAll={handleResetAll}
        />
      )}
    </div>
  );
}
