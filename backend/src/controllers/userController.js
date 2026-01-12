import User from "../models/User.js";

export const reuploadDocument = async (req, res) => {
  try {
    const { documentType } = req.params;

    console.log("USER ID:", req.user?.id);
    console.log("DOCUMENT:", documentType);
    console.log("FILE:", req.file?.path);

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: "Unauthorized user",
      });
    }

    const allowedDocs = [
      "gst",
      "iec",
      "pan",
      "aadhar",
      "lut",
      "stamp",
      "signature",
      "photo",
    ];

    if (!allowedDocs.includes(documentType)) {
      return res.status(400).json({
        message: "Invalid document type",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "File missing or invalid file type",
      });
    }

    await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          [`documents.${documentType}`]: req.file.path,
          [`documentRemarks.${documentType}`]: "",
          isApprovedByAdmin: false,
        },
      },
      { new: true }
    );

    return res.json({
      message: "Document re-uploaded successfully",
    });
  } catch (err) {
    console.error("REUPLOAD ERROR FULL:", err);
    return res.status(500).json({
      message: "Reupload failed",
    });
  }
};
