import { useOutletContext } from "react-router-dom";
import DocumentReuploadCard from "./DocumentReuploadCard";
import { AlertTriangle } from "lucide-react";

const DashboardHome = () => {
  const { user, refetchUser } = useOutletContext();

  const rejectedDocs = Object.entries(user.documentRemarks || {}).filter(
    ([_, remark]) => remark
  );

  if (!rejectedDocs.length) {
    return <p>Welcome to your dashboard 🎉</p>;
  }

  return (
    <>
      <div className="mb-6 p-4 rounded-md flex items-center gap-3 bg-red-50 text-red-700 border border-red-200">
        <AlertTriangle className="w-5 h-5" />
        Action required. Please re-upload rejected documents.
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {rejectedDocs.map(([doc, remark]) => (
          <DocumentReuploadCard
            key={doc}
            doc={doc}
            remark={remark}
            onUploaded={refetchUser}
          />
        ))}
      </div>
    </>
  );
};

export default DashboardHome;
