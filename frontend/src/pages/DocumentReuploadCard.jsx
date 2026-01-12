import React, { useState } from "react";

const DocumentReuploadCard = ({ doc, remark, onUploaded }) => {
  const token = localStorage.getItem("token");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const upload = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(
      `https://logistics-bnqu.onrender.com/api/user/documents/${doc}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Upload failed");
      setLoading(false);
      return;
    }

    setLoading(false);
    setFile(null);
    onUploaded();
  };

  return (
    <div className="border bg-white rounded-md p-4 space-y-3">
      <h3 className="font-semibold uppercase">{doc}</h3>

      <p className="text-sm text-red-600">Admin remark: {remark}</p>

      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button
        onClick={upload}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md"
      >
        {loading ? "Uploading..." : "Re-upload"}
      </button>
    </div>
  );
};

export default DocumentReuploadCard;
