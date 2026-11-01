"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { registerForEventAction, submitPaymentAction } from "@/app/actions/operations";
import { EventItem, Registration } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import clsx from "clsx";
import { formatPKTDateTime, formatPKTDateOnly } from "@/lib/sha256";
import {
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  Award,
  Users,
  CheckCircle,
  ExternalLink,
  AlertTriangle,
  UploadCloud,
  FileCheck2,
  Lock,
  Camera,
  ZoomIn,
  X,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Search,
} from "lucide-react";

export default function EventDetailPage() {
  const params = useParams();
  const slugParam = params?.slug;
  const rawSlug = Array.isArray(slugParam)
    ? slugParam.join("/")
    : ((slugParam as string) || "");

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  // Registration Form State (Option 2)
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [department, setDepartment] = useState("Computer Science");
  const [isIeeeMember, setIsIeeeMember] = useState(false);
  const [ieeeNumber, setIeeeNumber] = useState("");
  const [namePref, setNamePref] = useState<"FULL_NAME" | "FIRST_INITIAL">("FULL_NAME");
  const [photoConsent, setPhotoConsent] = useState(true);
  const [privacyConsent, setPrivacyConsent] = useState(true);

  // Payment fields if paid event
  const [txId, setTxId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Raast" | "Bank Transfer" | "EasyPaisa / JazzCash">("Raast");
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);

  // Success Confirmation State
  const [confirmedReg, setConfirmedReg] = useState<Registration | null>(null);

  useEffect(() => {
    if (!rawSlug) return;
    const cleanSlug = rawSlug.replace(/^\/+/, "");
    const baseSlug = cleanSlug.includes("/")
      ? cleanSlug.split("/").slice(1).join("/")
      : cleanSlug;

    async function loadEvent() {
      let currentEvt: EventItem | null = (await db.fetchEventBySlug(cleanSlug)) || null;
      if (!currentEvt && baseSlug !== cleanSlug) {
        currentEvt = (await db.fetchEventBySlug(baseSlug)) || null;
      }
      if (!currentEvt) {
        currentEvt = db.getEventBySlug(cleanSlug) || db.getEventBySlug(baseSlug) || null;
      }
      setEvent(currentEvt);
      setLoading(false);
    }

    loadEvent();
  }, [rawSlug]);

  // Keyboard navigation for photo lightbox
  useEffect(() => {
    if (activePhotoIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActivePhotoIndex(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePhotoIndex]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    if (!privacyConsent) {
      alert("Please agree to the data protection terms.");
      return;
    }

    try {
      const res = await registerForEventAction({
        eventId: event.id,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        rollNumber: rollNumber.trim() || undefined,
        department: department.trim() || "Computer Science",
        isIeeeMember,
        ieeeNumber: ieeeNumber.trim() || undefined,
      });

      const newReg: Registration = {
        id: res.registrationId || `reg-${Date.now()}`,
        eventId: event.id,
        privateToken: res.privateToken,
        fullName,
        namePreference: namePref,
        email,
        phone,
        rollNumber,
        isIeeeMember,
        ieeeMembershipNumber: ieeeNumber || undefined,
        department,
        photoConsent,
        status: res.status || (event.feePkr > 0 ? "PAYMENT_PENDING" : "CONFIRMED"),
        ticketCode: res.ticketCode,
        createdAt: new Date().toISOString(),
      };

      // If paid event and transaction ID provided
      if (event.feePkr > 0 && txId.trim() && res.privateToken) {
        try {
          await submitPaymentAction({
            privateToken: res.privateToken,
            method: paymentMethod,
            transactionId: txId.trim(),
            proofPath: "event-form",
          });
        } catch (payErr: any) {
          console.warn("Payment auto-submit warning:", payErr);
        }
      }

      setConfirmedReg(newReg);
    } catch (err: any) {
      alert("Registration failed: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="w-10 h-10 border-4 border-ieee-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex-1 max-w-3xl mx-auto py-20 px-4 text-center space-y-4">
        <h1 className="text-2xl font-bold font-montserrat text-ieee-navy">
          Event Not Found
        </h1>
        <p className="text-sm text-gray-600">
          The requested event URL does not match any current or archived event.
        </p>
        <Button href="/events" variant="primary">
          Back to Events List
        </Button>
      </div>
    );
  }

  const isPostponed = event.status === "POSTPONED";
  const isCancelled = event.status === "CANCELLED";
  const isCompleted = event.status === "COMPLETED";
  const isUpcoming = event.status === "UPCOMING";

  return (
    <div className="flex-1 bg-gray-50 py-10 md:py-16 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Breadcrumb & vTools Link */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-gray-500">
            <Link href="/" className="hover:text-ieee-blue">Home</Link>
            <span>/</span>
            <Link href="/events" className="hover:text-ieee-blue">Events</Link>
            <span>/</span>
            <span className="text-ieee-navy font-semibold truncate max-w-xs">{event.title}</span>
          </div>

          {event.vtoolsLink && (
            <a
              href={event.vtoolsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-ieee-blue hover:text-ieee-navy font-semibold transition-colors"
            >
              Official IEEE vTools Event Listing <ExternalLink size={12} />
            </a>
          )}
        </div>

        {/* Postponed / Cancelled Alert Banner */}
        {(isPostponed || isCancelled) && (
          <div
            className={`p-5 rounded-card border flex items-start gap-3 ${
              isPostponed
                ? "bg-[#FEF3D6] border-[#FAD79A] text-[#B45309]"
                : "bg-[#FCE8E6] border-[#F5C2BE] text-[#BA0C2F]"
            }`}
          >
            <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-montserrat font-bold text-sm">
                Event Notice: {event.status}
              </h3>
              <p className="text-xs leading-relaxed">
                {event.statusReason || "Administrative schedule alteration."}
              </p>
            </div>
          </div>
        )}

        {/* Main Event Header Card */}
        <div className="bg-white border border-ieee-border rounded-card overflow-hidden shadow-sm">
          <div className="relative min-h-[16rem] sm:min-h-[22rem] w-full bg-ieee-navy overflow-hidden flex items-center justify-center">
            {event.featuredImage ? (
              <img
                src={event.featuredImage}
                alt={event.title}
                className="w-full h-full max-h-[32rem] object-cover"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  if (!target.src.includes("ieee-cs-logo.png")) {
                    target.src = "/ieee-cs-logo.png";
                    target.className = "w-48 h-48 object-contain p-4 opacity-80";
                  }
                }}
              />
            ) : (
              <img
                src="/ieee-cs-logo.png"
                alt={event.title}
                className="w-48 h-48 object-contain p-4 opacity-80"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />
            <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
              <div className="flex items-center gap-2">
                <Badge status={event.status} />
                <span className="text-xs bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white font-medium border border-white/20">
                  {event.feePkr > 0 ? `Fee: PKR ${event.feePkr}` : "Free Admission"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-montserrat font-extrabold leading-tight text-white drop-shadow-md">
                {event.title}
              </h1>
            </div>
          </div>

          {/* Quick Info Bar */}
          <div className="p-6 bg-ieee-surfaceTint/30 border-b border-ieee-border grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="flex items-center gap-2.5 text-gray-700">
              <Calendar size={18} className="text-ieee-blue flex-shrink-0" />
              <div>
                <span className="block font-semibold text-ieee-navy">Date & Time (PKT)</span>
                <span>{formatPKTDateTime(event.startDate)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-gray-700">
              <MapPin size={18} className="text-ieee-blue flex-shrink-0" />
              <div>
                <span className="block font-semibold text-ieee-navy">Venue</span>
                <span>{event.venue}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-gray-700">
              <Award size={18} className="text-ieee-blue flex-shrink-0" />
              <div>
                <span className="block font-semibold text-ieee-navy">Certificate Type</span>
                <span>{event.certificateType}</span>
              </div>
            </div>
          </div>

          {/* Event Content & Registration Layout */}
          <div className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left 2 Columns: Description & Details */}
            <div className="lg:col-span-2 space-y-8">
              <div className="space-y-3">
                <h2 className="text-xl font-montserrat font-bold text-ieee-navy">
                  About This Event
                </h2>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              </div>

              {/* Learning Objectives */}
              {Array.isArray(event.learningObjectives) && event.learningObjectives.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-montserrat font-bold text-ieee-navy">
                    Key Learning Objectives
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {event.learningObjectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle size={16} className="text-status-active flex-shrink-0 mt-0.5" />
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Target Audience */}
              {event.targetAudience && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-gray-900 uppercase tracking-wider block">
                    Intended Audience:
                  </span>
                  <p className="text-gray-600">{event.targetAudience}</p>
                </div>
              )}

              {/* Certificate Eligibility Rule */}
              <div className="p-5 bg-[#E6F4EA]/50 border border-[#A8DAB5] rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-montserrat font-bold text-[#00843D] uppercase tracking-wider">
                  <ShieldCheck size={16} /> Official Certificate Eligibility Criterion
                </div>
                <p className="text-xs text-gray-800 font-medium leading-relaxed">
                  {event.certificateRule}
                </p>
                <p className="text-[11px] text-gray-500 italic">
                  Note: Chapter recognition certificates are awarded only to participants
                  who satisfy the exact criterion published prior to registration.
                </p>
              </div>

              {/* Speakers Section */}
              {Array.isArray(event.speakers) && event.speakers.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-montserrat font-bold text-ieee-navy">
                    Distinguished Speaker & Mentor
                  </h3>
                  <div className="space-y-4">
                    {event.speakers.map((spk, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row gap-4 items-start"
                      >
                        <div className="w-12 h-12 rounded-full bg-ieee-surfaceTint flex items-center justify-center font-montserrat font-bold text-ieee-blue text-sm flex-shrink-0">
                          {spk.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-montserrat font-bold text-sm text-gray-900">
                            {spk.name}
                          </h4>
                          <span className="text-xs text-ieee-blue font-semibold block">
                            {spk.role}
                          </span>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {spk.bio}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Event Post-Event Report & Gallery */}
              {isCompleted && (
                <div className="space-y-6 pt-6 border-t border-gray-200">
                  <div className="space-y-3">
                    <h3 className="text-lg font-montserrat font-bold text-ieee-navy">
                      Event Summary Report
                    </h3>
                    <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700 leading-relaxed space-y-2">
                      <p>{event.eventReport || "Official post-event report registered."}</p>
                      <p className="text-ieee-muted font-mono text-[11px]">
                        vTools Meeting (L31) report successfully filed.
                      </p>
                    </div>
                  </div>

                  {/* Event Photo Gallery */}
                  <div className="space-y-4 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Camera size={18} className="text-ieee-blue" />
                          <h4 className="font-montserrat font-bold text-base text-ieee-navy">
                            Event Photo Gallery
                          </h4>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Visual moments, hands-on lab training, and recognition ceremonies.
                        </p>
                      </div>
                      {Array.isArray(event.galleryImages) && event.galleryImages.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono bg-blue-50 text-ieee-blue font-semibold px-2.5 py-1 rounded-full border border-blue-200 shadow-xs">
                            {event.galleryImages.length} Official Photos
                          </span>
                          <Link
                            href="/admin/events"
                            className="text-[11px] font-montserrat font-semibold text-gray-400 hover:text-ieee-blue hover:underline hidden sm:inline"
                          >
                            Manage Photos
                          </Link>
                        </div>
                      )}
                    </div>

                    {Array.isArray(event.galleryImages) && event.galleryImages.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {event.galleryImages.map((img, i) => (
                          <div
                            key={i}
                            onClick={() => setActivePhotoIndex(i)}
                            className="group relative h-48 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer"
                          >
                            <img
                              src={img}
                              alt={`${event.title} - Session Snapshot #${i + 1}`}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3.5 text-white">
                              <div className="self-end bg-black/40 backdrop-blur-xs p-1.5 rounded-full">
                                <ZoomIn size={16} />
                              </div>
                              <div>
                                <span className="text-[10px] uppercase font-bold tracking-wider text-ieee-cyan block">
                                  {event.title}
                                </span>
                                <span className="text-xs font-semibold">
                                  Official Photo #{i + 1}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 border border-dashed border-gray-300 rounded-xl text-center bg-gray-50/50 space-y-2">
                        <Camera className="mx-auto text-gray-400" size={28} />
                        <p className="text-xs font-montserrat font-semibold text-gray-600">
                          No event gallery photos uploaded yet.
                        </p>
                        <p className="text-[11px] text-gray-400">
                          Session snapshots and ceremonies will be displayed here once posted by the Chapter Administrator.
                        </p>
                      </div>
                    )}
                    {event.galleryImages && event.galleryImages.length > 0 && (
                      <p className="text-[11px] text-gray-400 italic">
                        Click any photograph to view high-resolution fullscreen preview.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Option 2 Registration & Ticket Flow */}
            <div className="space-y-6">
              {isUpcoming ? (
                confirmedReg ? (
                  /* Success Confirmation Box */
                  <div className="bg-[#E6F4EA] border border-[#A8DAB5] rounded-card p-6 space-y-4">
                    <div className="flex items-center gap-2 text-status-active">
                      <CheckCircle size={22} />
                      <h3 className="font-montserrat font-bold text-base">
                        Registration Received!
                      </h3>
                    </div>

                    <p className="text-xs text-gray-700 leading-relaxed">
                      Thank you, <strong>{confirmedReg.fullName}</strong>. Your registration
                      has been logged under the IEEE CS UCET-IUB event registry.
                    </p>

                    <div className="p-3 bg-white rounded-lg border border-[#A8DAB5] text-xs font-mono space-y-1">
                      <span className="text-gray-500 block text-[10px] font-sans">
                        Digital Ticket Code:
                      </span>
                      <span className="font-bold text-ieee-navy text-sm">
                        {confirmedReg.ticketCode}
                      </span>
                    </div>

                    {confirmedReg.status === "PAYMENT_PENDING" ? (
                      <div className="p-3 bg-[#FEF3D6] border border-[#FAD79A] rounded-lg text-xs text-[#B45309]">
                        <strong>Payment Under Verification:</strong> The chapter Treasurer is
                        reconciling your transaction proof. You will receive an updated status
                        shortly.
                      </div>
                    ) : (
                      <div className="p-3 bg-white/70 rounded-lg text-xs text-gray-700">
                        Present this ticket code or QR code during event check-in at the venue.
                      </div>
                    )}

                    <Button
                      onClick={() => setConfirmedReg(null)}
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                    >
                      Register Another Person
                    </Button>
                  </div>
                ) : (
                  /* Option 2 Guest Sign-up Form (No student account required) */
                  <div className="bg-white border border-ieee-border rounded-card p-6 shadow-sm space-y-4">
                    <div className="border-b border-gray-100 pb-3">
                      <h3 className="font-montserrat font-bold text-base text-ieee-navy">
                        Event Registration
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        No chapter account needed. Simply provide your attendee details.
                      </p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">
                          Full Name (as to appear on certificate) *
                        </label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Muhammad Roshan Ashraf"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-semibold text-gray-700 mb-1">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-gray-700 mb-1">
                            Phone / WhatsApp *
                          </label>
                          <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="0300-1234567"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-semibold text-gray-700 mb-1">
                            Student Roll Number
                          </label>
                          <input
                            type="text"
                            value={rollNumber}
                            onChange={(e) => setRollNumber(e.target.value)}
                            placeholder="e.g. FA23-BCS-001"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-gray-700 mb-1">
                            Department
                          </label>
                          <select
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none bg-white"
                          >
                            <option value="Computer Science">Computer Science</option>
                            <option value="Software Engineering">Software Engineering</option>
                            <option value="Electrical Engineering">Electrical Engineering</option>
                            <option value="Information Technology">Information Technology</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      {/* Name display consent preference */}
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">
                          Public Verification Name Format
                        </label>
                        <select
                          value={namePref}
                          onChange={(e) => setNamePref(e.target.value as any)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none bg-white"
                        >
                          <option value="FULL_NAME">Display Full Name (Recommended)</option>
                          <option value="FIRST_INITIAL">First Name + Initial Only</option>
                        </select>
                      </div>

                      {/* IEEE Member checkbox */}
                      <div className="pt-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isIeeeMember}
                            onChange={(e) => setIsIeeeMember(e.target.checked)}
                            className="rounded text-ieee-blue focus:ring-0"
                          />
                          <span className="text-gray-700">I am an active global IEEE / IEEE CS Member</span>
                        </label>

                        {isIeeeMember && (
                          <input
                            type="text"
                            value={ieeeNumber}
                            onChange={(e) => setIeeeNumber(e.target.value)}
                            placeholder="Enter 8-digit IEEE Member Number"
                            className="w-full mt-2 px-3 py-2 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none"
                          />
                        )}
                      </div>

                      {/* Payment Section if fee > 0 */}
                      {event.feePkr > 0 && (
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                          <div className="font-bold text-gray-900 flex justify-between">
                            <span>Workshop Fee:</span>
                            <span className="text-ieee-blue">PKR {event.feePkr}</span>
                          </div>
                          <p className="text-[11px] text-gray-600">
                            {event.paymentInstructions}
                          </p>

                          <div>
                            <label className="block font-semibold text-gray-700 mb-1">
                              Payment Method *
                            </label>
                            <select
                              value={paymentMethod}
                              onChange={(e) => setPaymentMethod(e.target.value as any)}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none bg-white"
                            >
                              <option value="Raast">Raast (0% fee)</option>
                              <option value="Bank Transfer">Bank Transfer (Bank Alfalah)</option>
                              <option value="EasyPaisa / JazzCash">EasyPaisa / JazzCash</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-semibold text-gray-700 mb-1">
                              Transaction Reference ID *
                            </label>
                            <input
                              type="text"
                              required
                              value={txId}
                              onChange={(e) => setTxId(e.target.value)}
                              placeholder="e.g. RAAST-TX-883921"
                              className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {/* Consents */}
                      <div className="space-y-1.5 pt-1 text-[11px] text-gray-600">
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={photoConsent}
                            onChange={(e) => setPhotoConsent(e.target.checked)}
                            className="rounded mt-0.5"
                          />
                          <span>I consent to event group photography for chapter reports</span>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={privacyConsent}
                            onChange={(e) => setPrivacyConsent(e.target.checked)}
                            required
                            className="rounded mt-0.5"
                          />
                          <span>I agree to chapter data processing under GDPR-standard privacy</span>
                        </label>
                      </div>

                      <Button type="submit" variant="primary" size="md" className="w-full">
                        Complete Registration
                      </Button>
                    </form>
                  </div>
                )
              ) : (
                /* Non-upcoming event status block */
                <div className="bg-white border border-ieee-border rounded-card p-6 shadow-sm space-y-3 text-xs">
                  <h3 className="font-montserrat font-bold text-sm text-ieee-navy">
                    Registration Closed
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    This event is currently {event.status.toLowerCase()}. Registrations are no longer being accepted.
                  </p>
                  <Button href="/events" variant="outline" size="sm" className="w-full">
                    Browse Other Events
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fullscreen Lightbox Modal */}
        {activePhotoIndex !== null && event.galleryImages && event.galleryImages.length > 0 && (
          (() => {
            const currentPhotos = event.galleryImages;
            const activeUrl = currentPhotos[activePhotoIndex] || currentPhotos[0];

            return (
              <div
                className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 select-none"
                onClick={() => setActivePhotoIndex(null)}
              >
                {/* Top Bar */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-20">
                  <div className="text-xs font-montserrat font-semibold">
                    <span className="text-blue-300">{event.title}</span> &bull; Snapshot {activePhotoIndex + 1} of {currentPhotos.length}
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={activeUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink size={14} /> Open Full Size
                    </a>
                    <button
                      onClick={() => setActivePhotoIndex(null)}
                      className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Left Arrow */}
                {currentPhotos.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePhotoIndex((activePhotoIndex - 1 + currentPhotos.length) % currentPhotos.length);
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors z-20"
                    aria-label="Previous Photo"
                  >
                    <ChevronLeft size={24} />
                  </button>
                )}

                {/* Image */}
                <div
                  className="max-w-4xl max-h-[80vh] w-full flex items-center justify-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={activeUrl}
                    alt={`${event.title} snapshot ${activePhotoIndex + 1}`}
                    className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl"
                  />
                </div>

                {/* Right Arrow */}
                {currentPhotos.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePhotoIndex((activePhotoIndex + 1) % currentPhotos.length);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors z-20"
                    aria-label="Next Photo"
                  >
                    <ChevronRight size={24} />
                  </button>
                )}

                {/* Bottom Navigation hint */}
                <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-300 font-openSans px-4">
                  Press <kbd className="px-1.5 py-0.5 bg-white/20 rounded text-[10px]">Esc</kbd> to close &bull; Click outside to dismiss
                </div>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}
