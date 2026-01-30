import Booking from "../models/Booking.js";

// Helper to generate a random Booking ID
const generateBookingId = () => {
  return "BKG" + Math.floor(100000 + Math.random() * 900000);
};

/* =========================================
   CREATE BOOKING
========================================= */
/* =========================================
   CREATE BOOKING (Updated)
========================================= */
export const createBooking = async (req, res) => {
  try {
    if (!req.body.payload) {
      return res.status(400).json({ message: "Missing payload data" });
    }

    const payloadData = JSON.parse(req.body.payload);
    const uploadedFiles = req.files;

    // 1. Map Files with Correct Paths & Names
    if (uploadedFiles && uploadedFiles.length > 0 && payloadData.documents) {
      payloadData.documents = payloadData.documents.map((doc, index) => {
        const file = uploadedFiles.find(
          (f) => f.fieldname === `documents[${index}]`,
        );

        if (file) {
          // ✅ 1. Generate Clean Filename based on Doc Type
          const extension = file.originalname.split(".").pop();
          // If type is "OTHER", use the custom name, otherwise use the type (e.g., "PAN", "GST")
          const docName =
            doc.type === "OTHER"
              ? (doc.otherName || "Document").replace(/\s+/g, "_") // Replace spaces with underscores
              : doc.type;

          const finalFileName = `${docName}.${extension}`;

          return {
            ...doc,
            fileName: finalFileName, // <--- New clean name
            // ✅ 2. Fix Path for Browser (Convert '\' to '/')
            filePath: file.path.replace(/\\/g, "/"),
            mimeType: file.mimetype,
          };
        }
        return doc;
      });
    }

    // 2. Determine User ID
    const userId = req.user ? req.user._id : "USER_123";

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
