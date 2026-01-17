import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Plane,
  PlaneLanding,
  ChevronDown,
  Search,
  MapPin,
  Map,
} from "lucide-react";

/**
 * ✅ Serviceability UI (Export + Import)
 * - Export: Origin Country fixed to INDIA
 * - Origin pincode => onBlur fetch city/state using India Post API (editable city field)
 * - Destination country: type + select from countries API (REST Countries)
 * - After selecting destination country => show Destination Pincode + Destination City
 *
 * - Import:
 *   - Origin country: selectable
 *   - Destination country fixed to INDIA
 *   - Destination pincode => onBlur fetch destination city/state using India Post API (editable city field)
 */

async function fetchIndiaPincodeCity(pincode) {
  const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
  const data = await res.json();
  if (!Array.isArray(data) || !data[0]) return null;
  const entry = data[0];
  if (entry.Status !== "Success" || !entry.PostOffice?.length) return null;

  const po = entry.PostOffice[0];
  return {
    city: (po.District || po.Name || "").toUpperCase(),
    state: (po.State || "").toUpperCase(),
  };
}

function classNames(...a) {
  return a.filter(Boolean).join(" ");
}

/** Minimal typeable select: input + dropdown list */
function TypeaheadSelect({
  label,
  required,
  value,
  onChange,
  items,
  placeholder,
  disabled,
  hint,
  invalid,
  leftIcon,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const wrapRef = useRef(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered = useMemo(() => {
    const q = (query || "").toLowerCase().trim();
    if (!q) return items.slice(0, 40);
    return items.filter((x) => x.toLowerCase().includes(q)).slice(0, 40);
  }, [items, query]);

  return (
    <div ref={wrapRef}>
      <LabelRow label={label} required={required} />
      <div
        className={classNames(
          "mt-2 relative rounded-md border bg-white shadow-sm",
          invalid
            ? "border-red-300 focus-within:ring-2 focus-within:ring-red-200"
            : "border-[#dbeafe] focus-within:ring-2 focus-within:ring-[#f2b632]/40"
        )}
      >
        <div className="flex items-center">
          <div
            className={classNames(
              "grid h-11 w-11 place-items-center border-r bg-white",
              invalid ? "border-red-200" : "border-[#dbeafe]"
            )}
          >
            {leftIcon ?? <Search className="h-4 w-4 text-gray-500" />}
          </div>

          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              onChange?.(""); // clear selected value until pick
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            className={classNames(
              "h-11 w-full px-4 text-sm font-semibold outline-none placeholder:text-[#9ca3af]",
              disabled ? "bg-gray-50 cursor-not-allowed" : "bg-white"
            )}
          />

          <button
            type="button"
            disabled={disabled}
            onClick={() => setOpen((s) => !s)}
            className="h-11 px-3 text-gray-500 disabled:opacity-50"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        {open && !disabled ? (
          <div className="absolute z-20 left-0 right-0 mt-1 max-h-56 overflow-auto rounded-md border border-[#e5e7eb] bg-white shadow-lg">
            {filtered.length ? (
              filtered.map((x) => (
                <button
                  key={x}
                  type="button"
                  onClick={() => {
                    onChange?.(x);
                    setQuery(x);
                    setOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                >
                  {x}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500">No matches</div>
            )}
          </div>
        ) : null}
      </div>

      <HintRow hint={hint} invalid={invalid} />
    </div>
  );
}

function LabelRow({ label, required }) {
  return (
    <label className="block text-sm font-bold text-[#111827] tracking-wide uppercase">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
  );
}

function HintRow({ hint, invalid }) {
  if (hint) {
    return (
      <p
        className={classNames(
          "mt-2 text-[11px] font-bold",
          invalid ? "text-red-600" : "text-gray-500"
        )}
      >
        {hint}
      </p>
    );
  }
  return <div className="mt-2 h-[14px]" />;
}

function Field({ label, required, invalid, hint, leftIcon, children }) {
  return (
    <div>
      <LabelRow label={label} required={required} />
      <div
        className={classNames(
          "mt-2 flex items-center overflow-hidden rounded-md bg-white shadow-sm",
          invalid
            ? "border border-red-300 focus-within:ring-2 focus-within:ring-red-200"
            : "border border-[#dbeafe] focus-within:ring-2 focus-within:ring-[#f2b632]/40"
        )}
      >
        <div
          className={classNames(
            "grid h-11 w-11 place-items-center border-r bg-white",
            invalid ? "border-red-200" : "border-[#dbeafe]"
          )}
        >
          {leftIcon ?? <MapPin className="h-4 w-4 text-gray-500" />}
        </div>
        {children}
      </div>
      <HintRow hint={hint} invalid={invalid} />
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        "flex-1 inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition",
        active
          ? "bg-white text-black shadow-sm border border-transparent"
          : "text-[#6b7280] hover:bg-white/70"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function SummaryRoutePanel({ origin, destination }) {
  return (
    <div className="w-full max-w-3xl mx-auto rounded-lg bg-white shadow-xl border border-[#e9eef7] overflow-hidden mb-6">
      <div className="px-8 py-6">
        <div className="flex items-center justify-between gap-6">
          {/* ORIGIN */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-extrabold text-[#111827] tracking-wide">
              ORIGIN
            </p>

            <div className="flex items-center gap-4">
              {/* Flag placeholder */}
              <div className="h-14 w-14 rounded-lg border border-[#e5e7eb] bg-[#f9fbff] grid place-items-center text-xs font-extrabold text-[#111827]">
                {origin.code}
              </div>

              {/* Country */}
              <div className="min-w-[170px] rounded-lg border border-[#e5e7eb] px-4 py-3">
                <div className="text-lg font-black text-[#111827] leading-tight">
                  {origin.country}
                </div>
                <div className="text-sm font-bold text-gray-500 mt-1">
                  ({origin.pincode})
                </div>
              </div>
            </div>
          </div>

          {/* Plane dotted route */}
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-3 w-full max-w-xs">
              <div className="flex-1 border-t border-dashed border-gray-300" />
              <span className="text-xl font-black text-[#111827]">✈</span>
              <div className="flex-1 border-t border-dashed border-gray-300" />
            </div>
          </div>

          {/* DESTINATION */}
          <div className="flex flex-col gap-2 items-end">
            <p className="text-sm font-extrabold text-[#111827] tracking-wide">
              DESTINATION
            </p>

            <div className="flex items-center gap-4">
              {/* Flag placeholder */}
              <div className="h-14 w-14 rounded-xl border border-[#e5e7eb] bg-[#f9fbff] grid place-items-center text-xs font-extrabold text-[#111827]">
                {destination.code}
              </div>

              {/* Country */}
              <div className="min-w-[170px] rounded-xl border border-[#e5e7eb] px-4 py-3 text-right">
                <div className="text-lg font-black text-[#111827] leading-tight">
                  {destination.country}
                </div>
                <div className="text-sm font-bold text-gray-500 mt-1">
                  ({destination.pincode})
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SpotPricing() {
  const [tab, setTab] = useState("export");

  // Countries
  const [countries, setCountries] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setCountriesLoading(true);
        const res = await fetch(
          "https://restcountries.com/v3.1/all?fields=name"
        );
        const data = await res.json();
        if (cancelled) return;

        const list = (Array.isArray(data) ? data : [])
          .map((c) => c?.name?.common)
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));

        setCountries(list);
      } catch {
        if (!cancelled) setCountries([]);
      } finally {
        if (!cancelled) setCountriesLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Export form
  const [expOriginPincode, setExpOriginPincode] = useState("");
  const [expOriginCity, setExpOriginCity] = useState("");
  const [expDestCountry, setExpDestCountry] = useState("");
  const [expDestPincode, setExpDestPincode] = useState("");
  const [expDestCity, setExpDestCity] = useState("");

  const [expOriginLoading, setExpOriginLoading] = useState(false);
  const [expOriginError, setExpOriginError] = useState("");

  // Import form
  const [impOriginCountry, setImpOriginCountry] = useState("");
  const [impOriginPincode, setImpOriginPincode] = useState("");
  const [impOriginCity, setImpOriginCity] = useState("");

  const [impDestPincode, setImpDestPincode] = useState("");
  const [impDestCity, setImpDestCity] = useState("");

  const [impDestLoading, setImpDestLoading] = useState(false);
  const [impDestError, setImpDestError] = useState("");

  // Errors
  const [formError, setFormError] = useState("");
  const [missing, setMissing] = useState({});

  const expShowDestFields = !!expDestCountry;
  const impOriginShowPincode = !!impOriginCountry;

  // ✅ after successful check show summary panel + shipment details card
  const [checked, setChecked] = useState(false);

  const validateExportOriginPincodeBlur = async () => {
    if (!expOriginPincode) return;
    if (expOriginPincode.length !== 6) {
      setExpOriginError("Invalid Pincode");
      return;
    }
    try {
      setExpOriginLoading(true);
      setExpOriginError("");
      const d = await fetchIndiaPincodeCity(expOriginPincode);
      if (!d) {
        setExpOriginError("Invalid Pincode");
        return;
      }
      // city auto-fill but editable
      setExpOriginCity(d.city || "");
    } catch {
      setExpOriginError("Invalid Pincode");
    } finally {
      setExpOriginLoading(false);
    }
  };

  const validateImportDestPincodeBlur = async () => {
    if (!impDestPincode) return;
    if (impDestPincode.length !== 6) {
      setImpDestError("Invalid Pincode");
      return;
    }
    try {
      setImpDestLoading(true);
      setImpDestError("");
      const d = await fetchIndiaPincodeCity(impDestPincode);
      if (!d) {
        setImpDestError("Invalid Pincode");
        return;
      }
      // auto-fill but editable
      setImpDestCity(d.city || "");
    } catch {
      setImpDestError("Invalid Pincode");
    } finally {
      setImpDestLoading(false);
    }
  };

  const resetAll = () => {
    setChecked(false);
    setFormError("");
    setMissing({});

    // export
    setExpOriginPincode("");
    setExpOriginCity("");
    setExpDestCountry("");
    setExpDestPincode("");
    setExpDestCity("");
    setExpOriginLoading(false);
    setExpOriginError("");

    // import
    setImpOriginCountry("");
    setImpOriginPincode("");
    setImpOriginCity("");
    setImpDestPincode("");
    setImpDestCity("");
    setImpDestLoading(false);
    setImpDestError("");
  };

  const validateAndCheck = () => {
    const m = {};
    setFormError("");

    if (tab === "export") {
      // Origin country fixed
      if (!expOriginPincode) m.expOriginPincode = true;
      if (!expOriginCity) m.expOriginCity = true;
      if (!expDestCountry) m.expDestCountry = true;

      if (expShowDestFields) {
        if (!expDestPincode) m.expDestPincode = true;
        if (!expDestCity) m.expDestCity = true;
      }
      if (expOriginError) m.expOriginPincode = true;

      if (Object.keys(m).length) {
        setMissing(m);
        setFormError("All fields are required");
        return false;
      }
      return true;
    }

    // import
    if (!impOriginCountry) m.impOriginCountry = true;
    if (impOriginShowPincode) {
      if (!impOriginPincode) m.impOriginPincode = true;
      if (!impOriginCity) m.impOriginCity = true;
    }
    // destination fixed INDIA
    if (!impDestPincode) m.impDestPincode = true;
    if (!impDestCity) m.impDestCity = true;
    if (impDestError) m.impDestPincode = true;

    if (Object.keys(m).length) {
      setMissing(m);
      setFormError("All fields are required");
      return false;
    }
    return true;
  };

  const handleCheck = () => {
    const ok = validateAndCheck();
    if (!ok) {
      setChecked(false);
      return;
    }

    setFormError("");
    setChecked(true); // ✅ show summary panel + shipment details
  };

  return (
    <div className="min-h-screen ">
      {checked ? (
        <SummaryRoutePanel
          origin={{
            country: tab === "export" ? "INDIA" : impOriginCountry || "—",
            pincode:
              tab === "export"
                ? expOriginPincode || "—"
                : impOriginPincode || "—",
            code: tab === "export" ? "IN" : "OR",
          }}
          destination={{
            country: tab === "export" ? expDestCountry || "—" : "INDIA",
            pincode:
              tab === "export" ? expDestPincode || "—" : impDestPincode || "—",
            code: tab === "export" ? "DS" : "IN",
          }}
        />
      ) : null}
      {checked ? (
        <div className="w-full rounded-2xl bg-white shadow-xl border border-[#e9eef7] overflow-hidden mb-6">
          <div className="px-8 py-6 border-b border-[#edf2f7]">
            <h2 className="text-2xl font-extrabold text-[#111827]">
              Shipment Details
            </h2>
          </div>

          {/* ✅ inside form grid like screenshot */}
          <div className="px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Field label="SHIPMENT TYPE" required invalid={false}>
              <select className="h-11 w-full px-4 text-sm font-semibold outline-none bg-transparent">
                <option value="">Select Shipment Type</option>
                <option>Document</option>
                <option>Non-Document</option>
              </select>
            </Field>

            <Field label="WEIGHT" required invalid={false}>
              <div className="flex w-full">
                <input
                  className="h-11 w-full px-4 text-sm font-semibold outline-none"
                  placeholder="Enter weight"
                />
                <div className="w-28 border-l border-[#dbeafe]">
                  <select className="h-11 w-full px-3 text-sm font-bold outline-none bg-transparent">
                    <option>kgs</option>
                    <option>lbs</option>
                  </select>
                </div>
              </div>
            </Field>

            <Field label="QUOTED BY" required invalid={false}>
              <input
                className="h-11 w-full px-4 text-sm font-semibold outline-none"
                placeholder="Enter name"
              />
            </Field>

            <Field label="COMMODITY TYPE" required invalid={false}>
              <select className="h-11 w-full px-4 text-sm font-semibold outline-none bg-transparent">
                <option value="">Select Commodity Type</option>
                <option>General</option>
                <option>Electronics</option>
              </select>
            </Field>

            <Field label="SHIPMENT CURRENCY" required={false} invalid={false}>
              <select className="h-11 w-full px-4 text-sm font-semibold outline-none bg-transparent">
                <option>INR</option>
                <option>USD</option>
                <option>EUR</option>
              </select>
            </Field>

            <div className="flex items-end">
              <button className="h-12 px-6 rounded-xl bg-[#f2b632] text-white font-extrabold shadow-md hover:brightness-95 transition active:scale-[0.99]">
                Add Dimension
              </button>
            </div>
          </div>

          {/* ✅ Get Quote button right aligned */}
          <div className="px-8 pb-10 flex justify-end">
            <button className="h-12 w-44 rounded-full bg-[#f2b632] text-white font-extrabold shadow-lg hover:brightness-95 transition active:scale-[0.99]">
              GET QUOTE
            </button>
          </div>
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-3xl px-4">
        <div className="rounded-2xl bg-white shadow-xl border border-[#e9eef7] overflow-hidden">
          {/* Title */}
          <div className="px-8 pt-10 pb-6 text-center">
            <h1 className="text-3xl font-extrabold tracking-wide text-[#111827]">
              SERVICEABILITY
            </h1>
            <div className="mt-5 h-px bg-[#edf2f7]" />
          </div>

          {/* Tabs */}
          <div className="px-10">
            <div className="grid grid-cols-2 items-center gap-10">
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setTab("export");
                    setFormError("");
                    setMissing({});
                  }}
                  className="inline-flex items-center gap-3 font-extrabold tracking-wide text-sm"
                >
                  <span
                    className={
                      tab === "export" ? "text-[#f2b632]" : "text-gray-700"
                    }
                  >
                    EXPORT
                  </span>
                  <Plane
                    className={classNames(
                      "h-5 w-5",
                      tab === "export" ? "text-[#f2b632]" : "text-gray-700"
                    )}
                  />
                </button>
                <div
                  className={classNames(
                    "mt-4 h-1 w-full rounded-full",
                    tab === "export" ? "bg-[#f2b632]" : "bg-transparent"
                  )}
                />
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setTab("import");
                    setFormError("");
                    setMissing({});
                  }}
                  className="inline-flex items-center gap-3 font-extrabold tracking-wide text-sm"
                >
                  <span
                    className={
                      tab === "import" ? "text-[#111827]" : "text-gray-700"
                    }
                  >
                    IMPORT
                  </span>
                  <PlaneLanding
                    className={classNames(
                      "h-5 w-5",
                      tab === "import" ? "text-[#111827]" : "text-gray-700"
                    )}
                  />
                </button>
                <div
                  className={classNames(
                    "mt-4 h-1 w-full rounded-full",
                    tab === "import" ? "bg-[#111827]" : "bg-transparent"
                  )}
                />
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="px-10 pb-10 pt-8">
            {tab === "export" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                {/* Origin Country fixed */}
                <Field
                  label="ORIGIN COUNTRY"
                  required
                  invalid={false}
                  leftIcon={<Map className="h-4 w-4 text-[#6b7280]" />}
                >
                  <div className="relative w-full">
                    <input
                      value="INDIA"
                      disabled
                      className="h-11 w-full px-4 text-sm font-extrabold text-[#111827] bg-gray-50 outline-none cursor-not-allowed"
                    />
                    <div className="pointer-events-none absolute right-0 top-0 h-full flex items-center">
                      <div className="mr-3 grid h-8 w-8 place-items-center rounded-lg">
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </Field>

                {/* Origin Pincode */}
                <Field
                  label="ORIGIN PINCODE"
                  required
                  invalid={!!(missing.expOriginPincode || expOriginError)}
                  hint={
                    expOriginLoading
                      ? "Validating..."
                      : expOriginError
                      ? expOriginError
                      : ""
                  }
                  leftIcon={<MapPin className="h-4 w-4 text-[#6b7280]" />}
                >
                  <input
                    value={expOriginPincode}
                    onChange={(e) => {
                      setExpOriginPincode(
                        e.target.value.replace(/\D/g, "").slice(0, 6)
                      );
                      setExpOriginError("");
                      setMissing((p) => ({ ...p, expOriginPincode: false }));
                    }}
                    onBlur={validateExportOriginPincodeBlur}
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Search Origin Pincode"
                    className="h-11 w-full px-4 text-sm font-semibold outline-none placeholder:text-[#9ca3af]"
                  />
                </Field>

                {/* Origin City (editable) */}
                <Field
                  label="ORIGIN CITY"
                  required
                  invalid={!!missing.expOriginCity}
                  hint={expOriginCity ? "You can edit this city" : ""}
                  leftIcon={<Map className="h-4 w-4 text-[#6b7280]" />}
                >
                  <input
                    value={expOriginCity}
                    onChange={(e) => {
                      setExpOriginCity(e.target.value);
                      setMissing((p) => ({ ...p, expOriginCity: false }));
                    }}
                    placeholder="Origin City"
                    className="h-11 w-full px-4 text-sm font-semibold outline-none placeholder:text-[#9ca3af]"
                  />
                </Field>

                {/* Destination Country (type & select) */}
                <TypeaheadSelect
                  label="DESTINATION COUNTRY"
                  required
                  value={expDestCountry}
                  onChange={(v) => {
                    setExpDestCountry(v);
                    setMissing((p) => ({ ...p, expDestCountry: false }));
                    setExpDestPincode("");
                    setExpDestCity("");
                    setMissing((p) => ({
                      ...p,
                      expDestPincode: false,
                      expDestCity: false,
                    }));
                  }}
                  items={countries}
                  placeholder={
                    countriesLoading
                      ? "Loading countries..."
                      : "Search Destination Country"
                  }
                  invalid={!!missing.expDestCountry}
                  hint={countriesLoading ? "Loading countries..." : ""}
                  leftIcon={<Search className="h-4 w-4 text-[#6b7280]" />}
                />

                {/* Show after selecting destination country */}
                {expShowDestFields ? (
                  <>
                    <Field
                      label="DESTINATION PINCODE"
                      required
                      invalid={!!missing.expDestPincode}
                      leftIcon={<MapPin className="h-4 w-4 text-[#6b7280]" />}
                    >
                      <input
                        value={expDestPincode}
                        onChange={(e) => {
                          setExpDestPincode(e.target.value);
                          setMissing((p) => ({ ...p, expDestPincode: false }));
                        }}
                        placeholder="Destination Pincode"
                        className="h-11 w-full px-4 text-sm font-semibold outline-none placeholder:text-[#9ca3af]"
                      />
                    </Field>

                    <Field
                      label="DESTINATION CITY"
                      required
                      invalid={!!missing.expDestCity}
                      leftIcon={<Map className="h-4 w-4 text-[#6b7280]" />}
                    >
                      <input
                        value={expDestCity}
                        onChange={(e) => {
                          setExpDestCity(e.target.value);
                          setMissing((p) => ({ ...p, expDestCity: false }));
                        }}
                        placeholder="Destination City"
                        className="h-11 w-full px-4 text-sm font-semibold outline-none placeholder:text-[#9ca3af]"
                      />
                    </Field>
                  </>
                ) : null}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                {/* Origin Country (select) */}
                <TypeaheadSelect
                  label="ORIGIN COUNTRY"
                  required
                  value={impOriginCountry}
                  onChange={(v) => {
                    setImpOriginCountry(v);
                    setMissing((p) => ({ ...p, impOriginCountry: false }));
                  }}
                  items={countries}
                  placeholder={
                    countriesLoading
                      ? "Loading countries..."
                      : "Search Origin Country"
                  }
                  invalid={!!missing.impOriginCountry}
                  hint={countriesLoading ? "Loading countries..." : ""}
                />

                {/* Origin Pincode (shown after selecting origin country) */}
                {impOriginShowPincode && (
                  <Field
                    label="ORIGIN PINCODE"
                    required
                    invalid={!!missing.impOriginPincode}
                    leftIcon={<MapPin className="h-4 w-4 text-[#6b7280]" />}
                  >
                    <input
                      value={impOriginPincode}
                      onChange={(e) => {
                        setImpOriginPincode(e.target.value);
                        setMissing((p) => ({ ...p, impOriginPincode: false }));
                      }}
                      placeholder="Search Origin Pincode"
                      className="h-11 w-full px-4 text-sm font-semibold outline-none placeholder:text-[#9ca3af]"
                    />
                  </Field>
                )}

                {/* Origin City (editable) */}
                {impOriginShowPincode && (
                  <Field
                    label="ORIGIN CITY"
                    required
                    invalid={!!missing.impOriginCity}
                    leftIcon={<Map className="h-4 w-4 text-[#6b7280]" />}
                  >
                    <input
                      value={impOriginCity}
                      onChange={(e) => {
                        setImpOriginCity(e.target.value);
                        setMissing((p) => ({ ...p, impOriginCity: false }));
                      }}
                      placeholder="Origin City"
                      className="h-11 w-full px-4 text-sm font-semibold outline-none placeholder:text-[#9ca3af]"
                    />
                  </Field>
                )}

                {/* Destination Country fixed INDIA */}
                <Field
                  label="DESTINATION COUNTRY"
                  required
                  invalid={false}
                  leftIcon={<Map className="h-4 w-4 text-[#6b7280]" />}
                >
                  <div className="relative w-full">
                    <input
                      value="INDIA"
                      disabled
                      className="h-11 w-full px-4 text-sm font-extrabold text-[#111827] bg-gray-50 outline-none cursor-not-allowed"
                    />
                    <div className="pointer-events-none absolute right-0 top-0 h-full flex items-center">
                      <div className="mr-3 grid h-8 w-8 place-items-center rounded-lg">
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </Field>

                {/* Destination Pincode (India => validate and auto-fill city) */}
                <Field
                  label="DESTINATION PINCODE"
                  required
                  invalid={!!(missing.impDestPincode || impDestError)}
                  hint={
                    impDestLoading
                      ? "Validating..."
                      : impDestError
                      ? impDestError
                      : ""
                  }
                  leftIcon={<MapPin className="h-4 w-4 text-[#6b7280]" />}
                >
                  <input
                    value={impDestPincode}
                    onChange={(e) => {
                      setImpDestPincode(
                        e.target.value.replace(/\D/g, "").slice(0, 6)
                      );
                      setImpDestError("");
                      setMissing((p) => ({ ...p, impDestPincode: false }));
                    }}
                    onBlur={validateImportDestPincodeBlur}
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Search Destination Pincode"
                    className="h-11 w-full px-4 text-sm font-semibold outline-none placeholder:text-[#9ca3af]"
                  />
                </Field>

                {/* Destination City editable */}
                <Field
                  label="DESTINATION CITY"
                  required
                  invalid={!!missing.impDestCity}
                  leftIcon={<Map className="h-4 w-4 text-[#6b7280]" />}
                >
                  <input
                    value={impDestCity}
                    onChange={(e) => {
                      setImpDestCity(e.target.value);
                      setMissing((p) => ({ ...p, impDestCity: false }));
                    }}
                    placeholder="Destination City"
                    className="h-11 w-full px-4 text-sm font-semibold outline-none placeholder:text-[#9ca3af]"
                  />
                </Field>
              </div>
            )}

            {/* Buttons */}
            <div className="mt-10 flex items-center justify-end gap-6">
              <button
                type="button"
                onClick={resetAll}
                className="h-12 w-40 rounded-full bg-[#f2b632] text-white font-extrabold shadow-md hover:brightness-95 transition active:scale-[0.99]"
              >
                RESET
              </button>

              <button
                type="button"
                onClick={handleCheck}
                className="h-12 w-40 rounded-full bg-[#f2b632] text-white font-extrabold shadow-md hover:brightness-95 transition active:scale-[0.99]"
              >
                CHECK
              </button>
            </div>

            {formError ? (
              <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-extrabold text-red-700 tracking-wider">
                {formError}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
