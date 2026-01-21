import React, { useEffect, useMemo, useState } from "react";
import {
  MapPin,
  Hash,
  Phone,
  User,
  Home,
  X,
  Mail,
  Building2,
  Upload,
  ChevronDown,
} from "lucide-react";

/** ✅ India Post API (for sender origin only in export too if origin is India) */
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

/** ✅ Receiver ID types (image) */
const RECEIVER_ID_TYPES = [
  { value: "VAT", label: "VAT" },
  { value: "EORI", label: "EORI" },
  { value: "OTHER", label: "OTHER" },
];

/** ✅ Sender KYC types (image) */
const SENDER_KYC_TYPES = [
  { value: "GST", label: "GST" },
  { value: "AADHAR", label: "AADHAR" },
  { value: "PAN", label: "PAN" },
  { value: "VOTER_ID", label: "VOTER ID" },
  { value: "PASSPORT", label: "PASSPORT" },
];

/** ✅ Tax Payment Option (image) */
const TAX_PAYMENT_OPTIONS = [
  { value: "IGST", label: "IGST" },
  { value: "BOND", label: "BOND" },
  { value: "NOT_APP", label: "NOT APP" },
];

/** ✅ document uploader: Export Step3 (KYC) */
const DOCUMENT_TYPES = [
  { value: "KYC", label: "KYC DOCUMENT" },
  { value: "OTHER", label: "OTHER" },
];

const makeEmptyDocRow = () => ({
  type: "KYC",
  otherName: "",
  file: null,
});

/**
 * ✅ Export Step 3
 * - Sender + Receiver details (as image)
 * - Sender: Pin auto from Step1 + IndiaPost API for State
 * - Receiver: Zip from Step1, and user fills city/state/country
 * - Receiver: ID Type + ID Number
 * - Sender: IEC No, KYC Type, KYC No, Tax Payment Option, Upload KYC (2 mandatory)
 */
export default function BookShipmentExportStep3({
  data,
  onChange,
  onNext,
  onBack,
}) {
  const shipment = data?.shipment || {}; // Step1 payload
  const addresses = data?.addresses || {}; // Step3 payload section

  /** ✅ Step1 autofill */
  const originPincode = shipment.originPincode || "";
  const originCity = shipment.originCity || "";
  const originStateFromStep1 = shipment.originState || "";

  const destinationCountry = shipment.destinationCountry || "";
  const destZip = shipment.destZip || "";
  const destCityFromStep1 = shipment.destCity || "";
  const destStateFromStep1 = shipment.destState || "";

  /** ✅ sender / receiver payload */
  const sender = addresses.sender || {};
  const receiver = addresses.receiver || {};
  const documents = addresses.documents || []; // export KYC docs

  /** ✅ local UI */
  const [missingFields, setMissingFields] = useState({});
  const [formError, setFormError] = useState("");

  const [originState, setOriginState] = useState(
    sender.state || originStateFromStep1 || "",
  );
  const [originCityLocal, setOriginCityLocal] = useState(
    sender.city || originCity || "",
  );

  /** ✅ patch helpers */
  const patchAddresses = (patch) => {
    onChange?.({
      addresses: {
        ...addresses,
        ...patch,
      },
    });
  };

  const patchSender = (patch) =>
    patchAddresses({ sender: { ...sender, ...patch } });

  const patchReceiver = (patch) =>
    patchAddresses({ receiver: { ...receiver, ...patch } });

  const patchDocs = (nextDocs) => patchAddresses({ documents: nextDocs });

  /** ✅ Sender auto (India) */
  const senderAuto = useMemo(
    () => ({
      pincode: originPincode,
      city: originCityLocal || originCity,
      state: originState || originStateFromStep1,
      country: "INDIA",
    }),
    [
      originPincode,
      originCityLocal,
      originCity,
      originState,
      originStateFromStep1,
    ],
  );

  /** ✅ Receiver auto from step1 (zip + country) */
  const receiverAuto = useMemo(
    () => ({
      zip: destZip,
      country: destinationCountry,
    }),
    [destZip, destinationCountry],
  );

  /** ✅ Origin state autofill via India Post */
  useEffect(() => {
    let mounted = true;

    const run = async () => {
      // origin pincode
      if (originPincode?.length === 6) {
        const d = await fetchPincodeDetails(originPincode);
        if (d && mounted) {
          setOriginState(d.state || originStateFromStep1 || "");
          setOriginCityLocal(originCity || d.city || "");

          patchSender({
            pincode: originPincode,
            city: originCity || d.city || "",
            state: d.state || originStateFromStep1 || "",
            country: "INDIA",
          });
        }
      } else {
        patchSender({
          pincode: originPincode,
          city: originCity || "",
          state: originStateFromStep1 || "",
          country: "INDIA",
        });
      }

      // receiver defaults
      patchReceiver({
        zipCode: destZip,
        country: destinationCountry || receiver.country || "",
        city: destCityFromStep1 || receiver.city || "",
        state: destStateFromStep1 || receiver.state || "",
      });
    };

    run();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originPincode, destZip]);

  /** ✅ ensure KYC docs: 2 mandatory */
  useEffect(() => {
    if (!Array.isArray(documents) || documents.length < 2) {
      const base = Array.isArray(documents) ? [...documents] : [];
      while (base.length < 2) base.push(makeEmptyDocRow());
      patchDocs(base);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** ✅ validate */
  const validateStep3 = () => {
    const missing = {};

    const senderFinal = {
      ...sender,
      pincode: sender.pincode || senderAuto.pincode,
      city: sender.city || senderAuto.city,
      state: sender.state || senderAuto.state,
      country: sender.country || "INDIA",
    };

    const receiverFinal = {
      ...receiver,
      zipCode: receiver.zipCode || receiverAuto.zip,
      country: receiver.country || receiverAuto.country,
      city: receiver.city || destCityFromStep1,
      state: receiver.state || destStateFromStep1,
    };

    /** ✅ Sender validations (image) */
    if (!senderFinal.contactNumber) missing.senderContactNumber = true;
    if (!senderFinal.name) missing.senderName = true;
    if (!senderFinal.companyName) missing.senderCompanyName = true;
    if (!senderFinal.email) missing.senderEmail = true;

    if (!senderFinal.addressLine1) missing.senderAddressLine1 = true;
    // addressLine2 optional (as image)
    if (!senderFinal.city) missing.senderCity = true;
    if (!senderFinal.state) missing.senderState = true;
    if (!senderFinal.country) missing.senderCountry = true;
    if (!senderFinal.pincode) missing.senderPincode = true;

    if (!senderFinal.iecNo) missing.senderIECNo = true;

    if (!senderFinal.kycType) missing.senderKycType = true;
    if (!senderFinal.kycNo) missing.senderKycNo = true;

    if (!senderFinal.taxPaymentOption) missing.senderTaxPaymentOption = true;

    /** ✅ Receiver validations (image) */
    if (!receiverFinal.contactNumber) missing.receiverContactNumber = true;
    if (!receiverFinal.name) missing.receiverName = true;
    if (!receiverFinal.companyName) missing.receiverCompanyName = true;
    if (!receiverFinal.email) missing.receiverEmail = true;

    if (!receiverFinal.addressLine1) missing.receiverAddressLine1 = true;
    // addressLine2 optional
    if (!receiverFinal.city) missing.receiverCity = true;
    if (!receiverFinal.state) missing.receiverState = true;
    if (!receiverFinal.country) missing.receiverCountry = true;
    if (!receiverFinal.zipCode) missing.receiverZip = true;

    if (!receiverFinal.idType) missing.receiverIdType = true;
    if (!receiverFinal.idNumber) missing.receiverIdNumber = true;

    // delivery instructions optional

    /** ✅ Documents: 2 mandatory KYC uploads */
    const d0 = documents?.[0];
    const d1 = documents?.[1];

    if (!d0?.type) missing.doc0Type = true;
    if (!d0?.file) missing.doc0File = true;
    if (d0?.type === "OTHER" && !d0?.otherName) missing.doc0OtherName = true;

    if (!d1?.type) missing.doc1Type = true;
    if (!d1?.file) missing.doc1File = true;
    if (d1?.type === "OTHER" && !d1?.otherName) missing.doc1OtherName = true;

    // Optional docs
    (documents || []).slice(2).forEach((d, idx) => {
      const i = idx + 2;
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
    // store auto
    patchSender({
      pincode: sender.pincode || senderAuto.pincode,
      city: sender.city || senderAuto.city,
      state: sender.state || senderAuto.state,
      country: sender.country || "INDIA",
    });

    patchReceiver({
      zipCode: receiver.zipCode || receiverAuto.zip,
      country: receiver.country || receiverAuto.country,
    });

    const ok = validateStep3();
    if (!ok) return;
    onNext?.();
  };

  /** ✅ doc handlers */
  const updateDoc = (index, patch) => {
    const next = [...(documents || [])];
    next[index] = { ...next[index], ...patch };
    patchDocs(next);
  };

  const handleAddDoc = () => {
    patchDocs([...(documents || []), makeEmptyDocRow()]);
  };

  const handleRemoveDoc = (index) => {
    // keep 2 mandatory
    if (index === 0 || index === 1) return;
    const next = documents.filter((_, i) => i !== index);
    patchDocs(next.length ? next : [makeEmptyDocRow(), makeEmptyDocRow()]);
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
        {/* ===================== Sender ===================== */}
        <div className="rounded-md border border-black/10 bg-white p-4">
          <h4 className="text-sm font-extrabold text-black tracking-wide">
            Sender Details
          </h4>

          <div className="mt-4 grid grid-cols-1 gap-4">
            <Field
              label="MOBILE NUMBER"
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
                placeholder="Enter mobile number"
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
              />
            </Field>

            <Field
              label="NAME"
              required
              invalid={missingFields.senderName}
              icon={<User className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                type="text"
                value={sender.name || ""}
                onChange={(e) => patchSender({ name: e.target.value })}
                placeholder="Enter name"
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
              />
            </Field>

            <Field
              label="COMPANY NAME"
              required
              invalid={missingFields.senderCompanyName}
              icon={<Building2 className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                type="text"
                value={sender.companyName || ""}
                onChange={(e) => patchSender({ companyName: e.target.value })}
                placeholder="Enter company name"
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
              />
            </Field>

            <Field
              label="EMAIL ID"
              required
              invalid={missingFields.senderEmail}
              icon={<Mail className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                type="email"
                value={sender.email || ""}
                onChange={(e) => patchSender({ email: e.target.value })}
                placeholder="Enter email"
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

            <Field
              label="ADDRESS LINE 2"
              required={false}
              invalid={false}
              icon={<Home className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                type="text"
                value={sender.addressLine2 || ""}
                onChange={(e) => patchSender({ addressLine2: e.target.value })}
                placeholder="Area, landmark (optional)"
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
              />
            </Field>

            {/* City / Pin */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <LockedField
                label="CITY"
                required
                invalid={missingFields.senderCity}
                icon={<MapPin className="h-4 w-4 text-[#6b7280]" />}
                value={(senderAuto.city || "").toUpperCase()}
              />
              <LockedField
                label="PIN CODE"
                required
                invalid={missingFields.senderPincode}
                icon={<MapPin className="h-4 w-4 text-[#6b7280]" />}
                value={senderAuto.pincode || ""}
              />
            </div>

            {/* State / Country */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <LockedField
                label="STATE"
                required
                invalid={missingFields.senderState}
                icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
                value={(senderAuto.state || "").toUpperCase()}
              />
              <LockedField
                label="COUNTRY"
                required
                invalid={missingFields.senderCountry}
                icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
                value="INDIA"
              />
            </div>

            {/* IEC No */}
            <Field
              label="IEC NO."
              required
              invalid={missingFields.senderIECNo}
              icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                type="text"
                value={sender.iecNo || ""}
                onChange={(e) => patchSender({ iecNo: e.target.value })}
                placeholder="Enter IEC number"
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
              />
            </Field>

            {/* KYC Type + KYC No (same row) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="KYC TYPE"
                required
                invalid={missingFields.senderKycType}
                icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
              >
                <div className="relative w-full">
                  <select
                    value={sender.kycType || ""}
                    onChange={(e) => patchSender({ kycType: e.target.value })}
                    className="h-11 w-full appearance-none bg-transparent px-4 pr-10 text-sm font-extrabold text-[#111827] outline-none"
                  >
                    <option value="" disabled>
                      Select
                    </option>
                    {SENDER_KYC_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                </div>
              </Field>

              <Field
                label="KYC NO."
                required
                invalid={missingFields.senderKycNo}
                icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
              >
                <input
                  type="text"
                  value={sender.kycNo || ""}
                  onChange={(e) => patchSender({ kycNo: e.target.value })}
                  placeholder="Enter KYC number"
                  className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
                />
              </Field>
            </div>

            {/* Tax Payment Option */}
            <Field
              label="TAX PAYMENT OPTION"
              required
              invalid={missingFields.senderTaxPaymentOption}
              icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
            >
              <div className="relative w-full">
                <select
                  value={sender.taxPaymentOption || ""}
                  onChange={(e) =>
                    patchSender({ taxPaymentOption: e.target.value })
                  }
                  className="h-11 w-full appearance-none bg-transparent px-4 pr-10 text-sm font-extrabold text-[#111827] outline-none"
                >
                  <option value="" disabled>
                    Select option
                  </option>
                  {TAX_PAYMENT_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              </div>
            </Field>
          </div>
        </div>

        {/* ===================== Receiver ===================== */}
        <div className="rounded-md border border-black/10 bg-white p-4">
          <h4 className="text-sm font-extrabold text-black tracking-wide">
            Receiver Details
          </h4>

          <div className="mt-4 grid grid-cols-1 gap-4">
            <Field
              label="MOBILE NO."
              required
              invalid={missingFields.receiverContactNumber}
              icon={<Phone className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                type="text"
                inputMode="numeric"
                maxLength={16}
                value={receiver.contactNumber || ""}
                onChange={(e) =>
                  patchReceiver({
                    contactNumber: e.target.value.replace(/[^\d+]/g, ""),
                  })
                }
                placeholder="Enter mobile number"
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
              />
            </Field>

            <Field
              label="NAME"
              required
              invalid={missingFields.receiverName}
              icon={<User className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                type="text"
                value={receiver.name || ""}
                onChange={(e) => patchReceiver({ name: e.target.value })}
                placeholder="Enter name"
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
              />
            </Field>

            <Field
              label="COMPANY NAME"
              required
              invalid={missingFields.receiverCompanyName}
              icon={<Building2 className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                type="text"
                value={receiver.companyName || ""}
                onChange={(e) => patchReceiver({ companyName: e.target.value })}
                placeholder="Enter company name"
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
              />
            </Field>

            <Field
              label="EMAIL ID"
              required
              invalid={missingFields.receiverEmail}
              icon={<Mail className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                type="email"
                value={receiver.email || ""}
                onChange={(e) => patchReceiver({ email: e.target.value })}
                placeholder="Enter email"
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

            <Field
              label="ADDRESS LINE 2"
              required={false}
              invalid={false}
              icon={<Home className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                type="text"
                value={receiver.addressLine2 || ""}
                onChange={(e) =>
                  patchReceiver({ addressLine2: e.target.value })
                }
                placeholder="Area, landmark (optional)"
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
              />
            </Field>

            {/* City / Zip */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="CITY"
                required
                invalid={missingFields.receiverCity}
                icon={<MapPin className="h-4 w-4 text-[#6b7280]" />}
              >
                <input
                  type="text"
                  value={receiver.city || destCityFromStep1 || ""}
                  onChange={(e) =>
                    patchReceiver({ city: e.target.value.toUpperCase() })
                  }
                  placeholder="Enter city"
                  className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
                />
              </Field>

              <LockedField
                label="ZIP CODE"
                required
                invalid={missingFields.receiverZip}
                icon={<MapPin className="h-4 w-4 text-[#6b7280]" />}
                value={receiverAuto.zip || ""}
              />
            </div>

            {/* State / Country */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="STATE"
                required
                invalid={missingFields.receiverState}
                icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
              >
                <input
                  type="text"
                  value={receiver.state || destStateFromStep1 || ""}
                  onChange={(e) =>
                    patchReceiver({ state: e.target.value.toUpperCase() })
                  }
                  placeholder="Enter state"
                  className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
                />
              </Field>

              <LockedField
                label="COUNTRY"
                required
                invalid={missingFields.receiverCountry}
                icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
                value={(receiverAuto.country || "").toUpperCase()}
              />
            </div>

            {/* ID Type + ID number */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="ID TYPE"
                required
                invalid={missingFields.receiverIdType}
                icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
              >
                <div className="relative w-full">
                  <select
                    value={receiver.idType || ""}
                    onChange={(e) => patchReceiver({ idType: e.target.value })}
                    className="h-11 w-full appearance-none bg-transparent px-4 pr-10 text-sm font-extrabold text-[#111827] outline-none"
                  >
                    <option value="" disabled>
                      Select
                    </option>
                    {RECEIVER_ID_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                </div>
              </Field>

              <Field
                label="ID NUMBER"
                required
                invalid={missingFields.receiverIdNumber}
                icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
              >
                <input
                  type="text"
                  value={receiver.idNumber || ""}
                  onChange={(e) => patchReceiver({ idNumber: e.target.value })}
                  placeholder="Enter ID number"
                  className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
                />
              </Field>
            </div>

            {/* Delivery instructions */}
            <Field
              label="DELIVERY INSTRUCTIONS"
              required={false}
              invalid={false}
              icon={<Hash className="h-4 w-4 text-[#6b7280]" />}
            >
              <input
                type="text"
                value={receiver.deliveryInstructions || ""}
                onChange={(e) =>
                  patchReceiver({ deliveryInstructions: e.target.value })
                }
                placeholder="Optional"
                className="h-11 w-full px-4 text-sm text-gray-800 outline-none placeholder:text-[#9ca3af]"
              />
            </Field>
          </div>
        </div>
      </div>

      {/* ✅ Upload KYC Docs (2 mandatory) */}
      <div className="mt-8 rounded-md border border-black/10 bg-white p-5">
        <h4 className="text-base font-extrabold text-black tracking-wide">
          Upload KYC
        </h4>
        <p className="mt-1 text-xs font-bold text-gray-500">
          2 KYC documents are mandatory.
        </p>

        <div className="mt-5 space-y-4">
          {(documents || []).map((doc, index) => {
            const isOther = doc.type === "OTHER";
            const isMandatory = index < 2;

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

                  {/* upload */}
                  <div className="md:col-span-4">
                    <div className="flex items-center gap-3">
                      <label className="inline-flex h-12 cursor-pointer items-center justify-center rounded-md bg-gray-100 px-6 text-sm font-extrabold text-gray-900 hover:bg-gray-200 transition">
                        <Upload className="mr-2 h-4 w-4" />
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

                    {missingFields[`doc${index}File`] ||
                    (index === 0 && missingFields.doc0File) ||
                    (index === 1 && missingFields.doc1File) ? (
                      <p className="mt-2 text-[11px] font-extrabold text-red-600">
                        Upload {isMandatory ? "mandatory" : "a"} document
                      </p>
                    ) : (
                      <div className="mt-2 h-[14px]" />
                    )}
                  </div>

                  {/* remove */}
                  <div className="md:col-span-1 flex md:justify-end">
                    {!isMandatory ? (
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
          className="mt-4 text-sm font-bold hover:underline"
        >
          + ADD ANOTHER
        </button>
      </div>

      {/* ✅ Back / Next */}
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

/* ✅ Same UI Field */
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

/* ✅ Locked Field */
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
