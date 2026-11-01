"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { db } from "@/lib/db";
import { saveEventAction, deleteEventAction } from "@/app/actions/events";
import { EventItem, EventStatus, EventTeam } from "@/types";
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
  Trophy,
  FileSpreadsheet,
  Sparkles,
} from "lucide-react";

export default function AdminEventsManagerPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

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

  // Teams & Projects Modal State
  const [isTeamsModalOpen, setIsTeamsModalOpen] = useState(false);
  const [selectedEventForTeams, setSelectedEventForTeams] = useState<EventItem | null>(null);
  const [eventTeamsList, setEventTeamsList] = useState<EventTeam[]>([]);
  const [teamsTab, setTeamsTab] = useState<"LIST" | "IMPORT" | "ADD">("LIST");
  const [importPastedText, setImportPastedText] = useState("");
  const [importResult, setImportResult] = useState<string | null>(null);
  const [singleTeamName, setSingleTeamName] = useState("");
  const [singleProjectTitle, setSingleProjectTitle] = useState("");
  const [singleLeader, setSingleLeader] = useState("");
  const [singleSemester, setSingleSemester] = useState("6th");
  const [singleMembers, setSingleMembers] = useState("");
  const [singleDomain, setSingleDomain] = useState("");
  const [singleAward, setSingleAward] = useState("");
  const [teamSearchTerm, setTeamSearchTerm] = useState("");

  const openTeamsModal = async (event: EventItem) => {
    setSelectedEventForTeams(event);
    setTeamsTab("LIST");
    setImportResult(null);
    setImportPastedText("");
    const teams = await db.fetchEventTeams(event.id);
    setEventTeamsList(teams);
    setIsTeamsModalOpen(true);
  };

  const handleImportTeams = async () => {
    if (!selectedEventForTeams || !importPastedText.trim()) {
      alert("Please paste the teams and projects table data.");
      return;
    }
    const res = await db.importTeamsFromText(selectedEventForTeams.id, importPastedText);
    const updated = await db.fetchEventTeams(selectedEventForTeams.id);
    setEventTeamsList(updated);
    setImportResult(`Successfully imported ${res.teamsAdded} teams and registered ${res.participantsAdded} student participants with verifiable certificates!`);
    refreshEvents();
  };

  const handleSaveSingleTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventForTeams || !singleTeamName.trim() || !singleProjectTitle.trim()) {
      alert("Please provide at least a Team Name and Project Title.");
      return;
    }
    const memberNames = singleMembers
      ? singleMembers.split(/[,&]/).map((m) => m.trim()).filter(Boolean)
      : [singleLeader || singleTeamName];

    if (singleLeader && !memberNames.includes(singleLeader)) {
      memberNames.unshift(singleLeader);
    }

    const sr = eventTeamsList.length > 0 ? Math.max(...eventTeamsList.map((t) => t.sr)) + 1 : 1;
    const team: EventTeam = {
      id: `team-${selectedEventForTeams.id.replace("evt-", "")}-${sr}-${Date.now().toString().slice(-4)}`,
      eventId: selectedEventForTeams.id,
      sr,
      teamName: singleTeamName.trim(),
      projectTitle: singleProjectTitle.trim(),
      teamLeader: singleLeader.trim() || memberNames[0] || "Team Leader",
      semester: singleSemester.trim(),
      memberCount: memberNames.length,
      teamMembers: memberNames,
      projectDomain: singleDomain.trim() || undefined,
      positionAward: singleAward.trim() || undefined,
    };

    await db.saveEventTeam(team);
    const updated = await db.fetchEventTeams(selectedEventForTeams.id);
    setEventTeamsList(updated);
    setSingleTeamName("");
    setSingleProjectTitle("");
    setSingleLeader("");
    setSingleMembers("");
    setSingleDomain("");
    setSingleAward("");
    setTeamsTab("LIST");
    refreshEvents();
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!selectedEventForTeams) return;
    await db.deleteEventTeam(selectedEventForTeams.id, teamId);
    const updated = await db.fetchEventTeams(selectedEventForTeams.id);
    setEventTeamsList(updated);
  };

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
    setTitle(event.title);
    setSlug(event.slug);
    setDescription(event.description);
    setStatus(event.status);
    setStatusReason(event.statusReason || "");
    setStartDate(event.startDate ? event.startDate.slice(0, 16) : "");
    setEndDate(event.endDate ? event.endDate.slice(0, 16) : "");
    setVenue(event.venue);
    setIsOnline(event.isOnline);
    setMeetingLink(event.meetingLink || "");
    setFeePkr(event.feePkr);
    setSeatsLimit(event.seatsLimit || 60);
    setCertificateType(event.certificateType);
    setCertificateRule(event.certificateRule);
    setFeaturedImage(event.featuredImage);
    setLearningObjectives(event.learningObjectives ? event.learningObjectives.join("\n") : "");
    setEventReport(event.eventReport || "");
    setGalleryImages(event.galleryImages ? event.galleryImages.join("\n") : "");
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      setModalError("Please enter title and slug.");
      return;
    }

    setIsSaving(true);
    setModalError(null);

    try {
      const objectives = learningObjectives
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const gallery = galleryImages
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const cleanSlug = slug
        .trim()
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

      const eventPayload: EventItem = {
        id: editingEventId || `evt-${Date.now()}`,
        slug: cleanSlug,
        title: title.trim(),
        description: description.trim(),
        learningObjectives: objectives,
        startDate: safeStart,
        endDate: safeEnd,
        venue: venue.trim(),
        isOnline,
        meetingLink: isOnline ? meetingLink.trim() : undefined,
        status,
        statusReason: statusReason.trim() || undefined,
        seatsLimit: Number(seatsLimit),
        feePkr: Number(feePkr),
        paymentInstructions: feePkr > 0 ? "Transfer fee via Raast (ID: 0300-1234567) or Bank Alfalah and upload receipt." : undefined,
        certificateType: certificateType.trim(),
        certificateRule: certificateRule.trim(),
        featuredImage: featuredImage.trim() || "/ieee-cs-logo.png",
        galleryImages: gallery.length > 0 ? gallery : undefined,
        eventReport: eventReport.trim() || undefined,
      };

      // Save directly to live PostgreSQL database via Server Action
      const result = await saveEventAction({
        ...eventPayload,
        id: editingEventId || undefined,
      });

      if (!result.success) {
        setModalError(result.error || "Failed to save event to database.");
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
                          <button
                            onClick={() => openTeamsModal(evt)}
                            className="px-2.5 py-1 text-ieee-blue hover:text-ieee-navy hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors flex items-center gap-1.5 text-[11px] font-semibold"
                            title="Manage Teams, Projects & Certificates"
                          >
                            <Trophy size={13} className="text-amber-500" />
                            <span>Teams</span>
                          </button>
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
                      <UploadCloud size={14} /> Upload Banner Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (loadEvt) => {
                            const res = loadEvt.target?.result as string;
                            if (res) setFeaturedImage(res);
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={featuredImage}
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
                    value={learningObjectives}
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
                    value={eventReport}
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
                    value={galleryImages}
                    onChange={(e) => setGalleryImages(e.target.value)}
                    placeholder="https://example.com/photo1.jpg&#10;https://example.com/photo2.jpg"
                    className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none font-mono text-[11px] bg-white"
                  />

                  {/* Upload from Local Device */}
                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                    <span>Or upload image files from your computer:</span>
                    <label className="cursor-pointer inline-flex items-center gap-1 text-xs text-ieee-blue hover:underline font-semibold">
                      <UploadCloud size={14} /> Choose Files
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (!files || files.length === 0) return;
                          Array.from(files).forEach((file) => {
                            const reader = new FileReader();
                            reader.onload = (loadEvt) => {
                              const result = loadEvt.target?.result as string;
                              if (result) {
                                setGalleryImages((prev) => (prev ? `${prev}\n${result}` : result));
                              }
                            };
                            reader.readAsDataURL(file);
                          });
                        }}
                      />
                    </label>
                  </div>

                  {/* Live Thumbnails Preview */}
                  {(() => {
                    const parsed = galleryImages
                      .split("\n")
                      .map((s) => s.trim())
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
        {/* Manage Teams & Projects Modal */}
        {isTeamsModalOpen && selectedEventForTeams && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-card max-w-4xl w-full shadow-2xl border border-gray-200 p-6 md:p-8 space-y-6 my-8 flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                    <Trophy size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-montserrat font-extrabold text-xl text-ieee-navy">
                        Event Teams & Projects
                      </h3>
                      <Badge variant="cyan" size="sm">
                        {eventTeamsList.length} Teams
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {selectedEventForTeams.title} ({selectedEventForTeams.slug})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsTeamsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-700 p-1"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Sub-nav Tabs */}
              <div className="flex border-b border-gray-200 space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setTeamsTab("LIST");
                    setImportResult(null);
                  }}
                  className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                    teamsTab === "LIST"
                      ? "border-ieee-blue text-ieee-blue"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Trophy size={14} />
                  <span>Registered Teams ({eventTeamsList.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTeamsTab("IMPORT");
                    setImportResult(null);
                  }}
                  className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                    teamsTab === "IMPORT"
                      ? "border-ieee-blue text-ieee-blue"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <FileSpreadsheet size={14} />
                  <span>Bulk Import (Excel / TSV)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTeamsTab("ADD");
                    setImportResult(null);
                  }}
                  className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                    teamsTab === "ADD"
                      ? "border-ieee-blue text-ieee-blue"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Plus size={14} />
                  <span>Add Single Team</span>
                </button>
              </div>

              {/* Tab 1: Teams List */}
              {teamsTab === "LIST" && (
                <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-sm">
                      <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search teams, members, or projects..."
                        value={teamSearchTerm}
                        onChange={(e) => setTeamSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-ieee-blue"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setTeamsTab("IMPORT")}>
                        <FileSpreadsheet size={13} className="mr-1" /> Import from Sheet
                      </Button>
                      <Button size="sm" variant="primary" onClick={() => setTeamsTab("ADD")}>
                        <Plus size={13} className="mr-1" /> Add Team
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
                    {eventTeamsList.length === 0 ? (
                      <div className="p-8 text-center text-gray-500 space-y-3">
                        <Trophy size={36} className="mx-auto text-gray-300" />
                        <p className="text-sm font-semibold">No teams registered for this event yet.</p>
                        <p className="text-xs text-gray-400 max-w-sm mx-auto">
                          Import teams directly from an Excel sheet or add them one by one.
                        </p>
                        <div className="pt-2 flex justify-center gap-2">
                          <Button size="sm" variant="primary" onClick={() => setTeamsTab("IMPORT")}>
                            Import from Excel / TSV
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-gray-50 sticky top-0 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="p-3 w-12 text-center">Sr</th>
                            <th className="p-3">Team & Project</th>
                            <th className="p-3">Leader & Semester</th>
                            <th className="p-3">Team Members</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {eventTeamsList
                            .filter((t) => {
                              if (!teamSearchTerm.trim()) return true;
                              const q = teamSearchTerm.toLowerCase();
                              return (
                                t.teamName.toLowerCase().includes(q) ||
                                t.projectTitle.toLowerCase().includes(q) ||
                                t.teamLeader.toLowerCase().includes(q) ||
                                t.semester.toLowerCase().includes(q) ||
                                t.teamMembers.some((m) => m.toLowerCase().includes(q))
                              );
                            })
                            .map((team) => (
                              <tr key={team.id} className="hover:bg-blue-50/30 transition-colors">
                                <td className="p-3 font-mono font-bold text-gray-500 text-center">
                                  {team.sr}
                                </td>
                                <td className="p-3 space-y-1">
                                  <div className="font-bold text-ieee-navy text-sm">
                                    {team.teamName}
                                  </div>
                                  <div className="text-gray-600 font-medium">
                                    {team.projectTitle}
                                  </div>
                                  {team.positionAward && (
                                    <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                                      🏆 {team.positionAward}
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 space-y-1">
                                  <div className="font-semibold text-gray-800">
                                    {team.teamLeader}
                                  </div>
                                  <div className="text-[11px] text-gray-500">
                                    Semester: <span className="font-semibold text-gray-700">{team.semester}</span>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <div className="flex flex-wrap gap-1 max-w-xs">
                                    {team.teamMembers.map((member, mIdx) => (
                                      <span
                                        key={mIdx}
                                        className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-medium"
                                      >
                                        {member}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="p-3 text-right">
                                  <button
                                    onClick={() => {
                                      if (confirm(`Remove team "${team.teamName}"?`)) {
                                        handleDeleteTeam(team.id);
                                      }
                                    }}
                                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                    title="Delete team"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Batch Import */}
              {teamsTab === "IMPORT" && (
                <div className="space-y-4 flex-1 overflow-y-auto">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Sparkles size={14} className="text-ieee-blue" />
                      <span>Instant Excel / TSV Import Engine</span>
                    </div>
                    <p className="text-blue-800">
                      Copy rows directly from Excel or Google Sheets and paste below.
                      Supports column formats:
                    </p>
                    <code className="block bg-white p-2 rounded border border-blue-200 font-mono text-[11px] text-blue-950">
                      Sr | Team Name | No. of Members | Team Leader | Semester | Team Members | Project Title
                    </code>
                    <p className="text-[11px] text-blue-700">
                      Importing automatically creates: team records, participant registrations with <strong>ATTENDED</strong> status, digital attendance records, and unique verifiable <strong>IEEE Certificate Codes</strong>!
                    </p>
                  </div>

                  {importResult && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
                      <span>{importResult}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700">
                      Paste Tab-Separated or Comma-Separated Data:
                    </label>
                    <textarea
                      rows={10}
                      value={importPastedText}
                      onChange={(e) => setImportPastedText(e.target.value)}
                      placeholder={`1\tByteForge\t2\tAsadullah Yousaf\t6th\tAsadullah Yousaf, M. Ahmad\tSynapse Vault\n2\tMeta Hunters\t2\tMuhammad Haseeb\t6th\tMuhammad Haseeb, Ali Raza\tAndroid Artifact Analysis`}
                      className="w-full p-3 font-mono text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-ieee-blue leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={() => setTeamsTab("LIST")}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleImportTeams}
                      disabled={!importPastedText.trim()}
                    >
                      <Sparkles size={14} className="mr-1.5" />
                      Process & Import Teams
                    </Button>
                  </div>
                </div>
              )}

              {/* Tab 3: Add Single Team */}
              {teamsTab === "ADD" && (
                <form onSubmit={handleSaveSingleTeam} className="space-y-4 flex-1 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-700">Team Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. ByteForge"
                        value={singleTeamName}
                        onChange={(e) => setSingleTeamName(e.target.value)}
                        className="w-full p-2 text-xs border rounded-lg focus:outline-none focus:border-ieee-blue"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700">Project Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Synapse Vault"
                        value={singleProjectTitle}
                        onChange={(e) => setSingleProjectTitle(e.target.value)}
                        className="w-full p-2 text-xs border rounded-lg focus:outline-none focus:border-ieee-blue"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700">Team Leader</label>
                      <input
                        type="text"
                        placeholder="e.g. Asadullah Yousaf"
                        value={singleLeader}
                        onChange={(e) => setSingleLeader(e.target.value)}
                        className="w-full p-2 text-xs border rounded-lg focus:outline-none focus:border-ieee-blue"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700">Semester</label>
                      <input
                        type="text"
                        placeholder="e.g. 6th"
                        value={singleSemester}
                        onChange={(e) => setSingleSemester(e.target.value)}
                        className="w-full p-2 text-xs border rounded-lg focus:outline-none focus:border-ieee-blue"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-gray-700">
                        Team Members (comma separated)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Asadullah Yousaf, Muhammad Ahmad, Ali Raza"
                        value={singleMembers}
                        onChange={(e) => setSingleMembers(e.target.value)}
                        className="w-full p-2 text-xs border rounded-lg focus:outline-none focus:border-ieee-blue"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700">Project Domain / Category</label>
                      <input
                        type="text"
                        placeholder="e.g. Cyber Physical Systems or AI & ML"
                        value={singleDomain}
                        onChange={(e) => setSingleDomain(e.target.value)}
                        className="w-full p-2 text-xs border rounded-lg focus:outline-none focus:border-ieee-blue"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700">Position / Award (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. 1st Position (Rs. 10,000)"
                        value={singleAward}
                        onChange={(e) => setSingleAward(e.target.value)}
                        className="w-full p-2 text-xs border rounded-lg focus:outline-none focus:border-ieee-blue"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t">
                    <Button type="button" variant="outline" onClick={() => setTeamsTab("LIST")}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary">
                      Save Team & Issue Certificates
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

