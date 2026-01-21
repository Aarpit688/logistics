import React, { useEffect, useState, useRef } from "react";
import { MapPin, Map, Globe, Loader2, ChevronDown } from "lucide-react";

/** ✅ India Post API (Origin only) */
async function fetchPincodeDetails(pincode) {
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await res.json();

    if (!Array.isArray(data) || !data[0]) return null;

    const entry = data[0];
    if (entry.Status !== "Success" || !entry.PostOffice?.length) return null;

    const po = entry.PostOffice[0];
    return {
      city: (po.District || po.Name || "").toUpperCase(),
      state: (po.State || "").toUpperCase(),
      pincode,
    };
  } catch (e) {
    return null;
  }
}

/** ✅ Country Search API */
async function searchCountryAPI(query) {
  if (!query) return [];
  try {
    const url = `/api/proxy/booking/country/${query}?user_name=sgate&password=123456`;
    const res = await fetch(url);
    const json = await res.json();

    if (json.statusCode === 200 && Array.isArray(json.data)) {
      return json.data;
    }
    return [];
  } catch (error) {
    console.error("Country fetch failed", error);
    return [];
  }
}

/** ✅ Check Zipcode API */
async function checkZipcodeAPI(countryId, zipcode) {
  if (!countryId || !zipcode) return [];

  try {
    const res = await fetch(`/api/proxy/booking/check-zipcode`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_name: "sgate",
        password: "123456",
        country_id: countryId,
        zipcode: zipcode,
      }),
    });

    const json = await res.json();

    if (json.statusCode === 200 && Array.isArray(json.data)) {
      return json.data;
    }
    return [];
  } catch (error) {
    console.error("Zipcode check failed", error);
    return [];
  }
}

export default function BookShipmentExportStep1({ data, onChange, onNext }) {
  const shipment = data?.shipment || {};

  // Fields
  const originCountry = shipment.originCountry || "INDIA";
  const destinationCountry = shipment.destinationCountry || "";
  const originPincode = shipment.originPincode || "";
  const originCity = shipment.originCity || "";
  const originState = shipment.originState || "";
  const destZip = shipment.destZip || "";
  const destCity = shipment.destCity || "";
  const destState = shipment.destState || "";

  // UI State
  const [originLoading, setOriginLoading] = useState(false);
  const [originError, setOriginError] = useState("");
  const [missingFields, setMissingFields] = useState({});
  const [formError, setFormError] = useState("");

  // Country Autocomplete State
  const [countryQuery, setCountryQuery] = useState(destinationCountry);
  const [destinationCountryId, setDestinationCountryId] = useState(
    shipment.destinationCountryId || "",
  );
  const [countryOptions, setCountryOptions] = useState([]);
  const [countryLoading, setCountryLoading] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryWrapperRef = useRef(null);

  // Zipcode Autocomplete State
  const [zipOptions, setZipOptions] = useState([]);
  const [zipLoading, setZipLoading] = useState(false);
  const [showZipDropdown, setShowZipDropdown] = useState(false);
  const zipWrapperRef = useRef(null);

  const patchShipment = (patch) => {
    onChange?.({
      shipment: { ...shipment, ...patch },
    });
  };

  useEffect(() => {
    if (!shipment.originCountry) {
      patchShipment({ originCountry: "INDIA" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCountryQuery(destinationCountry);
  }, [destinationCountry]);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        countryWrapperRef.current &&
        !countryWrapperRef.current.contains(event.target)
      ) {
        setShowCountryDropdown(false);
      }
      if (
        zipWrapperRef.current &&
        !zipWrapperRef.current.contains(event.target)
      ) {
        setShowZipDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /** 🟢 Country Search Logic */
  useEffect(() => {
    if (countryQuery === destinationCountry && destinationCountryId) return;

    const timer = setTimeout(async () => {
      if (countryQuery.length >= 2) {
        setCountryLoading(true);
        const results = await searchCountryAPI(countryQuery);
        const filtered = results.filter(
          (c) => c.country_name?.toUpperCase() !== "INDIA",
        );
        setCountryOptions(filtered);
        setCountryLoading(false);
        if (filtered.length > 0) setShowCountryDropdown(true);
      } else {
        setCountryOptions([]);
        setShowCountryDropdown(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [countryQuery, destinationCountry, destinationCountryId]);

  /** 🟢 Zipcode Search Logic */
  useEffect(() => {
    if (!destZip || destZip.length < 3 || !destinationCountryId) {
      setZipOptions([]);
      setShowZipDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setZipLoading(true);
      const results = await checkZipcodeAPI(destinationCountryId, destZip);

      if (results && results.length > 0) {
        setZipOptions(results);
        setShowZipDropdown(true);
      } else {
        setZipOptions([]);
        setShowZipDropdown(false);
      }
      setZipLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [destZip, destinationCountryId]);

  const validateOriginOnBlur = async () => {
    if (!originPincode || originPincode.length !== 6) {
      if (originPincode) setOriginError("Invalid Pincode");
      return;
    }
    try {
      setOriginLoading(true);
      setOriginError("");
      const d = await fetchPincodeDetails(originPincode);
      if (!d) setOriginError("Invalid Pincode");
      else
        patchShipment({ originCity: d.city || "", originState: d.state || "" });
    } catch {
      setOriginError("Invalid Pincode");
    } finally {
      setOriginLoading(false);
    }
  };

  const validateStep1 = () => {
    const missing = {};
    if (!originCountry) missing.originCountry = true;
    if (!destinationCountry) missing.destinationCountry = true;
    if (!originPincode) missing.originPincode = true;
    if (!originCity) missing.originCity = true;
    if (!originState) missing.originState = true;
    if (!destZip) missing.destZip = true;
    if (!destCity) missing.destCity = true;
    if (!destState) missing.destState = true;

    setMissingFields(missing);
    if (Object.keys(missing).length > 0) {
      setFormError("All fields are required");
      return false;
    }
    setFormError("");
    return true;
  };

  return (
    <>
      <div className="mb-5">
        <h3 className="text-base font-extrabold text-black tracking-wide">
          Export Shipment Details
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* =================== ORIGIN =================== */}
        <div className="rounded-md border border-black/10 bg-white p-4">
          <h4 className="text-sm font-extrabold text-black tracking-wide">
            Origin
          </h4>
          <div className="mt-4 grid grid-cols-1 gap-4">
            <Field
              label="ORIGIN COUNTRY"
              required
              invalid={missingFields.originCountry}
              icon={<Globe className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                readOnly
                value="INDIA"
                className="h-11 w-full cursor-not-allowed bg-gray-50 px-4 text-sm font-extrabold text-gray-900 outline-none"
              />
            </Field>
            <Field
              label="ORIGIN PIN CODE"
              required
              invalid={missingFields.originPincode}
              icon={<MapPin className="h-4 w-4 text-[#6b7280]" />}
              hint={originLoading ? "Validating..." : originError}
              hintType={originError ? "error" : "muted"}
            >
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={originPincode}
                onChange={(e) => {
                  patchShipment({
                    originPincode: e.target.value.replace(/\D/g, ""),
                  });
                  setOriginError("");
                }}
                onBlur={validateOriginOnBlur}
                placeholder="Enter pincode"
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
              />
            </Field>
            <Field
              label="ORIGIN CITY"
              required
              invalid={missingFields.originCity}
              icon={<Map className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                type="text"
                value={originCity}
                onChange={(e) =>
                  patchShipment({ originCity: e.target.value.toUpperCase() })
                }
                placeholder="Origin city"
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
              />
            </Field>
            <Field
              label="ORIGIN STATE"
              required
              invalid={missingFields.originState}
              icon={<Map className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                type="text"
                value={originState}
                onChange={(e) =>
                  patchShipment({ originState: e.target.value.toUpperCase() })
                }
                placeholder="Origin state"
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
              />
            </Field>
          </div>
        </div>

        {/* ================= DESTINATION ================= */}
        <div className="rounded-md border border-black/10 bg-white p-4">
          <h4 className="text-sm font-extrabold text-black tracking-wide">
            Destination
          </h4>

          <div className="mt-4 grid grid-cols-1 gap-4">
            {/* ✅ DESTINATION COUNTRY - Custom Dropdown (Z-Index 50) */}
            <div ref={countryWrapperRef} className="relative z-50">
              <Field
                label="DESTINATION COUNTRY"
                required
                invalid={missingFields.destinationCountry}
                icon={<Globe className="h-4 w-4 text-[#6b7280]" />}
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={countryQuery}
                    onChange={(e) => {
                      setCountryQuery(e.target.value);
                      if (e.target.value !== destinationCountry) {
                        patchShipment({
                          destinationCountry: e.target.value,
                          destinationCountryId: "",
                        });
                        setDestinationCountryId("");
                      }
                    }}
                    onFocus={() => {
                      if (countryOptions.length > 0)
                        setShowCountryDropdown(true);
                    }}
                    placeholder="Type to search (e.g. Aus)"
                    className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
                  />
                  {countryLoading && (
                    <div className="absolute right-3 top-0 h-full flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
              </Field>

              {/* Country Dropdown */}
              {showCountryDropdown && countryOptions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-xl">
                  {countryOptions.map((c) => (
                    <button
                      key={c.country_id}
                      type="button"
                      onClick={() => {
                        patchShipment({
                          destinationCountry: c.country_name,
                          destinationCountryId: c.country_id,
                        });
                        setCountryQuery(c.country_name);
                        setDestinationCountryId(c.country_id);
                        setShowCountryDropdown(false);
                      }}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <span className="font-bold">{c.country_name}</span>
                      <span className="ml-2 text-xs text-gray-400">
                        ({c.country_code})
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ✅ DESTINATION ZIP - Custom Dropdown (Z-Index 40) */}
            <div ref={zipWrapperRef} className="relative z-40">
              <Field
                label="DESTINATION ZIP CODE"
                required
                invalid={missingFields.destZip}
                icon={<MapPin className="h-4 w-4 text-[#6b7280]" />}
                hint={
                  zipLoading
                    ? "Searching..."
                    : !destinationCountryId && destZip
                      ? "Select country first"
                      : ""
                }
                hintType={zipLoading ? "muted" : "error"}
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={destZip}
                    onChange={(e) =>
                      patchShipment({
                        destZip: e.target.value.replace(/[^\dA-Za-z-]/g, ""),
                      })
                    }
                    onFocus={() => {
                      if (zipOptions.length > 0) setShowZipDropdown(true);
                    }}
                    placeholder="Enter zip code"
                    className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
                  />
                  {zipLoading && (
                    <div className="absolute right-3 top-0 h-full flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
              </Field>

              {/* Zipcode Dropdown */}
              {showZipDropdown && zipOptions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-xl">
                  {zipOptions.map((item, idx) => (
                    <button
                      key={`${item.zipcode}-${idx}`}
                      type="button"
                      onClick={() => {
                        // User selects a specific City/State for this zipcode
                        patchShipment({
                          destZip: item.zipcode,
                          destCity: item.city_area?.toUpperCase() || "",
                          destState: item.state?.toUpperCase() || "",
                        });
                        setShowZipDropdown(false);
                      }}
                      className="block w-full border-b border-gray-50 px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 last:border-0"
                    >
                      <div className="font-bold text-gray-900">
                        {item.zipcode}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.city_area}, {item.state}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ✅ DESTINATION CITY - Fully Editable */}
            <Field
              label="DESTINATION CITY"
              required
              invalid={missingFields.destCity}
              icon={<Map className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                type="text"
                value={destCity}
                onChange={(e) =>
                  patchShipment({ destCity: e.target.value.toUpperCase() })
                }
                placeholder="Destination city"
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
              />
            </Field>

            {/* ✅ DESTINATION STATE - Fully Editable */}
            <Field
              label="DESTINATION STATE"
              required
              invalid={missingFields.destState}
              icon={<Map className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                type="text"
                value={destState}
                onChange={(e) =>
                  patchShipment({ destState: e.target.value.toUpperCase() })
                }
                placeholder="Destination state"
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
              />
            </Field>
          </div>
        </div>
      </div>

      <div className="mt-7 flex items-center justify-end">
        <button
          type="button"
          onClick={() => {
            if (validateStep1()) onNext?.();
          }}
          className="rounded-md bg-black px-7 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-gray-900 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-black/20"
        >
          Next
        </button>
      </div>

      {formError ? (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-extrabold tracking-wider text-red-700">
          {formError}
        </div>
      ) : null}
    </>
  );
}

/** ✅ Field Component */
function Field({
  label,
  required,
  icon,
  hint,
  hintType = "muted",
  invalid,
  children,
}) {
  const hintClass =
    hintType === "error"
      ? "text-red-600"
      : hintType === "success"
        ? "text-emerald-700"
        : "text-gray-500";
  return (
    <div>
      <label className="block text-sm font-bold tracking-wide text-[#111827]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div
        className={[
          "mt-2 flex items-center rounded-md bg-white shadow-sm",
          invalid
            ? "border border-red-300 ring-1 ring-red-200"
            : "border border-[#dbeafe] focus-within:ring-2 focus-within:ring-black/50",
        ].join(" ")}
      >
        <div
          className={[
            "grid h-11 w-11 place-items-center border-r bg-white rounded-l-md",
            invalid ? "border-red-200" : "border-[#dbeafe]",
          ].join(" ")}
        >
          {icon}
        </div>
        {children}
      </div>
      {hint ? (
        <p className={`mt-2 text-[11px] font-bold ${hintClass}`}>{hint}</p>
      ) : (
        <div className="mt-2 h-[14px]" />
      )}
    </div>
  );
}
