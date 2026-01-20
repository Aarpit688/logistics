import React, { useEffect, useState, useRef } from "react";
import { MapPin, Map, Globe, Loader2 } from "lucide-react";

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
    // Using the specific endpoint provided in your screenshot
    const url = `https://devapiv2.skart-express.com/api/v1/booking/country/${query}?user_name=sgate&password=123456`;
    const res = await fetch(url);
    const json = await res.json();

    // The API returns { data: [...] }
    if (json.statusCode === 200 && Array.isArray(json.data)) {
      return json.data;
    }
    return [];
  } catch (error) {
    console.error("Country fetch failed", error);
    return [];
  }
}

export default function BookShipmentExportStep1({ data, onChange, onNext }) {
  /** ✅ payload object */
  const shipment = data?.shipment || {};

  /** ✅ fields */
  const originCountry = shipment.originCountry || "INDIA";
  const destinationCountry = shipment.destinationCountry || "";
  const originPincode = shipment.originPincode || "";
  const originCity = shipment.originCity || "";
  const originState = shipment.originState || "";
  const destZip = shipment.destZip || "";
  const destCity = shipment.destCity || "";
  const destState = shipment.destState || "";

  /** ✅ UI State */
  const [originLoading, setOriginLoading] = useState(false);
  const [originError, setOriginError] = useState("");
  const [missingFields, setMissingFields] = useState({});
  const [formError, setFormError] = useState("");

  /** ✅ Autocomplete State */
  const [countryQuery, setCountryQuery] = useState(destinationCountry);
  const [countryOptions, setCountryOptions] = useState([]);
  const [countryLoading, setCountryLoading] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryWrapperRef = useRef(null);

  /** ✅ helper */
  const patchShipment = (patch) => {
    onChange?.({
      shipment: {
        ...shipment,
        ...patch,
      },
    });
  };

  /** ✅ Default fixed origin country */
  useEffect(() => {
    if (!shipment.originCountry) {
      patchShipment({ originCountry: "INDIA" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** ✅ Sync local state if parent data changes */
  useEffect(() => {
    setCountryQuery(destinationCountry);
  }, [destinationCountry]);

  /** ✅ Handle Outside Click to close dropdown */
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        countryWrapperRef.current &&
        !countryWrapperRef.current.contains(event.target)
      ) {
        setShowCountryDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /** ✅ Debounced Country Search */
  useEffect(() => {
    // Avoid re-fetching if the query matches what we just selected
    if (countryQuery === destinationCountry) return;

    const timer = setTimeout(async () => {
      if (countryQuery.length >= 2) {
        setCountryLoading(true);
        const results = await searchCountryAPI(countryQuery);

        // Filter out INDIA
        const filtered = results.filter(
          (c) => c.country_name?.toUpperCase() !== "INDIA",
        );

        setCountryOptions(filtered);
        setCountryLoading(false);
        // Only show if we found results
        if (filtered.length > 0) {
          setShowCountryDropdown(true);
        }
      } else {
        setCountryOptions([]);
        setShowCountryDropdown(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [countryQuery, destinationCountry]);

  /** ✅ Origin Pincode autofill */
  const validateOriginOnBlur = async () => {
    if (!originPincode) return;
    if (originPincode.length !== 6) {
      setOriginError("Invalid Pincode");
      return;
    }
    try {
      setOriginLoading(true);
      setOriginError("");
      const d = await fetchPincodeDetails(originPincode);
      if (!d) {
        setOriginError("Invalid Pincode");
      } else {
        patchShipment({
          originCity: d.city || "",
          originState: d.state || "",
        });
        setOriginError("");
      }
    } catch {
      setOriginError("Invalid Pincode");
    } finally {
      setOriginLoading(false);
    }
  };

  /** ✅ Validation */
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

  const handleNext = () => {
    const ok = validateStep1();
    if (!ok) return;
    onNext?.();
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
              hint={
                originLoading
                  ? "Validating..."
                  : originError
                    ? originError
                    : originPincode?.length === 6 && originCity
                      ? `${originCity}, ${originState}`
                      : ""
              }
              hintType={
                originError ? "error" : originCity ? "success" : "muted"
              }
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
            {/* ✅ FIXED: Added 'relative z-50' to force this ABOVE the zip code field */}
            <div ref={countryWrapperRef} className="relative z-50">
              <Field
                label="DESTINATION COUNTRY"
                required
                invalid={missingFields.destinationCountry}
                icon={<Globe className="h-4 w-4 text-[#6b7280]" />}
                hint={countryLoading ? "Fetching countries..." : ""}
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={countryQuery}
                    onChange={(e) => {
                      setCountryQuery(e.target.value);
                      // If user changes text, clear the "official" selected value
                      if (e.target.value !== destinationCountry) {
                        patchShipment({ destinationCountry: "" });
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

              {/* ✅ Dropdown Results */}
              {showCountryDropdown && countryOptions.length > 0 && (
                <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-xl">
                  {countryOptions.map((c) => (
                    <button
                      key={c.country_id}
                      type="button"
                      onClick={() => {
                        patchShipment({ destinationCountry: c.country_name });
                        setCountryQuery(c.country_name);
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

            <Field
              label="DESTINATION ZIP CODE"
              required
              invalid={missingFields.destZip}
              icon={<MapPin className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                type="text"
                value={destZip}
                onChange={(e) =>
                  patchShipment({
                    destZip: e.target.value.replace(/[^\dA-Za-z-]/g, ""),
                  })
                }
                placeholder="Enter zip code"
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
              />
            </Field>

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
          onClick={handleNext}
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

      <p className="mt-4 text-xs text-gray-500">
        Tip: Type the destination country name to search.
      </p>
    </>
  );
}

/** * ✅ Field Component Update:
 * 1. Removed `overflow-hidden` so the dropdown isn't clipped.
 * 2. Added `rounded-l-md` to the icon container to maintain the visual style.
 */
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

      {/* REMOVED overflow-hidden here */}
      <div
        className={[
          "mt-2 flex items-center rounded-md bg-white shadow-sm",
          invalid
            ? "border border-red-300 focus-within:ring-2 focus-within:ring-red-200"
            : "border border-[#dbeafe] focus-within:ring-2 focus-within:ring-black/50",
        ].join(" ")}
      >
        {/* Added rounded-l-md here */}
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
