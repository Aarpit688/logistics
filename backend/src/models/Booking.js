import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    // Basic Tracking
    bookingId: { type: String, unique: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Allow guests (null)
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "IN_TRANSIT", "DELIVERED", "CANCELLED"],
      default: "PENDING",
    },

    // 1. Shipment Meta
    shipment: {
      shipmentMainType: String, // DOCUMENT or NON_DOCUMENT
      nonDocCategory: String,
      originCountry: String,
      destinationCountry: String,
      destinationCountryId: String,
      originPincode: String,
      originCity: String,
      originState: String,
      destinationZip: String,
      destinationCity: String,
      destinationState: String,
    },

    // 2. Units Config
    units: {
      weightUnit: String,
      currencyUnit: String,
      dimensionUnit: String,
    },

    // 3. Export/Commercial Details
    exportDetails: {
      referenceNumber: String,
      exportFormat: String,
      docWeight: String, // For Documents
      generalGoodsDescription: String,
      termsOfInvoice: String,
      invoiceNumber: String,
      invoiceDate: String,
      gstInvoice: Boolean,
      exportReason: String,
      // Commercial Fields
      iecNumber: String,
      lutIgst: String,
      lutNumber: String,
      lutIssueDate: String,
      totalIgst: String,
      bankAccNumber: String,
      bankIFSC: String,
      bankADCode: String,
      firmType: String,
      nfei: Boolean,
      fobValue: String,
      freightCharges: String,
      insurance: String,
      otherCharges: String,
      otherChargeName: String,
    },

    // 4. Dimensions
    boxes: {
      boxesCount: Number,
      totalWeight: Number,
      rows: [
        {
          qty: Number,
          weight: Number,
          length: Number,
          breadth: Number,
          height: Number,
        },
      ],
    },

    // 5. Goods List
    goods: {
      rows: [
        {
          boxNo: Number,
          description: String,
          hsnCode: String,
          qty: Number,
          unit: String,
          rate: Number,
          amount: Number,
        },
      ],
    },

    // 6. Calculated Weights
    weights: {
      actualWeight: Number,
      volumetricWeight: Number,
      chargeableWeight: Number,
    },

    // 7. Addresses
    addresses: {
      sender: {
        contactNumber: String,
        name: String,
        companyName: String,
        email: String,
        addressLine1: String,
        addressLine2: String,
        city: String,
        state: String,
        country: String,
        pincode: String,
        iecNo: String,
        kycType: String,
        kycNo: String,
        taxPaymentOption: String,
        documentType: String,
        documentNumber: String,
      },
      receiver: {
        contactNumber: String,
        name: String,
        companyName: String,
        email: String,
        addressLine1: String,
        addressLine2: String,
        city: String,
        state: String,
        country: String,
        zipCode: String,
        idType: String,
        idNumber: String,
        documentType: String,
        documentNumber: String,
        deliveryInstructions: String,
      },
    },

    // 8. Uploaded Documents Metadata
    documents: [
      {
        type: { type: String }, // KYC, OTHER
        otherName: String,
        fileName: String,
        filePath: String, // Path to file on server
        mimeType: String,
      },
    ],

    // 9. Selected Vendor Rate
    selectedVendor: {
      id: String,
      vendorCode: String,
      tat: String,
      chargeableWeight: Number,
      totalPrice: Number,
      breakup: [
        {
          label: String,
          amount: String,
        },
      ],
    },
  },
  { timestamps: true },
);

export default mongoose.model("Booking", BookingSchema);
