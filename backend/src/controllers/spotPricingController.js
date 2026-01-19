import SpotPricing from "../models/SpotPricing.js";

// ✅ POST: /api/spot-pricing/enquiry
export const createSpotPricingEnquiry = async (req, res) => {
  try {
    const { serviceability, shipmentDetails, user } = req.body;

    const enquiry = await SpotPricing.create({
      user: user || {},
      serviceability,
      shipmentDetails,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully",
      enquiryId: enquiry._id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create enquiry",
      error: error.message,
    });
  }
};
