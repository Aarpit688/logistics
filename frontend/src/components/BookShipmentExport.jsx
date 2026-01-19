import React, { useEffect, useState } from "react";

export default function BookShipmentExport({ prefill }) {
  const [originCountry] = useState("India");
  const [originPincode, setOriginPincode] = useState("");
  const [originCityState, setOriginCityState] = useState("");

  const [destinationCountry, setDestinationCountry] = useState("");
  const [destinationZipcode, setDestinationZipcode] = useState("");
  const [destinationCityState, setDestinationCityState] = useState("");

  // ✅ Prefill only if coming from calculator
  useEffect(() => {
    if (!prefill?.meta || prefill?.tab !== "export") {
      // opened directly → blank
      setOriginPincode("");
      setOriginCityState("");
      setDestinationCountry("");
      setDestinationZipcode("");
      setDestinationCityState("");
      return;
    }

    const meta = prefill.meta;

    setOriginPincode(meta.origin || "");
    setDestinationCountry(meta.destinationCountry || "");
    setDestinationZipcode(meta.destination || "");

    setOriginCityState(meta.originCityState || "");
    setDestinationCityState(meta.destCityState || "");
  }, [prefill]);

  // mock auto-fill (replace with API later)
  useEffect(() => {
    if (originPincode.length === 6 && !originCityState) {
      setOriginCityState("Auto filled city/state");
    }
  }, [originPincode]); // eslint-disable-line

  useEffect(() => {
    if (destinationZipcode && !destinationCityState) {
      setDestinationCityState("Auto filled city/state");
    }
  }, [destinationZipcode]); // eslint-disable-line

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Origin */}
        <div>
          <label className="block text-sm font-extrabold text-black">
            Origin Country
          </label>
          <input
            disabled
            value="India"
            className="mt-2 h-11 w-full rounded-md border border-black/10 px-4 text-sm font-bold bg-gray-50 cursor-not-allowed"
          />

          <label className="mt-5 block text-sm font-extrabold text-black">
            Origin Pincode
          </label>
          <input
            value={originPincode}
            onChange={(e) =>
              setOriginPincode(e.target.value.replace(/\D/g, ""))
            }
            maxLength={6}
            placeholder="Origin pincode"
            className="mt-2 h-11 w-full rounded-md border border-black/10 px-4 text-sm font-semibold outline-none"
          />

          <label className="mt-5 block text-sm font-extrabold text-black">
            Origin City / State
          </label>
          <input
            value={originCityState}
            onChange={(e) => setOriginCityState(e.target.value)}
            placeholder="Auto filled city/state"
            className="mt-2 h-11 w-full rounded-md border border-black/10 px-4 text-sm font-semibold outline-none"
          />
        </div>

        {/* Destination */}
        <div>
          <label className="block text-sm font-extrabold text-black">
            Destination Country
          </label>
          <input
            value={destinationCountry}
            onChange={(e) => setDestinationCountry(e.target.value)}
            placeholder="Destination country"
            className="mt-2 h-11 w-full rounded-md border border-black/10 px-4 text-sm font-semibold outline-none"
          />

          <label className="mt-5 block text-sm font-extrabold text-black">
            Destination Zipcode
          </label>
          <input
            value={destinationZipcode}
            onChange={(e) => setDestinationZipcode(e.target.value)}
            placeholder="Destination zipcode"
            className="mt-2 h-11 w-full rounded-md border border-black/10 px-4 text-sm font-semibold outline-none"
          />

          <label className="mt-5 block text-sm font-extrabold text-black">
            Destination City / State
          </label>
          <input
            value={destinationCityState}
            onChange={(e) => setDestinationCityState(e.target.value)}
            placeholder="Auto filled city/state"
            className="mt-2 h-11 w-full rounded-md border border-black/10 px-4 text-sm font-semibold outline-none"
          />
        </div>
      </div>
    </div>
  );
}
