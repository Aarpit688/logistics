import Booking from "../models/Booking.js";

// Helper to generate a random Booking ID
const generateBookingId = () => {
  return "ACE" + Math.floor(100000 + Math.random() * 900000);
};

/* =========================================
   CREATE BOOKING
========================================= */

export const createBooking = async (req, res) => {
  try {
    if (!req.body.payload) {
      return res.status(400).json({ message: "Missing payload data" });
    }

    // 1. Determine User ID First (Needed for naming)
    // Fallback to "USER_123" only if req.user is missing
    const userId = req.user ? req.user._id : "USER_123";

    const payloadData = JSON.parse(req.body.payload);
    const uploadedFiles = req.files;

    // 2. Map Files & Apply New Naming Logic
    if (uploadedFiles && uploadedFiles.length > 0 && payloadData.documents) {
      payloadData.documents = payloadData.documents.map((doc, index) => {
        const file = uploadedFiles.find(
          (f) => f.fieldname === `documents[${index}]`,
        );

        if (file) {
          const extension = file.originalname.split(".").pop();

          // Determine clean document name
          const docName =
            doc.type === "OTHER"
              ? (doc.otherName || "Document").replace(/\s+/g, "_")
              : doc.type;

          // ✅ NEW NAMING FORMAT: userId + "_" + docName + "." + extension
          // Example: 65a4b3c..._PAN_CARD.png
          const finalFileName = `${userId}_${docName}.${extension}`;

          return {
            ...doc,
            fileName: finalFileName, // Saved to DB for frontend display
            filePath: file.path, // Cloudinary URL
            mimeType: file.mimetype,
          };
        }
        return doc;
      });
    }

    // 3. Create Record
    const newBooking = new Booking({
      ...payloadData,
      bookingId: generateBookingId(),
      userId: userId,
      status: "PENDING",
    });

    await newBooking.save();

    res.status(200).json({
      message: "Booking created successfully",
      statusCode: 200,
      bookingId: newBooking.bookingId,
      data: newBooking,
    });
  } catch (error) {
    console.error("Create Booking Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* =========================================
   GET USER BOOKINGS (Fixed)
========================================= */
export const getUserBookings = async (req, res) => {
  try {
    // 1. Fetch all bookings from the database
    // .lean() is used here to get a plain JavaScript object instead of a heavy Mongoose document
    const bookings = await Booking.find().sort({ createdAt: -1 }).lean();

    // 2. Return the full array of objects directly
    // This gives your frontend access to every single field defined in your schema
    res.status(200).json({
      statusCode: 200,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error("Fetch Bookings Error:", error);
    res.status(500).json({
      message: "Fetch failed",
      error: error.message,
    });
  }
};
