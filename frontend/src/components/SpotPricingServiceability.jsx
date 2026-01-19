import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Plane,
  PlaneLanding,
  ChevronDown,
  Search,
  MapPin,
  Map,
} from "lucide-react";

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
          invalid ? "text-red-600" : "text-gray-500",
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
            : "border border-[#dbeafe] focus-within:ring-2 focus-within:ring-[#f2b632]/40",
        )}
      >
        <div
          className={classNames(
            "grid h-11 w-11 place-items-center border-r bg-white",
            invalid ? "border-red-200" : "border-[#dbeafe]",
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

  useEffect(() => setQuery(value || ""), [value]);

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
            : "border-[#dbeafe] focus-within:ring-2 focus-within:ring-[#f2b632]/40",
        )}
      >
        <div className="flex items-center">
          <div
            className={classNames(
              "grid h-11 w-11 place-items-center border-r bg-white",
              invalid ? "border-red-200" : "border-[#dbeafe]",
            )}
          >
            {leftIcon ?? <Search className="h-4 w-4 text-gray-500" />}
          </div>

          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              onChange?.("");
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            className={classNames(
              "h-11 w-full px-4 text-sm font-semibold outline-none placeholder:text-[#9ca3af]",
              disabled ? "bg-gray-50 cursor-not-allowed" : "bg-white",
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

export default function SpotPricingServiceability({ onChecked, onResetAll }) {
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
          "https://restcountries.com/v3.1/all?fields=name",
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

  // Export
  const [expOriginPincode, setExpOriginPincode] = useState("");
  const [expOriginCity, setExpOriginCity] = useState("");
  const [expDestCountry, setExpDestCountry] = useState("");
  const [expDestPincode, setExpDestPincode] = useState("");
  const [expDestCity, setExpDestCity] = useState("");
  const [expOriginLoading, setExpOriginLoading] = useState(false);
  const [expOriginError, setExpOriginError] = useState("");

  // Import
  const [impOriginCountry, setImpOriginCountry] = useState("");
  const [impOriginPincode, setImpOriginPincode] = useState("");
  const [impOriginCity, setImpOriginCity] = useState("");
  const [impDestPincode, setImpDestPincode] = useState("");
  const [impDestCity, setImpDestCity] = useState("");
  const [impDestLoading, setImpDestLoading] = useState(false);
  const [impDestError, setImpDestError] = useState("");

  // UI errors
  const [formError, setFormError] = useState("");
  const [missing, setMissing] = useState({});

  const expShowDestFields = !!expDestCountry;
  const impOriginShowPincode = !!impOriginCountry;

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
      setImpDestCity(d.city || "");
    } catch {
      setImpDestError("Invalid Pincode");
    } finally {
      setImpDestLoading(false);
    }
  };

  const resetAll = () => {
    setFormError("");
    setMissing({});

    setExpOriginPincode("");
    setExpOriginCity("");
    setExpDestCountry("");
    setExpDestPincode("");
    setExpDestCity("");
    setExpOriginLoading(false);
    setExpOriginError("");

    setImpOriginCountry("");
    setImpOriginPincode("");
    setImpOriginCity("");
    setImpDestPincode("");
    setImpDestCity("");
    setImpDestLoading(false);
    setImpDestError("");

    onResetAll?.();
  };

  const validateAndCheck = () => {
    const m = {};
    setFormError("");

    if (tab === "export") {
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
    if (!ok) return;

    // ✅ send ALL input values
    onChecked?.({
      tab,

      origin: {
        country: tab === "export" ? "INDIA" : impOriginCountry,
        pincode: tab === "export" ? expOriginPincode : impOriginPincode,
        city: tab === "export" ? expOriginCity : impOriginCity,
        code: tab === "export" ? "IN" : "OR",
      },

      destination: {
        country: tab === "export" ? expDestCountry : "INDIA",
        pincode: tab === "export" ? expDestPincode : impDestPincode,
        city: tab === "export" ? expDestCity : impDestCity,
        code: tab === "export" ? "DS" : "IN",
      },
    });

    setFormError("");
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-12">
      <div className="rounded-2xl bg-white shadow-xl border border-[#e9eef7] overflow-hidden">
        <div className="px-8 pt-10 pb-6 text-center">
          <h1 className="text-3xl font-extrabold tracking-wide text-[#111827]">
            SERVICEABILITY
          </h1>
          <div className="mt-5 h-px bg-[#edf2f7]" />
        </div>

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
                    tab === "export" ? "text-[#f2b632]" : "text-gray-700",
                  )}
                />
              </button>
              <div
                className={classNames(
                  "mt-4 h-1 w-full rounded-full",
                  tab === "export" ? "bg-[#f2b632]" : "bg-transparent",
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
                    tab === "import" ? "text-[#111827]" : "text-gray-700",
                  )}
                />
              </button>
              <div
                className={classNames(
                  "mt-4 h-1 w-full rounded-full",
                  tab === "import" ? "bg-[#111827]" : "bg-transparent",
                )}
              />
            </div>
          </div>
        </div>

        {/* Form */}
        {/* Form */}
        <div className="px-10 pb-10 pt-8">
          {tab === "export" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2">
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
              >
                <input
                  value={expOriginPincode}
                  onChange={(e) => {
                    setExpOriginPincode(
                      e.target.value.replace(/\D/g, "").slice(0, 6),
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

              {expShowDestFields ? (
                <>
                  <Field
                    label="DESTINATION PINCODE"
                    required
                    invalid={!!missing.expDestPincode}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2">
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

              {impOriginShowPincode && (
                <Field
                  label="ORIGIN PINCODE"
                  required
                  invalid={!!missing.impOriginPincode}
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
              >
                <input
                  value={impDestPincode}
                  onChange={(e) => {
                    setImpDestPincode(
                      e.target.value.replace(/\D/g, "").slice(0, 6),
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

          <div className="mt-4 flex items-center justify-between gap-10">
            <button
              type="button"
              onClick={resetAll}
              className="h-12 w-full rounded-md bg-[#f2b632] text-white font-extrabold shadow-md hover:brightness-95 transition active:scale-[0.99]"
            >
              RESET
            </button>

            <button
              type="button"
              onClick={handleCheck}
              className="h-12 w-full rounded-md bg-[#f2b632] text-white font-extrabold shadow-md hover:brightness-95 transition active:scale-[0.99]"
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
  );
}
