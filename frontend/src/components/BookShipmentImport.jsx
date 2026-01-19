import React, { useEffect, useState } from "react";

export default function BookShipmentImport({ prefill }) {
  const [destinationCountry] = useState("India");
  const [destinationPincode, setDestinationPincode] = useState("");
  const [destinationCityState, setDestinationCityState] = useState("");

  const [originCountry, setOriginCountry] = useState("");
  const [originZipcode, setOriginZipcode] = useState("");
  const [originCityState, setOriginCityState] = useState("");

  // ✅ Prefill only if coming from calculator
  useEffect(() => {
    if (!prefill?.meta || prefill?.tab !== "import") {
      // opened directly → blank
      setDestinationPincode("");
      setDestinationCityState("");
      setOriginCountry("");
      setOriginZipcode("");
      setOriginCityState("");
      return;
    }

    const meta = prefill.meta;

    setDestinationPincode(meta.destinationPincode || "");
    setOriginCountry(meta.originCountry || "");
    setOriginZipcode(meta.originZipcode || "");

    setDestinationCityState(meta.destCityState || "");
    setOriginCityState(meta.originCityState || "");
  }, [prefill]);

  // mock auto-fill (replace with API later)
  useEffect(() => {
    if (destinationPincode.length === 6 && !destinationCityState) {
      setDestinationCityState("Auto filled city/state");
    }
  }, [destinationPincode]); // eslint-disable-line

  useEffect(() => {
    if (originZipcode && !originCityState) {
      setOriginCityState("Auto filled city/state");
    }
  }, [originZipcode]); // eslint-disable-line

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Destination */}
        <div>
          <label className="block text-sm font-extrabold text-black">
            Destination Country
          </label>
          <input
            disabled
            value="India"
            className="mt-2 h-11 w-full rounded-md border border-black/10 px-4 text-sm font-bold bg-gray-50 cursor-not-allowed"
          />

          <label className="mt-5 block text-sm font-extrabold text-black">
            Destination Pincode
          </label>
          <input
            value={destinationPincode}
            onChange={(e) =>
              setDestinationPincode(e.target.value.replace(/\D/g, ""))
            }
            maxLength={6}
            placeholder="Destination pincode"
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

        {/* Origin */}
        <div>
          <label className="block text-sm font-extrabold text-black">
            Origin Country
          </label>
          <input
            value={originCountry}
            onChange={(e) => setOriginCountry(e.target.value)}
            placeholder="Origin country"
            className="mt-2 h-11 w-full rounded-md border border-black/10 px-4 text-sm font-semibold outline-none"
          />

          <label className="mt-5 block text-sm font-extrabold text-black">
            Origin Zipcode
          </label>
          <input
            value={originZipcode}
            onChange={(e) => setOriginZipcode(e.target.value)}
            placeholder="Origin zipcode"
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
      </div>
    </div>
  );
}
