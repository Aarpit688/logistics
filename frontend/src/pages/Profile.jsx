import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Phone,
  Mail,
  Building2,
  MapPin,
  Pencil,
  Save,
  X,
  Lock,
} from "lucide-react";
import ProfileField from "../components/ProfileField";
import ChangePasswordModal from "../components/ChangePasswordModal";

const Profile = () => {
  const { user, refetchUser } = useOutletContext();
  const token = localStorage.getItem("token");

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: user.name || "",
    mobile: user.mobile || "",
    companyName: user.companyName || "",
    mailingAddress: user.mailingAddress || "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("http://localhost:5000/api/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      await refetchUser();
      setEditMode(false);
    } catch (err) {
      console.error("Failed to update profile", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setForm({
      name: user.name,
      mobile: user.mobile,
      companyName: user.companyName,
      mailingAddress: user.mailingAddress,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-white rounded-md shadow-sm max-w-5xl border"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold">My Profile</h2>
        </div>

        {!editMode ? (
          <button
            onClick={() => setEditMode(true)}
            className="flex items-center gap-2 text-md px-4 py-2 rounded-md
                       bg-gray-900 text-white hover:bg-gray-800 transition"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 text-md px-4 py-2 rounded-md border
                         hover:bg-gray-50 transition"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 text-md px-4 py-2 rounded-md
                         bg-green-600 text-white hover:bg-green-700
                         disabled:opacity-50 transition"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 grid gap-5 text-md">
        <ProfileField
          label="Account Code"
          value={user.accountCode || "Not Assigned"}
          disabled
        />
        <ProfileField
          label="Full Name"
          icon={User}
          value={form.name}
          editMode={editMode}
          name="name"
          onChange={handleChange}
        />

        <ProfileField label="Email" icon={Mail} value={user.email} disabled />

        <ProfileField
          label="Mobile Number"
          icon={Phone}
          value={form.mobile}
          disabled
        />

        <ProfileField
          label="Company Name"
          icon={Building2}
          value={form.companyName}
          editMode={editMode}
          name="companyName"
          onChange={handleChange}
        />

        <ProfileField
          label="Mailing Address"
          icon={MapPin}
          value={form.mailingAddress}
          editMode={editMode}
          name="mailingAddress"
          onChange={handleChange}
          textarea
        />
      </div>

      {/* Footer */}
      <div className="border-t px-6 py-4 flex justify-between items-center">
        <span className="text-xs text-gray-500">
          Keep your profile up to date for smooth operations
        </span>

        <button
          onClick={() => setShowChangePassword(true)}
          className="flex items-center gap-2 text-md text-blue-600 hover:underline cursor-pointer"
        >
          <Lock className="w-4 h-4" />
          Change Password
        </button>
      </div>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showChangePassword && (
          <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Profile;
