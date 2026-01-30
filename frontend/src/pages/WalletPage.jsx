import React, { useEffect, useState } from "react";
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCcw,
  Loader2,
} from "lucide-react";
import { API_BASE_URL } from "../config/api";

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

  // 1. Fetch Wallet Data
  const fetchWallet = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/wallet`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setBalance(data.balance);
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error("Error fetching wallet:", error);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  // 2. Add Money Handler
  const handleAddMoney = async () => {
    if (!amount || amount < 1) return alert("Please enter a valid amount");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/wallet/add-money`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: Number(amount) }),
      });

      const data = await res.json();

      if (data.success && data.url) {
        // Redirect to PhonePe Payment Page
        window.location.href = data.url;
      } else {
        alert("Failed to initiate payment");
      }
    } catch (error) {
      console.error(error);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Wallet className="text-blue-600" /> My Wallet
        </h1>

        {/* Balance Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl p-8 text-white shadow-xl">
            <p className="text-blue-200 font-medium text-sm uppercase tracking-wide">
              Available Balance
            </p>
            <h2 className="text-5xl font-black mt-2">
              ₹ {balance.toLocaleString()}
            </h2>
            <div className="mt-8 flex gap-4">
              <div className="flex-1">
                <label className="text-xs text-blue-200 block mb-1">
                  Add Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter ₹"
                  className="w-full px-4 py-2 rounded-lg text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAddMoney}
                  disabled={loading}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Plus size={20} />
                  )}
                  Add Money
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats or Promo */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col justify-center">
            <h3 className="font-bold text-gray-800 text-lg mb-2">
              Wallet Benefits
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" /> Instant
                Booking Confirmation
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" /> No Payment
                Gateway Failures
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" /> Easy
                Refunds & Adjustments
              </li>
            </ul>
          </div>
        </div>

        {/* Transactions History */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Transaction History</h3>
            <button
              onClick={fetchWallet}
              className="text-gray-400 hover:text-blue-600"
            >
              <RefreshCcw size={18} />
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-gray-500 italic">
                No transactions yet.
              </div>
            ) : (
              transactions.map((txn) => (
                <div
                  key={txn._id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        txn.type === "CREDIT"
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {txn.type === "CREDIT" ? (
                        <ArrowDownLeft size={20} />
                      ) : (
                        <ArrowUpRight size={20} />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">
                        {txn.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(txn.createdAt).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                        ID: {txn.transactionId}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-black text-lg ${
                        txn.type === "CREDIT"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {txn.type === "CREDIT" ? "+" : "-"} ₹{txn.amount}
                    </p>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        txn.status === "SUCCESS"
                          ? "bg-green-100 text-green-700"
                          : txn.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {txn.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
