import Booking from "../models/Booking.js";

// Helper to generate a random Booking ID
const generateBookingId = () => {
  return "BKG" + Math.floor(100000 + Math.random() * 900000);
};

/* =========================================
   CREATE BOOKING
========================================= */
export const createBooking = async (req, res) => {
  try {
    if (!req.body.payload) {
      return res.status(400).json({ message: "Missing payload data" });
    }

    const payloadData = JSON.parse(req.body.payload);
    const uploadedFiles = req.files;

    // 1. Map Files
    if (uploadedFiles && uploadedFiles.length > 0 && payloadData.documents) {
      payloadData.documents = payloadData.documents.map((doc, index) => {
        const file = uploadedFiles.find(
          (f) => f.fieldname === `documents[${index}]`,
        );
        if (file) {
          return {
            ...doc,
            fileName: file.originalname,
            filePath: file.path,
            mimeType: file.mimetype,
          };
        }
        return doc;
      });
    }

    // 2. Determine User ID (Fallback to "USER_123" if auth fails/is missing during dev)
    const userId = req.user ? req.user._id : "USER_123";

    // 3. Create Record
    const newBooking = new Booking({
      ...payloadData,
      bookingId: generateBookingId(),
      userId: userId,
      status: "OPEN",
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
    // ⚠️ CHANGED: Removed strict user filtering temporarily so you can see ALL data
    // Once Auth is fully synced, change this back to: { userId: req.user._id }
    const bookings = await Booking.find().sort({ createdAt: -1 });

    // ✅ Map to Frontend Table Structure exactly
    const formatted = bookings.map((b) => ({
      _id: b._id,
      booking_id: b.bookingId,
      created_at: b.createdAt,

      // Shipment Meta
      vendor_name: b.selectedVendor?.vendorCode || "N/A",
      module: "EXPORT",
      shipment_type:
        b.shipment?.nonDocCategory || b.shipment?.shipmentMainType || "N/A",

      // Tracking Numbers
      awb_number: b.bookingId, // Replace with real AWB field if you have it
      skart_awb: `SLS-${b.bookingId}`, // Mock Skart AWB
      tracking_number: b.bookingId,
      tracking_status: b.status || "PENDING",

      // Last Status Details
      lastStatus: "Shipment Booked",
      lastStatusTime: new Date(b.createdAt).toLocaleString(),

      // Locations
      origin_city: b.shipment?.originCity || "INDIA",
      destination_city: b.shipment?.destinationCity || "GLOBAL",

      // Financials & Weights
      grand_total: b.selectedVendor?.totalPrice || 0,
      charged_weight: b.weights?.chargeableWeight || 0,

      // ✅ Data for Modal
      boxes: b.boxes || { rows: [] },
      goods: b.goods || { rows: [] },
    }));

    res.status(200).json({ statusCode: 200, data: formatted });
  } catch (error) {
    console.error("Fetch Bookings Error:", error);
    res.status(500).json({ message: "Fetch failed" });
  }
};
