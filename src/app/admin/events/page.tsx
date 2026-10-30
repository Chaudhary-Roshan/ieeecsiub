"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { db } from "@/lib/db";
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
} from "lucide-react";

export default function AdminEventsManagerPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

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
  const [featuredImage, setFeaturedImage] = useState("https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80");
  const [learningObjectives, setLearningObjectives] = useState("");

  const refreshEvents = () => {
    setEvents(db.getEvents());
  };

  useEffect(() => {
    refreshEvents();
  }, []);

  const openCreateModal = () => {
    setEditingEventId(null);
    setTitle("");
    setSlug(`2026/event-${Date.now().toString().slice(-4)}`);
    setDescription("");
    setStatus("UPCOMING");
    setStatusReason("");
    const now = new Date();
    const later = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    setStartDate(now.toISOString().slice(0, 16));
    setEndDate(later.toISOString().slice(0, 16));
    setVenue("Syed Tabish Alwari Auditorium, UCET IUB");
    setIsOnline(false);
    setMeetingLink("");
    setFeePkr(0);
    setSeatsLimit(60);
    setCertificateType("Certificate of Participation");
    setCertificateRule("Minimum 80% physical attendance verified via digital check-in");
    setFeaturedImage("https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80");
    setLearningObjectives("Core technical hands-on skills\nIndustry relevant workflows\nOfficial IEEE certification");
    setIsModalOpen(true);
  };

  const openEditModal = (event: EventItem) => {
    setEditingEventId(event.id);
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
    setIsModalOpen(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      alert("Please enter title and slug.");
      return;
    }

    const objectives = learningObjectives
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const eventPayload: EventItem = {
      id: editingEventId || `evt-${Date.now()}`,
      slug: slug.trim(),
      title: title.trim(),
      description: description.trim(),
      learningObjectives: objectives,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
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
      featuredImage: featuredImage.trim(),
    };

    if (editingEventId) {
      db.updateEvent(editingEventId, eventPayload);
      alert(`Event "${title}" updated successfully!`);
    } else {
      db.addEvent(eventPayload);
      alert(`Event "${title}" created successfully!`);
    }

    db.addAuditLog(
      "Muhammad Roshan Ashraf",
      editingEventId ? "EVENT_UPDATED" : "EVENT_CREATED",
      "events",
      eventPayload.id,
      `${editingEventId ? "Updated" : "Created"} event "${title}" with status "${status}".`
    );

    setIsModalOpen(false);
    refreshEvents();
  };

  const handleDeleteEvent = (event: EventItem) => {
    if (confirm(`Are you sure you want to delete event "${event.title}"?`)) {
      db.deleteEvent(event.id);
      db.addAuditLog(
        "Muhammad Roshan Ashraf",
        "EVENT_DELETED",
        "events",
        event.id,
        `Deleted event "${event.title}".`
      );
      refreshEvents();
    }
  };

  const handleQuickStatusChange = (eventId: string, newStatus: EventStatus) => {
    db.updateEvent(eventId, { status: newStatus });
    refreshEvents();
  };

  // Filtered Events
  const filteredEvents = events.filter((e) => {
    const matchesTab = activeTab === "ALL" || e.status === activeTab;
    const matchesSearch =
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.slug.toLowerCase().includes(searchTerm.toLowerCase());
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

                {/* Featured Image */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Featured Cover Image URL
                  </label>
                  <input
                    type="url"
                    value={featuredImage}
                    onChange={(e) => setFeaturedImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none text-xs font-mono"
                  />
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

                {/* Submit Buttons */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 font-semibold"
                  >
                    Cancel
                  </button>
                  <Button type="submit" variant="primary">
                    {editingEventId ? "Save Changes" : "Publish Event"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
