"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { db } from "@/lib/db";
import { getSupabase } from "@/lib/supabase";
import { saveEventAction, deleteEventAction } from "@/app/actions/events";
import { EventItem, EventStatus } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  CalendarPlus,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  AlertTriangle,
  X,
  Search,
  Filter,
  Camera,
  UploadCloud,
  Image as ImageIcon,
} from "lucide-react";

// Helper to compress images client-side before setting state or uploading
const compressImageFile = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (readerEvt) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1600;
        const maxHeight = 1600;
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        } else {
          resolve((readerEvt.target?.result as string) || "");
        }
      };
      img.onerror = () => resolve((readerEvt.target?.result as string) || "");
      img.src = (readerEvt.target?.result as string) || "";
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
};

const uploadImageFile = async (file: File, folder: string = "events"): Promise<string> => {
  try {
    const client = getSupabase();
    if (client) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const cleanPath = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { data, error } = await client.storage
        .from("public-media")
        .upload(cleanPath, file, { cacheControl: "3600", upsert: true });
      if (!error && data) {
        const { data: pubData } = client.storage.from("public-media").getPublicUrl(cleanPath);
        if (pubData?.publicUrl) {
          return pubData.publicUrl;
        }
      }
    }
  } catch (err) {
    console.warn("Storage upload notice:", err);
  }
  return await compressImageFile(file);
};

export default function AdminEventsManagerPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<EventStatus>("UPCOMING");
  const [statusReason, setStatusReason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [venue, setVenue] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [meetingLink, setMeetingLink] = useState("");
  const [feePkr, setFeePkr] = useState(0);
  const [seatsLimit, setSeatsLimit] = useState(60);
  const [certificateType, setCertificateType] = useState("Certificate of Participation");
  const [certificateRule, setCertificateRule] = useState("Minimum 80% physical attendance verified via digital check-in");
  const [featuredImage, setFeaturedImage] = useState("");
  const [learningObjectives, setLearningObjectives] = useState("");
  const [eventReport, setEventReport] = useState("");
  const [galleryImages, setGalleryImages] = useState("");

  const refreshEvents = async () => {
    const live = await db.fetchEvents();
    setEvents(live);
  };

  useEffect(() => {
    refreshEvents();
  }, []);

  const openCreateModal = () => {
    setEditingEventId(null);
    setModalError(null);
    setTitle("");
    setSlug(`2026/event-${Date.now().toString().slice(-4)}`);
    setDescription("");
    setStatus("UPCOMING");
    setStatusReason("");
    const now = new Date();
    const later = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const toLocalISO = (d: Date) => {
      const pad = (n: number) => n.toString().padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    setStartDate(toLocalISO(now));
    setEndDate(toLocalISO(later));
    setVenue("Syed Tabish Alwari Auditorium, UCET IUB");
    setIsOnline(false);
    setMeetingLink("");
    setFeePkr(0);
    setSeatsLimit(60);
    setCertificateType("Certificate of Participation");
    setCertificateRule("Minimum 80% physical attendance verified via digital check-in");
    setFeaturedImage("/ieee-cs-logo.png");
    setLearningObjectives("Core technical hands-on skills\nIndustry relevant workflows\nOfficial IEEE certification");
    setEventReport("");
    setGalleryImages("");
    setIsModalOpen(true);
  };

  const openEditModal = (event: EventItem) => {
    setEditingEventId(event.id);
    setModalError(null);
    setTitle(event.title || "");
    setSlug(event.slug || "");
    setDescription(event.description || "");
    setStatus(event.status || "UPCOMING");
    setStatusReason(event.statusReason || "");
    setStartDate(event.startDate ? event.startDate.slice(0, 16) : "");
    setEndDate(event.endDate ? event.endDate.slice(0, 16) : "");
    setVenue(event.venue || "");
    setIsOnline(Boolean(event.isOnline));
    setMeetingLink(event.meetingLink || "");
    setFeePkr(Number(event.feePkr) || 0);
    setSeatsLimit(Number(event.seatsLimit) || 60);
    setCertificateType(event.certificateType || "Certificate of Participation");
    setCertificateRule(event.certificateRule || "Minimum 80% physical attendance verified via digital check-in");
    setFeaturedImage(event.featuredImage || "/ieee-cs-logo.png");
    setLearningObjectives(
      Array.isArray(event.learningObjectives)
        ? event.learningObjectives.filter(Boolean).map((s) => String(s || "").trim()).join("\n")
        : (typeof event.learningObjectives === "string" ? event.learningObjectives : "")
    );
    setEventReport(event.eventReport || "");
    setGalleryImages(
      Array.isArray(event.galleryImages)
        ? event.galleryImages.filter(Boolean).map((s) => String(s || "").trim()).join("\n")
        : (typeof event.galleryImages === "string" ? event.galleryImages : "")
    );
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = (title || "").trim();
    const cleanSlugInput = (slug || "").trim();
    if (!cleanTitle || !cleanSlugInput) {
      setModalError("Please enter title and slug.");
      return;
    }

    setIsSaving(true);
    setModalError(null);

    try {
      const objectives = (typeof learningObjectives === "string" ? learningObjectives : "")
        .split("\n")
        .map((s) => (s ? String(s).trim() : ""))
        .filter(Boolean);

      const gallery = (typeof galleryImages === "string" ? galleryImages : "")
        .split("\n")
        .map((s) => (s ? String(s).trim() : ""))
        .filter(Boolean);

      const cleanSlug = cleanSlugInput
        .replace(/^\/+/, "")
        .replace(/\/+$/, "")
        .replace(/\s+/g, "-")
        .toLowerCase();

      let safeStart = new Date().toISOString();
      let safeEnd = new Date(Date.now() + 86400000).toISOString();
      try {
        if (startDate) safeStart = new Date(startDate).toISOString();
        if (endDate) safeEnd = new Date(endDate).toISOString();
      } catch {}

      const cleanVenue = (venue || "").trim() || "UCET IUB";
      const cleanMeetingLink = (meetingLink || "").trim();
      const cleanStatusReason = (statusReason || "").trim();
      const cleanCertType = (certificateType || "").trim() || "Certificate of Participation";
      const cleanCertRule = (certificateRule || "").trim() || "Minimum 80% physical attendance verified via digital check-in";
      const cleanFeaturedImage = (featuredImage || "").trim() || "/ieee-cs-logo.png";
      const cleanEventReport = (eventReport || "").trim();

      const eventPayload: EventItem = {
        id: editingEventId || `evt-${Date.now()}`,
        slug: cleanSlug,
        title: cleanTitle,
        description: (description || "").trim(),
        learningObjectives: objectives,
        startDate: safeStart,
        endDate: safeEnd,
        venue: cleanVenue,
        isOnline: Boolean(isOnline),
        meetingLink: isOnline ? (cleanMeetingLink || undefined) : undefined,
        status,
        statusReason: cleanStatusReason || undefined,
        seatsLimit: Number(seatsLimit) || 60,
        feePkr: Number(feePkr) || 0,
        paymentInstructions: feePkr > 0 ? "Transfer fee via Raast (ID: 0300-1234567) or Bank Alfalah and upload receipt." : undefined,
        certificateType: cleanCertType,
        certificateRule: cleanCertRule,
        featuredImage: cleanFeaturedImage,
        galleryImages: gallery.length > 0 ? gallery : undefined,
        eventReport: cleanEventReport || undefined,
      };

      // Save directly to live PostgreSQL database via Server Action with direct client RPC fallback
      let result: any = null;
      try {
        result = await saveEventAction({
          ...eventPayload,
          id: editingEventId || undefined,
        });
      } catch (saErr: any) {
        console.warn("Server action issue, trying direct RPC fallback:", saErr);
      }

      // Direct client-side RPC fallback if Server Action had flight payload error
      if (!result || !result.success) {
        const client = getSupabase();
        if (client) {
          const { data: rpcData, error: rpcErr } = await client.rpc("save_event", {
            event_data: {
              ...eventPayload,
              id: editingEventId || undefined,
            },
          });
          if (!rpcErr && rpcData?.success) {
            result = { success: true, event: rpcData.event };
          }
        }
      }

      if (!result || !result.success) {
        setModalError(result?.error || "Failed to save event to database.");
        return;
      }

      // Keep local in-memory view synced
      if (editingEventId) {
        db.updateEvent(editingEventId, eventPayload);
      } else {
        db.addEvent(eventPayload);
      }

      db.addAuditLog(
        "Muhammad Roshan Ashraf",
        editingEventId ? "EVENT_UPDATED" : "EVENT_CREATED",
        "events",
        eventPayload.id,
        `${editingEventId ? "Updated" : "Created"} event "${title}" with status "${status}".`
      );

      setIsModalOpen(false);
      await refreshEvents();
      alert(`Event "${title}" ${editingEventId ? "updated" : "published"} successfully to live database!`);
    } catch (err: any) {
      console.error("Save event failed:", err);
      setModalError(err?.message || "Failed to save event to database. Please check required fields.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async (event: EventItem) => {
    if (confirm(`Are you sure you want to delete event "${event.title}"?`)) {
      try {
        await deleteEventAction(event.id);
      } catch (err) {
        console.warn("Server action delete error:", err);
      }
      const client = getSupabase();
      if (client) {
        try {
          await client.rpc("delete_event", { p_event_id: event.id });
        } catch {}
      }
      db.deleteEvent(event.id);
      db.addAuditLog(
        "Muhammad Roshan Ashraf",
        "EVENT_DELETED",
        "events",
        event.id,
        `Deleted event "${event.title}".`
      );
      await refreshEvents();
    }
  };

  const handleQuickStatusChange = async (eventId: string, newStatus: EventStatus) => {
    try {
      const existing = events.find((e) => e.id === eventId);
      if (existing) {
        await saveEventAction({ ...existing, status: newStatus });
      }
    } catch (err) {
      console.warn("Quick status change error:", err);
    }
    db.updateEvent(eventId, { status: newStatus });
    await refreshEvents();
  };

  // Filtered Events
  const filteredEvents = events.filter((e) => {
    const matchesTab = activeTab === "ALL" || e.status === activeTab;
    const eventTitle = (e.title || "").toLowerCase();
    const eventVenue = (e.venue || "").toLowerCase();
    const eventSlug = (e.slug || "").toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      eventTitle.includes(search) ||
      eventVenue.includes(search) ||
      eventSlug.includes(search);
    return matchesTab && matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="space-y-8 font-openSans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-montserrat font-bold text-ieee-blue uppercase tracking-wider">
              <CalendarPlus size={16} /> Chapter Event Administration
            </div>
            <h1 className="text-2xl sm:text-3xl font-montserrat font-extrabold text-ieee-navy mt-1">
              Events Manager (Past, Ongoing & Upcoming)
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Create, edit, and organize all chapter technical events, workshops, seminars, and past archives.
            </p>
          </div>

          <Button
            onClick={openCreateModal}
            variant="accent"
            className="flex items-center gap-2 self-start shadow-md"
          >
            <Plus size={16} /> Create New Event
          </Button>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="bg-white border border-gray-200 rounded-card p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {[
              { id: "ALL", label: "All Events" },
              { id: "UPCOMING", label: "Upcoming" },
              { id: "ONGOING", label: "Ongoing" },
              { id: "COMPLETED", label: "Past / Completed" },
              { id: "POSTPONED", label: "Postponed" },
              { id: "CANCELLED", label: "Cancelled" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-montserrat font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-ieee-navy text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search size={14} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search title, venue, slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-ieee-blue"
            />
          </div>
        </div>

        {/* Events Table / List */}
        <div className="bg-white border border-gray-200 rounded-card overflow-hidden shadow-sm">
          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-xs">
              No events found matching the criteria. Click "Create New Event" to add one!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 font-montserrat font-bold text-gray-600 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-4">Event Details</th>
                    <th className="p-4">Schedule & Venue</th>
                    <th className="p-4">Fee & Cert</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredEvents.map((evt) => (
                    <tr key={evt.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-4 max-w-sm">
                        <div className="font-montserrat font-bold text-ieee-navy text-sm">
                          {evt.title}
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                          Slug: /{evt.slug}
                        </div>
                        <p className="text-gray-600 line-clamp-1 mt-1 text-[11px]">
                          {evt.description}
                        </p>
                      </td>

                      <td className="p-4 text-gray-700 space-y-1">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Calendar size={13} className="text-ieee-blue" />
                          <span>{new Date(evt.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <MapPin size={13} className="text-ieee-orange" />
                          <span className="truncate max-w-[200px]">{evt.venue}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-gray-800">
                          {evt.feePkr > 0 ? `PKR ${evt.feePkr}` : "Free"}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {evt.certificateType}
                        </div>
                      </td>

                      <td className="p-4">
                        <select
                          value={evt.status}
                          onChange={(e) => handleQuickStatusChange(evt.id, e.target.value as EventStatus)}
                          className="text-xs font-semibold rounded px-2 py-1 border border-gray-200 focus:outline-none bg-white font-montserrat"
                        >
                          <option value="UPCOMING">Upcoming</option>
                          <option value="ONGOING">Ongoing</option>
                          <option value="COMPLETED">Completed (Past)</option>
                          <option value="POSTPONED">Postponed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/events/${evt.slug}`}
                            target="_blank"
                            className="p-1.5 text-gray-500 hover:text-ieee-blue hover:bg-gray-100 rounded transition-colors"
                            title="View Public Page"
                          >
                            <ExternalLink size={15} />
                          </Link>
                          <button
                            onClick={() => openEditModal(evt)}
                            className="p-1.5 text-gray-600 hover:text-ieee-navy hover:bg-gray-100 rounded transition-colors"
                            title="Edit Event"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(evt)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            title="Delete Event"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create / Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-card max-w-2xl w-full shadow-2xl border border-gray-200 p-6 md:p-8 space-y-6 my-8">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="font-montserrat font-extrabold text-xl text-ieee-navy">
                    {editingEventId ? "Edit Event" : "Create New Chapter Event"}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Configure details for past, upcoming, or ongoing chapter programs.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
                {modalError && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-red-500 shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}
                {/* Title & Slug */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Event Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        if (!editingEventId) {
                          const autoSlug = e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/(^-|-$)+/g, "");
                          setSlug(`2026/${autoSlug}`);
                        }
                      }}
                      placeholder="e.g. Hands-on Modern AI Agent Development"
                      className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      URL Slug * (Permanent link)
                    </label>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="2026/hands-on-ai-agents"
                      className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Status & Status Reason */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Event Status *
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as EventStatus)}
                      className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none bg-white font-montserrat font-semibold"
                    >
                      <option value="UPCOMING">Upcoming</option>
                      <option value="ONGOING">Ongoing</option>
                      <option value="COMPLETED">Completed (Past Event)</option>
                      <option value="POSTPONED">Postponed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Status Note / Notice (Optional)
                    </label>
                    <input
                      type="text"
                      value={statusReason}
                      onChange={(e) => setStatusReason(e.target.value)}
                      placeholder="e.g. Rescheduled due to university midterms"
                      className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Event Overview & Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a comprehensive summary of the event curriculum, speakers, and hands-on activities."
                    className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Start Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      End Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none"
                    />
                  </div>
                </div>

                {/* Venue & Online Mode */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-gray-700 mb-1">
                      Venue / Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      placeholder="e.g. Syed Tabish Alwari Auditorium, UCET IUB"
                      className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Fee (PKR)
                    </label>
                    <input
                      type="number"
                      value={feePkr}
                      onChange={(e) => setFeePkr(Number(e.target.value))}
                      placeholder="0 for free"
                      className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none"
                    />
                  </div>
                </div>

                {/* Certificate Type & Rule */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Certificate Type
                    </label>
                    <input
                      type="text"
                      value={certificateType}
                      onChange={(e) => setCertificateType(e.target.value)}
                      placeholder="Certificate of Participation / Completion"
                      className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Eligibility Rule
                    </label>
                    <input
                      type="text"
                      value={certificateRule}
                      onChange={(e) => setCertificateRule(e.target.value)}
                      placeholder="Minimum 80% physical attendance"
                      className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none"
                    />
                  </div>
                </div>

                {/* Featured Cover Image */}
                <div className="space-y-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className="block font-semibold text-gray-700">
                      Featured Cover Image (Banner / Poster)
                    </label>
                    <label className="cursor-pointer inline-flex items-center gap-1 text-xs text-ieee-blue hover:underline font-semibold">
                      <UploadCloud size={14} /> {isUploadingBanner ? "Optimizing & Uploading..." : "Upload Banner Image"}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingBanner}
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsUploadingBanner(true);
                          try {
                            const uploadedUrl = await uploadImageFile(file, "banners");
                            if (uploadedUrl) {
                              setFeaturedImage(uploadedUrl);
                            }
                          } catch (upErr) {
                            console.error("Banner upload error:", upErr);
                          } finally {
                            setIsUploadingBanner(false);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={featuredImage || ""}
                    onChange={(e) => setFeaturedImage(e.target.value)}
                    placeholder="Enter image URL, /ieee-cs-logo.png, or upload file"
                    className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none text-xs font-mono bg-white"
                  />
                  {featuredImage && (
                    <div className="flex items-center gap-3 pt-1">
                      <div className="relative h-16 w-28 rounded-lg overflow-hidden border border-gray-300 bg-gray-100 flex-shrink-0">
                        <img src={featuredImage} alt="Cover Preview" className="w-full h-full object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setFeaturedImage("/ieee-cs-logo.png")}
                        className="text-[11px] text-gray-600 hover:underline font-semibold"
                      >
                        Reset to Default Logo
                      </button>
                    </div>
                  )}
                </div>

                {/* Learning Objectives */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Learning Objectives (One per line)
                  </label>
                  <textarea
                    rows={2}
                    value={learningObjectives || ""}
                    onChange={(e) => setLearningObjectives(e.target.value)}
                    placeholder="Key hands-on takeaway 1&#10;Key hands-on takeaway 2"
                    className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none"
                  />
                </div>

                {/* Event Summary Report (Especially for Completed Events) */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Event Summary / Post-Event Report (Displayed on completed event page)
                  </label>
                  <textarea
                    rows={2}
                    value={eventReport || ""}
                    onChange={(e) => setEventReport(e.target.value)}
                    placeholder="The workshop concluded successfully with 50 attendees. Keynote address and certificates distributed."
                    className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none"
                  />
                </div>

                {/* Event Photo Gallery Images */}
                <div className="space-y-2 p-3.5 bg-blue-50/40 rounded-xl border border-blue-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="block font-bold text-ieee-navy text-xs flex items-center gap-1.5">
                      <Camera size={14} className="text-ieee-blue" />
                      Event Photo Gallery Images (Displayed in the Photo Gallery section on this event's page)
                    </label>
                    <div className="flex items-center gap-2">
                      {galleryImages && (
                        <button
                          type="button"
                          onClick={() => setGalleryImages("")}
                          className="text-[10px] text-red-500 hover:underline font-semibold"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    value={galleryImages || ""}
                    onChange={(e) => setGalleryImages(e.target.value)}
                    placeholder="https://example.com/photo1.jpg&#10;https://example.com/photo2.jpg"
                    className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none font-mono text-[11px] bg-white"
                  />

                  {/* Upload from Local Device */}
                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                    <span>Or upload image files from your computer:</span>
                    <label className="cursor-pointer inline-flex items-center gap-1 text-xs text-ieee-blue hover:underline font-semibold">
                      <UploadCloud size={14} /> {isUploadingGallery ? "Processing photos..." : "Choose Files"}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={isUploadingGallery}
                        className="hidden"
                        onChange={async (e) => {
                          const files = e.target.files;
                          if (!files || files.length === 0) return;
                          setIsUploadingGallery(true);
                          try {
                            const urls: string[] = [];
                            for (const file of Array.from(files)) {
                              const uploadedUrl = await uploadImageFile(file, "gallery");
                              if (uploadedUrl) urls.push(uploadedUrl);
                            }
                            if (urls.length > 0) {
                              setGalleryImages((prev) => {
                                const current = (prev || "").trim();
                                const additions = urls.join("\n");
                                return current ? `${current}\n${additions}` : additions;
                              });
                            }
                          } catch (upErr) {
                            console.error("Gallery upload error:", upErr);
                          } finally {
                            setIsUploadingGallery(false);
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Live Thumbnails Preview */}
                  {(() => {
                    const parsed = (typeof galleryImages === "string" ? galleryImages : "")
                      .split("\n")
                      .map((s) => (s ? String(s).trim() : ""))
                      .filter(Boolean);
                    if (parsed.length === 0) return null;

                    return (
                      <div className="pt-2">
                        <span className="text-[10px] font-semibold text-gray-600 block mb-1">
                          Previewing {parsed.length} Photos for this event:
                        </span>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                          {parsed.map((imgUrl, idx) => (
                            <div key={idx} className="relative group h-14 rounded-lg overflow-hidden border border-gray-300 bg-gray-100">
                              <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = parsed.filter((_, i) => i !== idx).join("\n");
                                  setGalleryImages(updated);
                                }}
                                className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove photo"
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Submit Buttons */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-montserrat font-semibold text-xs tracking-wide bg-ieee-blue text-white hover:bg-ieee-navy focus:ring-2 focus:ring-ieee-blue shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
                  >
                    {isSaving ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{editingEventId ? "Saving..." : "Publishing Event..."}</span>
                      </>
                    ) : editingEventId ? (
                      "Save Changes"
                    ) : (
                      "Publish Event"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}