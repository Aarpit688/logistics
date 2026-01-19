import React, { useEffect, useMemo, useState } from "react";
import { MapPin, Hash, Phone, User, Home, X } from "lucide-react";

/** ✅ India Post API */
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

const DOCUMENT_TYPES = [
  { value: "INVOICE", label: "INVOICE" },
  { value: "EWAY_BILL", label: "E-WAY BILL" },
  { value: "PACKING_LIST", label: "PACKING LIST" },
  { value: "OTHER", label: "OTHER" },
];

const makeEmptyDocRow = () => ({
  type: "INVOICE",
  otherName: "",
  file: null,
});

/**
 * ✅ Domestic Step 3
 * - Sender/Receiver address form
 * - Auto fill Pincode/City/State/Country from Step1 + API
 * - Upload documents (1 mandatory, more optional)
 */
export default function BookShipmentDomesticStep3({
  data,
  onChange,
  onNext,
  onBack,
}) {
  const shipment = data?.shipment || {}; // from Step1
  const addresses = data?.addresses || {}; // Step3 local payload section

  /** ✅ autofill values from Step1 */
  const originPincode = shipment.originPincode || "";
  const originCity = shipment.originCity || "";
  const destPincode = shipment.destPincode || "";
  const destCity = shipment.destCity || "";

  /** ✅ sender/receiver objects */
  const sender = addresses.sender || {};
  const receiver = addresses.receiver || {};
  const documents = addresses.documents || [makeEmptyDocRow()];

  /** ✅ local ui */
  const [missingFields, setMissingFields] = useState({});
  const [formError, setFormError] = useState("");

  const [originState, setOriginState] = useState(sender.state || "");
  const [destState, setDestState] = useState(receiver.state || "");

  const patchAddresses = (patch) => {
    onChange?.({
      addresses: {
        ...addresses,
        ...patch,
      },
    });
  };

  const patchSender = (patch) => {
    patchAddresses({
      sender: {
        ...sender,
        ...patch,
      },
    });
  };

  const patchReceiver = (patch) => {
    patchAddresses({
      receiver: {
        ...receiver,
        ...patch,
      },
    });
  };

  const patchDocs = (nextDocs) => {
    patchAddresses({ documents: nextDocs });
  };

  /** ✅ Auto fields derived from Step1 + API */
  const senderAuto = useMemo(
    () => ({
      pincode: originPincode,
      city: originCity,
      state: originState,
      country: "INDIA",
    }),
    [originPincode, originCity, originState],
  );

  const receiverAuto = useMemo(
    () => ({
      pincode: destPincode,
      city: destCity,
      state: destState,
      country: "INDIA",
    }),
    [destPincode, destCity, destState],
  );

  /** ✅ Autofill state using postal API (origin + destination) */
  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      // Origin
      if (originPincode?.length === 6) {
        const d = await fetchPincodeDetails(originPincode);
        if (d && isMounted) {
          setOriginState(d.state || "");

          // ✅ PATCH auto-filled (important for payload)
          patchSender({
            pincode: originPincode,
            city: originCity || d.city || "",
            state: d.state || "",
            country: "INDIA",
          });
        }
      } else {
        // fallback defaults
        patchSender({
          pincode: originPincode,
          city: originCity || "",
          country: "INDIA",
        });
      }

      // Destination
      if (destPincode?.length === 6) {
        const d2 = await fetchPincodeDetails(destPincode);
        if (d2 && isMounted) {
          setDestState(d2.state || "");

          // ✅ PATCH auto-filled (important for payload)
          patchReceiver({
            pincode: destPincode,
            city: destCity || d2.city || "",
            state: d2.state || "",
            country: "INDIA",
          });
        }
      } else {
        patchReceiver({
          pincode: destPincode,
          city: destCity || "",
          country: "INDIA",
        });
      }
    };

    run();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originPincode, destPincode]);

  /** ✅ Ensure at least 1 doc row always exists */
  useEffect(() => {
    if (!Array.isArray(documents) || documents.length === 0) {
      patchDocs([makeEmptyDocRow()]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** ✅ Validate step3 */
  const validateStep3 = () => {
    const missing = {};

    // ✅ Use auto fallback so validation does not fail for prefilled fields
    const senderFinal = {
      ...sender,
      pincode: sender.pincode || senderAuto.pincode,
      city: sender.city || senderAuto.city,
      state: sender.state || senderAuto.state,
      country: sender.country || "INDIA",
    };

    const receiverFinal = {
      ...receiver,
      pincode: receiver.pincode || receiverAuto.pincode,
      city: receiver.city || receiverAuto.city,
      state: receiver.state || receiverAuto.state,
      country: receiver.country || "INDIA",
    };

    // ✅ Sender required fields
    if (!senderFinal.contactNumber) missing.senderContactNumber = true;
    if (!senderFinal.name) missing.senderName = true;
    if (!senderFinal.addressLine1) missing.senderAddressLine1 = true;

    if (!senderFinal.pincode) missing.senderPincode = true;
    if (!senderFinal.city) missing.senderCity = true;
    if (!senderFinal.state) missing.senderState = true;
    if (!senderFinal.country) missing.senderCountry = true;

    // ✅ Receiver required fields
    if (!receiverFinal.contactNumber) missing.receiverContactNumber = true;
    if (!receiverFinal.name) missing.receiverName = true;
    if (!receiverFinal.addressLine1) missing.receiverAddressLine1 = true;

    if (!receiverFinal.pincode) missing.receiverPincode = true;
    if (!receiverFinal.city) missing.receiverCity = true;
    if (!receiverFinal.state) missing.receiverState = true;
    if (!receiverFinal.country) missing.receiverCountry = true;

    // ✅ Documents: at least 1 file required
    const firstDoc = documents?.[0];
    if (!firstDoc?.type) missing.doc0Type = true;
    if (!firstDoc?.file) missing.doc0File = true;

    if (firstDoc?.type === "OTHER" && !firstDoc?.otherName) {
      missing.doc0OtherName = true;
    }

    // Optional extra docs validation
    (documents || []).slice(1).forEach((d, idx) => {
      const i = idx + 1;
      const hasFile = !!d.file;
      const hasType = !!d.type;

      if (hasFile && !hasType) missing[`doc${i}Type`] = true;
      if (d.type === "OTHER" && (hasFile || hasType) && !d.otherName)
        missing[`doc${i}OtherName`] = true;
    });

    setMissingFields(missing);

    if (Object.keys(missing).length > 0) {
      setFormError("Please fill the highlighted fields");
      return false;
    }

    setFormError("");
    return true;
  };

  const handleNext = () => {
    // ✅ Ensure autofilled values are actually stored in payload before submit
    patchSender({
      pincode: sender.pincode || senderAuto.pincode,
      city: sender.city || senderAuto.city,
      state: sender.state || senderAuto.state,
      country: sender.country || "INDIA",
    });

    patchReceiver({
      pincode: receiver.pincode || receiverAuto.pincode,
      city: receiver.city || receiverAuto.city,
      state: receiver.state || receiverAuto.state,
      country: receiver.country || "INDIA",
    });

    const ok = validateStep3();
    if (!ok) return;

    onNext?.();
  };

  /** ✅ doc handlers */
  const updateDoc = (index, patch) => {
    const next = [...documents];
    next[index] = { ...next[index], ...patch };
    patchDocs(next);
  };

  const handleAddDoc = () => {
    patchDocs([...(documents || []), makeEmptyDocRow()]);
  };

  const handleRemoveDoc = (index) => {
    if (index === 0) return; // never remove first document row

    const next = documents.filter((_, i) => i !== index);
    patchDocs(next.length ? next : [makeEmptyDocRow()]);
  };

  return (
    <>
      <div className="mb-5">
        <h3 className="text-base font-extrabold text-black tracking-wide">
          Address Details
        </h3>
      </div>

      {/* ✅ Sender + Receiver blocks */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Sender */}
        <div className="rounded-md border border-black/10 bg-white p-4">
          <h4 className="text-sm font-extrabold text-black tracking-wide">
            Sender Details
          </h4>

          <div className="mt-4 grid grid-cols-1 gap-4">
            <Field
              label="SENDER CONTACT NUMBER"
              required
              invalid={missingFields.senderContactNumber}
              icon={<Phone className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={sender.contactNumber || ""}
                onChange={(e) =>
                  patchSender({
                    contactNumber: e.target.value.replace(/\D/g, ""),
                  })
                }
                placeholder="Enter contact number"
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
              />
            </Field>

            <Field
              label="SENDER NAME"
              required
              invalid={missingFields.senderName}
              icon={<User className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                type="text"
                value={sender.name || ""}
                onChange={(e) => patchSender({ name: e.target.value })}
                placeholder="Enter sender name"
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
              />
            </Field>

            <Field
              label="ADDRESS LINE 1"
              required
              invalid={missingFields.senderAddressLine1}
              icon={<Home className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                type="text"
                value={sender.addressLine1 || ""}
                onChange={(e) => patchSender({ addressLine1: e.target.value })}
                placeholder="House no, building, street"
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
              />
            </Field>
            <div className="flex items-center justify-center gap-4">
              {/* Autofill lock fields */}

              <LockedField
                label="CITY"
                required
                invalid={missingFields.senderCity}
                icon={<MapPin className="h-4 w-4 text-[#6b7280]" />}
                value={(senderAuto.city || "").toUpperCase()}
              />
              <LockedField
                label="STATE"
                required
                invalid={missingFields.senderState}
                icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
                value={(senderAuto.state || "").toUpperCase()}
              />
            </div>
            <div className="flex items-center justify-center gap-4">
              <LockedField
                label="COUNTRY"
                required
                invalid={missingFields.senderCountry}
                icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
                value="INDIA"
              />
              <LockedField
                label="PINCODE"
                required
                invalid={missingFields.senderPincode}
                icon={<MapPin className="h-4 w-4 text-[#6b7280]" />}
                value={senderAuto.pincode || ""}
              />
            </div>
          </div>
        </div>

        {/* Receiver */}
        <div className="rounded-md border border-black/10 bg-white p-4">
          <h4 className="text-sm font-extrabold text-black tracking-wide">
            Receiver Details
          </h4>

          <div className="mt-4 grid grid-cols-1 gap-4">
            <Field
              label="RECEIVER CONTACT NUMBER"
              required
              invalid={missingFields.receiverContactNumber}
              icon={<Phone className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={receiver.contactNumber || ""}
                onChange={(e) =>
                  patchReceiver({
                    contactNumber: e.target.value.replace(/\D/g, ""),
                  })
                }
                placeholder="Enter contact number"
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
              />
            </Field>

            <Field
              label="RECEIVER NAME"
              required
              invalid={missingFields.receiverName}
              icon={<User className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                type="text"
                value={receiver.name || ""}
                onChange={(e) => patchReceiver({ name: e.target.value })}
                placeholder="Enter receiver name"
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
              />
            </Field>

            <Field
              label="ADDRESS LINE 1"
              required
              invalid={missingFields.receiverAddressLine1}
              icon={<Home className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                type="text"
                value={receiver.addressLine1 || ""}
                onChange={(e) =>
                  patchReceiver({ addressLine1: e.target.value })
                }
                placeholder="House no, building, street"
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
              />
            </Field>

            <div className="flex items-center justify-center gap-4">
              <LockedField
                label="CITY"
                required
                invalid={missingFields.receiverCity}
                icon={<MapPin className="h-4 w-4 text-[#6b7280]" />}
                value={(receiverAuto.city || "").toUpperCase()}
              />
              <LockedField
                label="STATE"
                required
                invalid={missingFields.receiverState}
                icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
                value={(receiverAuto.state || "").toUpperCase()}
              />
            </div>
            <div className="flex items-center justify-center gap-4">
              <LockedField
                label="COUNTRY"
                required
                invalid={missingFields.receiverCountry}
                icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
                value="INDIA"
              />
              {/* Autofill lock fields */}
              <LockedField
                label="PINCODE"
                required
                invalid={missingFields.receiverPincode}
                icon={<MapPin className="h-4 w-4 text-[#6b7280]" />}
                value={receiverAuto.pincode || ""}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Upload Documents section */}
      <div className="mt-8 rounded-md border border-black/10 bg-white p-5">
        <h4 className="text-base font-extrabold text-black tracking-wide">
          Upload Documents
        </h4>
        <p className="mt-1 text-xs font-bold text-gray-500">
          At least 1 document is mandatory.
        </p>

        <div className="mt-5 space-y-4">
          {(documents || []).map((doc, index) => {
            const isOther = doc.type === "OTHER";

            return (
              <div
                key={index}
                className="rounded-md border border-black/10 bg-white p-4"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-center">
                  {/* Doc type */}
                  <div className="md:col-span-4">
                    <select
                      value={doc.type}
                      onChange={(e) =>
                        updateDoc(index, {
                          type: e.target.value,
                          otherName: "",
                        })
                      }
                      className="h-12 w-full rounded-md border border-black/10 bg-white px-4 text-sm font-extrabold text-gray-700 outline-none"
                    >
                      {DOCUMENT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>

                    {missingFields[`doc${index}Type`] ? (
                      <p className="mt-2 text-[11px] font-extrabold text-red-600">
                        Select document type
                      </p>
                    ) : (
                      <div className="mt-2 h-[14px]" />
                    )}
                  </div>

                  {/* Other name */}
                  {isOther ? (
                    <div className="md:col-span-3">
                      <input
                        type="text"
                        value={doc.otherName || ""}
                        onChange={(e) =>
                          updateDoc(index, { otherName: e.target.value })
                        }
                        placeholder="Document name"
                        className={[
                          "h-12 w-full rounded-md px-4 text-sm font-bold outline-none",
                          missingFields[`doc${index}OtherName`]
                            ? "border border-red-300 focus:ring-2 focus:ring-red-200"
                            : "border border-black/10 focus:ring-2 focus:ring-black/10",
                        ].join(" ")}
                      />

                      {missingFields[`doc${index}OtherName`] ? (
                        <p className="mt-2 text-[11px] font-extrabold text-red-600">
                          Enter document name
                        </p>
                      ) : (
                        <div className="mt-2 h-[14px]" />
                      )}
                    </div>
                  ) : (
                    <div className="md:col-span-3" />
                  )}

                  {/* Upload button */}
                  <div className="md:col-span-4">
                    <div className="flex items-center gap-3">
                      <label className="inline-flex h-12 cursor-pointer items-center justify-center rounded-md bg-gray-100 px-6 text-sm font-extrabold text-gray-900 hover:bg-gray-200 transition">
                        Choose File
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            updateDoc(index, { file });
                          }}
                        />
                      </label>

                      <div className="text-sm font-bold text-gray-600">
                        {doc.file?.name || "No file chosen"}
                      </div>
                    </div>

                    {/* Required only for first doc */}
                    {index === 0 && missingFields.doc0File ? (
                      <p className="mt-2 text-[11px] font-extrabold text-red-600">
                        Upload at least 1 document
                      </p>
                    ) : (
                      <div className="mt-2 h-[14px]" />
                    )}
                  </div>

                  {/* Remove */}
                  <div className="md:col-span-1 flex md:justify-end">
                    {index !== 0 ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(index)}
                        className="grid h-10 w-10 place-items-center rounded-md border border-black/10 hover:bg-gray-50 transition"
                        title="Remove document"
                      >
                        <X className="h-4 w-4 text-gray-700" />
                      </button>
                    ) : (
                      <div className="h-10 w-10" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleAddDoc}
          className="mt-4 text-sm font-extrabold text-[#2563eb] hover:underline"
        >
          + ADD ANOTHER
        </button>
      </div>

      {/* ✅ Back / Submit */}
      <div className="mt-7 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-gray-200 bg-gray-50 px-6 py-3 text-sm font-extrabold text-gray-700 hover:bg-gray-100 transition active:scale-[0.99]"
        >
          Back
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="rounded-md bg-black px-7 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-gray-900 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-black/20"
        >
          Submit
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

/* ✅ Your same Step UI field */
function Field({ label, required, icon, invalid, children }) {
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
    </div>
  );
}

/* ✅ Locked / non-editable styled field */
function LockedField({ label, required, icon, invalid, value }) {
  return (
    <Field label={label} required={required} icon={icon} invalid={invalid}>
      <input
        readOnly
        value={value}
        className="h-11 w-full cursor-not-allowed bg-gray-50 px-4 text-sm font-extrabold text-gray-900 outline-none"
      />
    </Field>
  );
}
