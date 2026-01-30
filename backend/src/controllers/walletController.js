import crypto from "crypto";
import axios from "axios";
import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";

// ⚠️ PHONEPE CONFIG (Use Env Variables in production)
const PHONEPE_HOST_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox"; // Use Prod URL for live
const MERCHANT_ID = "PGTESTPAYUAT"; // Replace with your Merchant ID
const SALT_KEY = "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399"; // Replace with your Salt Key
const SALT_INDEX = 1;

/* =========================================
   1. GET WALLET DETAILS
========================================= */
export const getWalletDetails = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.user._id });

    // Create wallet if it doesn't exist
    if (!wallet) {
      wallet = await Wallet.create({ userId: req.user._id });
    }

    const transactions = await Transaction.find({ walletId: wallet._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      balance: wallet.balance,
      transactions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================================
   2. INITIATE ADD MONEY (PhonePe)
========================================= */
export const addMoneyToWallet = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user._id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // 1. Create a Pending Transaction
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) wallet = await Wallet.create({ userId });

    const merchantTransactionId = "TXN" + Date.now(); // Unique ID

    const newTxn = await Transaction.create({
      walletId: wallet._id,
      userId,
      amount,
      type: "CREDIT",
      status: "PENDING",
      description: "Adding money via PhonePe",
      transactionId: merchantTransactionId,
    });

    // 2. Prepare PhonePe Payload
    const payload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId: merchantTransactionId,
      merchantUserId: userId.toString(),
      amount: amount * 100, // PhonePe accepts amount in Paisa
      redirectUrl: `${process.env.FRONTEND_URL}/wallet/status?id=${merchantTransactionId}`,
      redirectMode: "REDIRECT",
      callbackUrl: `${process.env.BACKEND_URL}/api/wallet/callback`,
      mobileNumber: req.user.mobile || "9999999999",
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    // 3. Generate Checksum (Base64 + SHA256)
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString(
      "base64",
    );
    const stringToHash = base64Payload + "/pg/v1/pay" + SALT_KEY;
    const sha256 = crypto
      .createHash("sha256")
      .update(stringToHash)
      .digest("hex");
    const checksum = sha256 + "###" + SALT_INDEX;

    // 4. Call PhonePe API
    const response = await axios.post(
      `${PHONEPE_HOST_URL}/pg/v1/pay`,
      { request: base64Payload },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": checksum,
        },
      },
    );

    // 5. Return Payment URL to Frontend
    if (response.data.success) {
      res.status(200).json({
        success: true,
        url: response.data.data.instrumentResponse.redirectInfo.url,
        transactionId: merchantTransactionId,
      });
    } else {
      res.status(400).json({ message: "PhonePe initiation failed" });
    }
  } catch (error) {
    console.error("Add Money Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* =========================================
   3. VERIFY PAYMENT (Callback/Status Check)
========================================= */
export const verifyPaymentStatus = async (req, res) => {
  try {
    const { merchantTransactionId } = req.body;

    const txn = await Transaction.findOne({
      transactionId: merchantTransactionId,
    });
    if (!txn) return res.status(404).json({ message: "Transaction not found" });

    // Check Status with PhonePe
    const stringToHash =
      `/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}` + SALT_KEY;
    const sha256 = crypto
      .createHash("sha256")
      .update(stringToHash)
      .digest("hex");
    const checksum = sha256 + "###" + SALT_INDEX;

    const response = await axios.get(
      `${PHONEPE_HOST_URL}/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": checksum,
          "X-MERCHANT-ID": MERCHANT_ID,
        },
      },
    );

    if (response.data.success && response.data.code === "PAYMENT_SUCCESS") {
      // ✅ SUCCESS: Update Wallet
      if (txn.status !== "SUCCESS") {
        txn.status = "SUCCESS";
        txn.providerReferenceId = response.data.data.transactionId;
        await txn.save();

        // Increment Balance
        await Wallet.findByIdAndUpdate(txn.walletId, {
          $inc: { balance: txn.amount },
        });
      }
      return res
        .status(200)
        .json({ success: true, message: "Payment Successful" });
    } else {
      // ❌ FAILED
      txn.status = "FAILED";
      await txn.save();
      return res
        .status(400)
        .json({ success: false, message: "Payment Failed" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
