const ProfileField = ({ label, value, editMode, name, onChange, textarea }) => {
  return (
    <div>
      <p className="text-gray-500 mb-1">{label}</p>

      {editMode && name ? (
        textarea ? (
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            rows={3}
            autoComplete={value}
            className="w-full border rounded-md px-3 py-2 text-md focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        ) : (
          <input
            type="text"
            name={name}
            value={value}
            onChange={onChange}
            autoComplete={value}
            className="w-full border rounded-md px-3 py-2 text-md focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        )
      ) : (
        <p className="font-medium text-gray-800">{value || "-"}</p>
      )}
    </div>
  );
};

export default ProfileField;
