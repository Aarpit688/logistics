import React, { useState } from "react";
import { ArrowLeft, Upload } from "lucide-react";

const initialForm = {
  companyName: "",
  contactPerson: "",
  mobile: "",
  address1: "",
  address2: "",
  pincode: "",
  city: "",
  state: "",
  email: "",
  gstin: "",
  iec: "",
  pan: "",
  taxPayment: "",
};

const requiredFields = [
  "companyName",
  "contactPerson",
  "mobile",
  "address1",
  "address2",
  "pincode",
  "gstin",
  "iec",
  "pan",
];

const MSMERegistration = ({ onBack }) => {
  const [form, setForm] = useState(initialForm);
  const [loadingPin, setLoadingPin] = useState(false);
  const [files, setFiles] = useState({
    gstinFile: null,
    iecFile: null,
    panFile: null,
    authFile: null,
  });

  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  /* ---------------- PINCODE LOOKUP ---------------- */
  const handlePincodeBlur = async () => {
    if (form.pincode.length !== 6) return;

    try {
      setLoadingPin(true);
      const res = await fetch(
        `https://api.postalpincode.in/pincode/${form.pincode}`
      );
      const data = await res.json();

      if (data[0]?.Status === "Success") {
        setForm((prev) => ({
          ...prev,
          city: data[0].PostOffice[0].District,
          state: data[0].PostOffice[0].State,
        }));
      } else {
        alert("Invalid Pincode");
        setForm((prev) => ({ ...prev, city: "", state: "" }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPin(false);
    }
  };

  /* ---------------- RESET ---------------- */
  const handleReset = () => {
    setForm(initialForm);
    setFiles({
      gstinFile: null,
      iecFile: null,
      panFile: null,
      authFile: null,
    });
  };

  const handleSubmit = async () => {
    setSubmitAttempted(true);
    if (!isFormValid) return;

    const token = localStorage.getItem("token");

    const formData = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value);
    });

    formData.append("gst", files.gstinFile);
    formData.append("iec", files.iecFile);
    formData.append("pan", files.panFile);
    formData.append("stamp", files.authFile);

    try {
      const res = await fetch(
        "https://logistics-bnqu.onrender.com/api/auth/msme",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!res.ok) throw new Error("Failed");

      alert("MSME registered successfully");
      onBack();
    } catch (err) {
      alert("Registration failed");
    }
  };

  const isFormValid = requiredFields.every((field) => form[field]?.trim());

  const showError = (field) => submitAttempted && !form[field]?.trim();

  return (
    <div className="w-full bg-gray-50 min-h-screen px-6 py-6">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-semibold">MSME Registration</h1>
        </div>

        <hr className="mb-6" />

        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              label="Company Name"
              placeholder="Enter Company Name"
              required
              value={form.companyName}
              onChange={(e) =>
                setForm({ ...form, companyName: e.target.value })
              }
            />

            <Input
              label="Contact Person"
              placeholder="Enter Contact Person"
              required
              value={form.contactPerson}
              onChange={(e) =>
                setForm({ ...form, contactPerson: e.target.value })
              }
            />

            {/* Mobile */}
            <div>
              <Label text="Mobile Number" required />
              <div className="flex">
                <div className="flex items-center gap-2 px-3 border border-r-0 rounded-l-md bg-gray-100">
                  <img
                    src="https://flagcdn.com/w20/in.png"
                    className="w-5 h-3"
                  />
                  <span className="text-sm font-medium pr-2">+91</span>
                </div>
                <input
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  placeholder="Enter Mobile Number"
                  className="w-full border rounded-r-md px-4 py-2"
                />
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              label="Address 1"
              placeholder="Enter Address 1"
              required
              value={form.address1}
              onChange={(e) => setForm({ ...form, address1: e.target.value })}
            />

            <Input
              label="Address 2"
              placeholder="Enter Address 2"
              required
              value={form.address2}
              onChange={(e) => setForm({ ...form, address2: e.target.value })}
            />

            <div>
              <Label text="Pincode" required />
              <input
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                onBlur={handlePincodeBlur}
                placeholder="Enter Pincode"
                className="w-full border rounded-md px-4 py-2"
              />
              {loadingPin && <p className="text-xs mt-1">Fetching…</p>}
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input label="City" value={form.city} disabled />
            <Input label="State" value={form.state} disabled />
            <Input
              label="Email"
              placeholder="Enter Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          {/* Row 4 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              label="GSTIN Number"
              placeholder="Enter GSTIN Number"
              required
              value={form.gstin}
              error={showError("gstin")}
              onChange={(e) =>
                setForm({ ...form, gstin: e.target.value.toUpperCase() })
              }
            />

            <Input
              label="IEC Code"
              placeholder="Enter IEC Code"
              required
              value={form.iec}
              onChange={(e) => setForm({ ...form, iec: e.target.value })}
            />

            <Input
              label="PAN Number"
              placeholder="Enter PAN Number"
              required
              value={form.pan}
              error={showError("pan")}
              onChange={(e) =>
                setForm({ ...form, pan: e.target.value.toUpperCase() })
              }
            />
          </div>

          {/* Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <FileUpload
              label="GSTIN (Signed & Stamped)"
              required
              file={files.gstinFile}
              onChange={(f) => setFiles({ ...files, gstinFile: f })}
            />

            <FileUpload
              label="IEC (Signed & Stamped)"
              required
              file={files.iecFile}
              onChange={(f) => setFiles({ ...files, iecFile: f })}
            />

            <FileUpload
              label="Company's PAN"
              required
              file={files.panFile}
              onChange={(f) => setFiles({ ...files, panFile: f })}
            />

            <FileUpload
              label="Authorisation Letter"
              required
              file={files.authFile}
              onChange={(f) => setFiles({ ...files, authFile: f })}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2 bg-yellow-100 text-yellow-700 rounded-md"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={!isFormValid}
              onClick={() => setSubmitAttempted(true)}
              className={`px-6 py-2 rounded-md font-medium
    ${
      isFormValid
        ? "bg-yellow-500 text-white hover:bg-yellow-600"
        : "bg-gray-300 text-gray-500 cursor-not-allowed"
    }
  `}
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ---------- Reusable ---------- */

const Label = ({ text, required }) => (
  <label className="block text-sm font-medium mb-1">
    {text} {required && <span className="text-red-500">*</span>}
  </label>
);

const Input = ({
  label,
  required,
  value,
  onChange,
  disabled,
  placeholder,
  error,
}) => (
  <div>
    <Label text={label} required={required} />

    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full rounded-md px-4 py-2 border
        placeholder:font-semibold placeholder:text-gray-400
        focus:outline-none focus:ring-2
        ${
          error
            ? "border-red-500 focus:ring-red-400"
            : "border-gray-300 focus:ring-yellow-400"
        }
        ${disabled ? "bg-gray-100" : ""}
      `}
    />

    {error && (
      <p className="text-[11px] text-red-500 mt-1">This field is required</p>
    )}
  </div>
);

const FileUpload = ({ label, file, onChange, required }) => (
  <div>
    <Label text={label} required={required} />
    <label className="flex items-center gap-3 border px-4 py-2 rounded-md cursor-pointer">
      <Upload size={16} />
      <span className="text-sm">{file?.name || "Choose File"}</span>
      <input
        type="file"
        className="hidden"
        onChange={(e) => onChange(e.target.files[0])}
      />
    </label>
  </div>
);

export default MSMERegistration;
