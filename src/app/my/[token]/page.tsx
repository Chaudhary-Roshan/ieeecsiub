"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { submitPaymentAction } from "@/app/actions/operations";
import QRCode from "qrcode";
import { Button } from "@/components/ui/Button";
import {
  CheckCircle,
  Clock,
  MapPin,
  Calendar,
  UploadCloud,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  QrCode,
  FileCheck,
} from "lucide-react";
import clsx from "clsx";

export default function RegistrantPortalPage() {
  const params = useParams();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [regData, setRegData] = useState<any | null>(null);
  const [eventData, setEventData] = useState<any | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  // Payment upload state
  const [txId, setTxId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Raast");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    async function fetchRecord() {
      if (!token) return;
      const supabase = createClient();

      const { data: reg, error: regErr } = await supabase
        .from("registrations")
        .select("*")
        .eq("private_token", token)
        .maybeSingle();

      if (reg && !regErr) {
        setRegData(reg);

        // Fetch event details
        if (reg.event_id) {
          const { data: evt } = await supabase
            .from("events")
            .select("*")
            .eq("id", reg.event_id)
            .maybeSingle();
          setEventData(evt);
        }

        // Generate Ticket QR Code
        if (reg.ticket_code) {
          try {
            const qr = await QRCode.toDataURL(reg.ticket_code, {
              margin: 1,
              width: 250,
              color: { dark: "#002855", light: "#FFFFFF" },
            });
            setQrDataUrl(qr);
          } catch {}
        }
      }
      setLoading(false);
    }

    fetchRecord();
  }, [token]);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txId.trim()) {
      alert("Please enter the transaction reference / TID.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitPaymentAction({
        privateToken: token,
        method: paymentMethod,
        transactionId: txId.trim(),
        proofPath: "manual-submission",
      });

      setUploadSuccess(true);
      setRegData({ ...regData, status: "PAYMENT_PENDING" });
      alert("Payment proof submitted! The chapter treasurer will verify your payment.");
    } catch (err: any) {
      alert("Submission error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-2 text-xs font-montserrat text-gray-500">
          <div className="w-8 h-8 border-2 border-ieee-blue border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Retrieving your registration ticket...</p>
        </div>
      </div>
    );
  }

  if (!regData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-card p-8 max-w-md text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle size={24} />
          </div>
          <h1 className="font-montserrat font-bold text-lg text-gray-800">
            Registration Ticket Not Found
          </h1>
          <p className="text-xs text-gray-500">
            The private link or registration token is invalid or has expired. Please check the URL sent to your email.
          </p>
          <Link href="/events">
            <Button variant="primary" size="sm" className="text-xs">
              Explore Chapter Events
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isConfirmed = regData.status === "CONFIRMED";
  const isAttended = regData.status === "ATTENDED";
  const isPending = regData.status === "PAYMENT_PENDING";

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-1">
          <div className="text-[11px] font-montserrat font-bold text-ieee-orange uppercase tracking-wider">
            IEEE Computer Society UCET-IUB
          </div>
          <h1 className="text-2xl sm:text-3xl font-montserrat font-extrabold text-ieee-navy">
            Official Attendee Entry Pass
          </h1>
        </div>

        {/* Ticket Card */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg">
          {/* Top Status Banner */}
          <div
            className={clsx(
              "px-6 py-3 text-xs font-bold font-montserrat flex items-center justify-between",
              isConfirmed && "bg-emerald-600 text-white",
              isAttended && "bg-ieee-navy text-white",
              isPending && "bg-amber-500 text-white"
            )}
          >
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              {isConfirmed && <CheckCircle size={15} />}
              {isAttended && <ShieldCheck size={15} />}
              {isPending && <Clock size={15} />}
              Status: {regData.status}
            </span>
            <span className="font-mono text-[11px] opacity-90">Ticket #{regData.ticket_code}</span>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Event Overview */}
            <div className="space-y-2 border-b border-gray-100 pb-5">
              <span className="text-[10px] font-bold text-ieee-blue uppercase tracking-wider">
                Event Program
              </span>
              <h2 className="text-xl font-montserrat font-bold text-ieee-navy">
                {eventData?.title || "IEEE Technical Workshop"}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 pt-1">
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-ieee-orange" />
                  <span>{eventData?.start_date?.slice(0, 10)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-ieee-orange" />
                  <span className="truncate">{eventData?.venue || "UCET IUB"}</span>
                </div>
              </div>
            </div>

            {/* Attendee Details & QR Badge */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-3 flex-1 text-xs">
                <div>
                  <span className="text-gray-400 text-[10px] uppercase font-bold block">
                    Attendee Name
                  </span>
                  <span className="font-montserrat font-bold text-base text-ieee-navy">
                    {regData.full_name}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] uppercase font-bold block">
                    Roll Number / Affiliation
                  </span>
                  <span className="font-semibold text-gray-700">
                    {regData.roll_number || "Guest / Participant"} ({regData.department})
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] uppercase font-bold block">
                    Registered Email
                  </span>
                  <span className="text-gray-600">{regData.email}</span>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center shadow-sm flex-shrink-0">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Ticket QR" className="w-36 h-36 mx-auto rounded" />
                ) : (
                  <div className="w-36 h-36 bg-gray-200 rounded animate-pulse" />
                )}
                <div className="text-[10px] font-mono font-bold text-ieee-navy mt-1">
                  {regData.ticket_code}
                </div>
                <div className="text-[9px] text-gray-400">Scan at Entry Desk</div>
              </div>
            </div>

            {/* Payment Pending Notice & Submission Form */}
            {isPending && (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-3">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle size={15} /> Payment Proof Required
                </div>
                <p className="text-amber-800 leading-relaxed text-[11px]">
                  Please transfer the registration fee of <strong>PKR {eventData?.fee_pkr || "TBD"}</strong> via Raast (ID: 0300-1234567) or Bank Alfalah, and enter your transaction ID below.
                </p>

                <form onSubmit={handlePaymentSubmit} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Transaction Reference / TID *
                    </label>
                    <input
                      type="text"
                      required
                      value={txId}
                      onChange={(e) => setTxId(e.target.value)}
                      placeholder="e.g. 123456789012"
                      className="w-full p-2 border rounded-lg bg-white text-xs outline-none focus:ring-1 focus:ring-ieee-blue font-mono"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    variant="primary"
                    size="sm"
                    className="w-full text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Payment Reference"}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Entry Instructions */}
        <div className="p-4 bg-white border border-gray-200 rounded-xl text-xs text-gray-500 space-y-1 text-center">
          <p>
            Please present this digital pass or a printed copy at the chapter check-in desk on event day.
          </p>
          <p className="text-[11px] text-gray-400">
            IEEE Computer Society Student Branch Chapter &bull; UCET, The Islamia University of Bahawalpur
          </p>
        </div>
      </div>
    </div>
  );
}

