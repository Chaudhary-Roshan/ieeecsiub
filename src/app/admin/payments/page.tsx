"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { db } from "@/lib/db";
import { PaymentProof, StaffUser } from "@/types";
import { Button } from "@/components/ui/Button";
import {
  CreditCard,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  Search,
} from "lucide-react";

export default function AdminPaymentsQueuePage() {
  const [payments, setPayments] = useState<PaymentProof[]>([]);
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);

  useEffect(() => {
    async function load() {
      const live = await db.fetchPayments();
      setPayments(live);
    }
    load();
    const saved = localStorage.getItem("ieee_cs_active_staff");
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const refreshPayments = async () => {
    const live = await db.fetchPayments();
    setPayments(live);
  };

  const handleDecision = (
    paymentId: string,
    decision: "VERIFIED" | "REJECTED",
    reason?: string
  ) => {
    if (!currentUser) return;

    db.verifyPayment(paymentId, currentUser.name, decision, reason);
    refreshPayments();
  };

  const pendingPayments = payments.filter((p) => p.status === "PENDING");
  const processedPayments = payments.filter((p) => p.status !== "PENDING");

  // Check for duplicate transaction IDs across all records
  const txCounts: { [tx: string]: number } = {};
  payments.forEach((p) => {
    txCounts[p.transactionId] = (txCounts[p.transactionId] || 0) + 1;
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <span className="text-xs font-montserrat font-bold text-ieee-orange uppercase tracking-wider block">
            Option 2: Financial Operations
          </span>
          <h1 className="text-2xl sm:text-3xl font-montserrat font-extrabold text-ieee-navy">
            Treasurer Payment Verification Queue
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-3xl leading-relaxed">
            Reconcile paid event registrations against chapter official Raast and Bank
            Alfalah bank accounts. System automatically flags duplicate or reused
            transaction references.
          </p>
        </div>

        {/* Pending Queue */}
        <div className="bg-white border border-gray-200 rounded-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="font-montserrat font-bold text-base text-ieee-navy flex items-center gap-2">
              <CreditCard className="text-ieee-blue" size={18} />
              Pending Payment Slips ({pendingPayments.length})
            </h2>
            <span className="text-xs text-gray-500">Manual Bank Verification</span>
          </div>

          {pendingPayments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-xs">
              No payments awaiting verification in the queue.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPayments.map((pay) => {
                const isDuplicate = txCounts[pay.transactionId] > 1;

                return (
                  <div
                    key={pay.id}
                    className="p-5 border border-gray-200 rounded-xl bg-gray-50 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-montserrat font-bold text-base text-gray-900">
                            {pay.recipientName}
                          </span>
                          <span className="bg-ieee-surfaceTint text-ieee-navy font-bold text-xs px-2.5 py-0.5 rounded-full">
                            PKR {pay.amountPkr}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">
                          Event: <strong>{pay.eventTitle}</strong>
                        </p>
                        <p className="text-xs font-mono text-gray-700">
                          Method: {pay.paymentMethod} • TX ID:{" "}
                          <strong className="text-ieee-blue">{pay.transactionId}</strong>
                        </p>
                      </div>

                      {/* Duplicate Warning Badge */}
                      {isDuplicate && (
                        <div className="p-2.5 bg-[#FCE8E6] border border-[#F5C2BE] rounded-lg text-xs text-[#BA0C2F] flex items-center gap-2">
                          <AlertTriangle size={15} />
                          <span>
                            <strong>Duplicate Flag:</strong> This TX reference appears multiple
                            times!
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Screenshot Preview & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-gray-200">
                      <a
                        href={pay.proofImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-ieee-blue font-semibold hover:underline"
                      >
                        <ExternalLink size={13} /> View Attached Payment Slip (Private Link)
                      </a>

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleDecision(pay.id, "REJECTED", "Transaction reference unconfirmed on bank statement")}
                          variant="danger"
                          size="sm"
                        >
                          <XCircle size={14} className="mr-1" /> Reject Payment
                        </Button>

                        <Button
                          onClick={() => handleDecision(pay.id, "VERIFIED")}
                          variant="primary"
                          size="sm"
                          className="bg-[#00843D] hover:bg-[#006e33]"
                        >
                          <CheckCircle size={14} className="mr-1" /> Approve & Confirm Seat
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Previously Processed Payments */}
        <div className="bg-white border border-gray-200 rounded-card p-6 shadow-sm space-y-4">
          <h2 className="font-montserrat font-bold text-base text-ieee-navy border-b pb-3">
            Reconciled History
          </h2>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Attendee</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Transaction ID</th>
                  <th className="p-3">Verified By</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {processedPayments.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3 font-semibold text-gray-800">{p.recipientName}</td>
                    <td className="p-3 font-bold text-gray-700">PKR {p.amountPkr}</td>
                    <td className="p-3 font-mono text-gray-600">{p.transactionId}</td>
                    <td className="p-3 text-gray-600">{p.verifiedBy || "Treasurer"}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.status === "VERIFIED"
                            ? "bg-[#E6F4EA] text-[#00843D]"
                            : "bg-[#FCE8E6] text-[#BA0C2F]"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
