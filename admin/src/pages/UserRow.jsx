import React, { useState } from "react";

const UserRow = ({ user, refresh }) => {
  const adminToken = localStorage.getItem("adminToken");
  const [open, setOpen] = useState(false);
  const [remarks, setRemarks] = useState(user.documentRemarks || {});

  const toggleApproval = async (checked) => {
    await fetch(
      `https://logistics-bnqu.onrender.com/api/admin/users/${user._id}/approval`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ approved: checked }),
      }
    );
    refresh();
  };

  const saveRemark = async (doc) => {
    await fetch(
      `https://logistics-bnqu.onrender.com/api/admin/users/${user._id}/document-remark`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          document: doc,
          remark: remarks[doc],
        }),
      }
    );
  };

  const assignAccountType = async (userId, accountType, token) => {
    if (!token) {
      alert("Admin session expired. Please login again.");
      return;
    }

    const res = await fetch(
      `https://logistics-bnqu.onrender.com/api/admin/users/${userId}/account-type`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ accountType }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to assign account type");
    }

    alert(`Assigned ${data.accountCode}`);
    refresh(); // 🔥 refresh user list
  };

  return (
    <>
      {/* Main Row */}
      <tr className="border-t">
        <td className="p-3">{user.name}</td>
        <td className="p-3">{user.email}</td>
        <td className="p-3">{user.mobile}</td>
        <td className="p-3">
          <select
            className="border rounded px-2 py-1 text-sm"
            value={user.accountType || ""}
            onChange={async (e) => {
              try {
                if (
                  user.accountCode &&
                  !window.confirm(
                    `This will change account code from ${user.accountCode}. Continue?`
                  )
                ) {
                  return;
                }
                await assignAccountType(user._id, e.target.value, adminToken);
              } catch (err) {
                alert(err.message);
              }
            }}
          >
            <option value="">Select</option>
            <option value="CC">CC</option>
            <option value="CB">CB</option>
          </select>

          {user.accountCode && (
            <span className="ml-2 font-mono text-xs text-green-600">
              {user.accountCode}
            </span>
          )}
        </td>
        <td className="p-3 text-center">
          <input
            type="checkbox"
            checked={user.isApprovedByAdmin}
            onChange={(e) => toggleApproval(e.target.checked)}
          />
        </td>
        <td className="p-3">{new Date(user.createdAt).toLocaleDateString()}</td>
        <td className="p-3 text-right">
          <button
            onClick={() => setOpen(!open)}
            className="text-blue-600 underline cursor-pointer"
          >
            {open ? "Hide" : "View"}
          </button>
        </td>
      </tr>

      {/* Expanded Row */}
      {open && (
        <tr className="bg-gray-50">
          <td colSpan="6" className="p-4 space-y-4">
            <div>
              <strong>Company:</strong> {user.companyName}
            </div>
            <div>
              <strong>Address:</strong> {user.mailingAddress}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Mobile Verified:</strong>{" "}
                {user.isMobileVerified ? "Yes" : "No"}
              </div>
              <div>
                <strong>Email Verified:</strong>{" "}
                {user.isEmailVerified ? "Yes" : "No"}
              </div>
            </div>

            {/* Documents */}
            <div>
              <h3 className="font-semibold mb-2">Documents</h3>

              <div className="space-y-3">
                {Object.entries(user.documents || {}).map(
                  ([doc, file]) =>
                    file && (
                      <div key={doc} className="border p-3 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="font-medium uppercase">{doc}</span>

                          <a
                            href={`https://logistics-bnqu.onrender.com/${file}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 underline"
                          >
                            Open
                          </a>
                        </div>

                        {/* Remark */}
                        <textarea
                          placeholder="Add remark if document is incorrect"
                          className="w-full border mt-2 p-2 rounded"
                          value={remarks[doc] || ""}
                          onChange={(e) =>
                            setRemarks({
                              ...remarks,
                              [doc]: e.target.value,
                            })
                          }
                          onBlur={() => saveRemark(doc)}
                        />
                      </div>
                    )
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default UserRow;
