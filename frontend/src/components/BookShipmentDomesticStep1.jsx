import React, { useState } from "react";
import { MapPin, Map, Package, ChevronDown } from "lucide-react";

// ✅ India Post API
async function fetchPincodeDetails(pincode) {
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
}

export default function BookShipmentDomesticStep1({
  data,
  onChange,
  onNext,
  onBack, // (optional)
}) {
  // ✅ all values from parent
  const shipment = data?.shipment || {};

  const shipmentType = shipment.shipmentType || "Document";
  const originPincode = shipment.originPincode || "";
  const originCity = shipment.originCity || "";
  const destPincode = shipment.destPincode || "";
  const destCity = shipment.destCity || "";

  // ✅ local UI-only states
  const [originLoading, setOriginLoading] = useState(false);
  const [destLoading, setDestLoading] = useState(false);

  const [originError, setOriginError] = useState("");
  const [destError, setDestError] = useState("");

  const [missingFields, setMissingFields] = useState({});
  const [formError, setFormError] = useState("");

  // ✅ helper to update shipment object in parent
  const patchShipment = (patch) => {
    onChange?.({
      shipment: {
        ...shipment,
        ...patch,
      },
    });
  };

  // ✅ Origin pincode autofill
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
        patchShipment({ originCity: d.city || "" });
        setOriginError("");
      }
    } catch {
      setOriginError("Invalid Pincode");
    } finally {
      setOriginLoading(false);
    }
  };

  // ✅ Destination pincode autofill
  const validateDestOnBlur = async () => {
    if (!destPincode) return;

    if (destPincode.length !== 6) {
      setDestError("Invalid Pincode");
      return;
    }

    try {
      setDestLoading(true);
      setDestError("");

      const d = await fetchPincodeDetails(destPincode);
      if (!d) {
        setDestError("Invalid Pincode");
      } else {
        patchShipment({ destCity: d.city || "" });
        setDestError("");
      }
    } catch {
      setDestError("Invalid Pincode");
    } finally {
      setDestLoading(false);
    }
  };

  const validateStep1 = () => {
    const missing = {};

    if (!shipment.shipmentType) missing.shipmentType = true;
    if (!originPincode) missing.originPincode = true;
    if (!originCity) missing.originCity = true;
    if (!destPincode) missing.destPincode = true;
    if (!destCity) missing.destCity = true;

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
    onNext?.(); // ✅ parent increments step
  };

  return (
    <>
      {/* ✅ Shipment type TOP center */}
      <div className="mb-2 flex justify-center">
        <div className="w-full max-w-md">
          <Field
            label="SHIPMENT TYPE"
            required
            invalid={missingFields.shipmentType}
            icon={<Package className="h-4 w-4 text-[#6b7280]" />}
          >
            <div className="flex h-11 w-full items-center gap-6 px-4">
              {/* Document */}
              <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-[#111827]">
                <input
                  type="radio"
                  name="shipmentType"
                  value="Document"
                  checked={(shipmentType || "Document") === "Document"}
                  onChange={(e) =>
                    patchShipment({ shipmentType: e.target.value })
                  }
                  className="h-4 w-4 accent-black"
                />
                Document
              </label>

              {/* Non-Document */}
              <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-[#111827]">
                <input
                  type="radio"
                  name="shipmentType"
                  value="Non-Document"
                  checked={shipmentType === "Non-Document"}
                  onChange={(e) =>
                    patchShipment({ shipmentType: e.target.value })
                  }
                  className="h-4 w-4 accent-black"
                />
                Non-Document
              </label>
            </div>
          </Field>
        </div>
      </div>

      {/* ✅ Step 1 form */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="ORIGIN PINCODE"
          required
          invalid={missingFields.originPincode}
          icon={<MapPin className="h-4 w-4 text-[#6b7280]" />}
          hint={
            originLoading
              ? "Validating..."
              : originError
                ? originError
                : originPincode?.length === 6 && originCity
                  ? originCity
                  : ""
          }
          hintType={originError ? "error" : originCity ? "success" : "muted"}
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
            placeholder="Enter origin pincode"
            className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
          />
        </Field>

        <Field
          label="ORIGIN CITY"
          required
          invalid={missingFields.originCity}
          icon={<MapPin className="h-4 w-4 text-[#6b7280]" />}
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
          label="DESTINATION PINCODE"
          required
          invalid={missingFields.destPincode}
          icon={<Map className="h-4 w-4 text-[#6b7280]" />}
          hint={
            destLoading
              ? "Validating..."
              : destError
                ? destError
                : destPincode?.length === 6 && destCity
                  ? destCity
                  : ""
          }
          hintType={destError ? "error" : destCity ? "success" : "muted"}
        >
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={destPincode}
            onChange={(e) => {
              patchShipment({ destPincode: e.target.value.replace(/\D/g, "") });
              setDestError("");
            }}
            onBlur={validateDestOnBlur}
            placeholder="Enter destination pincode"
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
      </div>

      {/* ✅ Back / Next buttons */}
      <div className="mt-7 flex items-center justify-between gap-3">
        <div />

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
        Tip: Enter correct pincode to avoid ODA surprises.
      </p>
    </>
  );
}
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
          "mt-2 flex items-center overflow-hidden rounded-md bg-white shadow-sm",
          invalid
            ? "border border-red-300 focus-within:ring-2 focus-within:ring-red-200"
            : "border border-[#dbeafe] focus-within:ring-2 focus-within:ring-[#f2b632]/40",
        ].join(" ")}
      >
        <div
          className={[
            "grid h-11 w-11 place-items-center border-r bg-white",
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
