"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { db } from "@/lib/db";
import { saveTeamMemberAction, deleteTeamMemberAction } from "@/app/actions/team";
import { TeamMember } from "@/types";
import { Button } from "@/components/ui/Button";
import {
  Users,
  UserCheck,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Camera,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Sparkles,
  GraduationCap,
  Shield,
  Briefcase,
  History,
} from "lucide-react";
import clsx from "clsx";

export default function AdminTeamManagerPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "CURRENT" | "ARCHIVE">("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [committeeYear, setCommitteeYear] = useState("2026-2027");
  const [photoUrl, setPhotoUrl] = useState("");
  const [approvedBio, setApprovedBio] = useState("");
  const [isCurrent, setIsCurrent] = useState(true);
  const [email, setEmail] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadTeam = async () => {
    setLoading(true);
    const data = await db.fetchTeamMembers();
    setMembers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const showNotification = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Extract distinct tenure years
  const availableYears = Array.from(new Set(members.map((m) => m.committeeYear))).sort().reverse();

  // Filtered members list
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.approvedBio.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesYear = filterYear === "ALL" || m.committeeYear === filterYear;
    const matchesStatus =
      filterStatus === "ALL" ||
      (filterStatus === "CURRENT" && m.isCurrent) ||
      (filterStatus === "ARCHIVE" && !m.isCurrent);

    return matchesSearch && matchesYear && matchesStatus;
  });

  const openCreateModal = () => {
    setEditingId(null);
    setName("");
    setPosition("Chapter Chair");
    setCommitteeYear(availableYears[0] || "2026-2027");
    setPhotoUrl("");
    setApprovedBio("");
    setIsCurrent(true);
    setEmail("");
    setLinkedinUrl("");
    setIsModalOpen(true);
  };

  const openEditModal = (member: TeamMember) => {
    setEditingId(member.id);
    setName(member.name || "");
    setPosition(member.position || "");
    setCommitteeYear(member.committeeYear || "");
    setPhotoUrl(member.photoUrl || "");
    setApprovedBio(member.approvedBio || "");
    setIsCurrent(Boolean(member.isCurrent));
    setEmail(member.email || "");
    setLinkedinUrl(member.linkedinUrl || "");
    setIsModalOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image file size should be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPhotoUrl(result || "");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = (name || "").trim();
    const cleanPosition = (position || "").trim();
    const cleanYear = (committeeYear || "").trim();
    if (!cleanName || !cleanPosition || !cleanYear) {
      alert("Please fill in the required fields (Name, Position, Tenure Year).");
      return;
    }

    const memberId = editingId || `team-${Date.now()}`;
    const targetMember: TeamMember = {
      id: memberId,
      name: cleanName,
      position: cleanPosition,
      committeeYear: cleanYear,
      photoUrl: (photoUrl || "").trim(),
      approvedBio: (approvedBio || "").trim(),
      isCurrent,
      email: (email || "").trim() || undefined,
      linkedinUrl: (linkedinUrl || "").trim() || undefined,
      orderIndex: editingId
        ? members.find((m) => m.id === editingId)?.orderIndex ?? 0
        : members.length,
    };

    try {
      await saveTeamMemberAction({
        ...targetMember,
        id: editingId || undefined,
      });
    } catch (err: any) {
      console.warn("Save team member action warning:", err);
    }

    await db.saveTeamMember(targetMember);
    await loadTeam();

    db.addAuditLog(
      "Muhammad Roshan Ashraf",
      editingId ? "TEAM_MEMBER_UPDATED" : "TEAM_MEMBER_CREATED",
      "team_members",
      memberId,
      `${editingId ? "Updated" : "Added"} officer "${targetMember.name}" (${targetMember.position}) for tenure ${targetMember.committeeYear}.`
    );

    setIsModalOpen(false);
    showNotification(`Officer "${targetMember.name}" successfully saved to cloud database!`);
  };

  const handleDelete = async (id: string) => {
    const target = members.find((m) => m.id === id);
    try {
      await deleteTeamMemberAction(id);
    } catch (err) {
      console.warn("Delete team member action warning:", err);
    }
    await db.deleteTeamMember(id);
    await loadTeam();
    setDeleteConfirmId(null);

    db.addAuditLog(
      "Muhammad Roshan Ashraf",
      "TEAM_MEMBER_DELETED",
      "team_members",
      id,
      `Removed officer "${target?.name || id}" from chapter records.`
    );

    showNotification(`Officer record removed.`);
  };

  const handleToggleCurrent = async (member: TeamMember) => {
    const updated = { ...member, isCurrent: !member.isCurrent };
    await db.saveTeamMember(updated);
    await loadTeam();

    db.addAuditLog(
      "Muhammad Roshan Ashraf",
      "TEAM_MEMBER_STATUS_CHANGED",
      "team_members",
      member.id,
      `Changed officer "${member.name}" status to ${updated.isCurrent ? "Active Current" : "Historical Archive"}.`
    );
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= members.length) return;

    const listCopy = [...members];
    const temp = listCopy[index];
    listCopy[index] = listCopy[targetIndex];
    listCopy[targetIndex] = temp;

    // Re-assign order indices
    listCopy.forEach((item, idx) => {
      item.orderIndex = idx;
      db.saveTeamMember(item);
    });

    setMembers(listCopy);
    showNotification("Roster display order updated.");
  };

  const positionPresets = [
    "Branch Counselor / Senior Advisor",
    "Faculty Advisor",
    "Chapter Chair",
    "Vice Chair & Content Lead",
    "Vice Chair",
    "General Secretary",
    "Treasurer",
    "Webmaster & Tech Lead",
    "Event Management Lead",
    "Membership & Growth Lead",
    "Public Relations Lead",
  ];

  return (
    <AdminLayout>
      <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-ieee-blue/10 text-ieee-blue text-[11px] font-montserrat font-bold px-3 py-1 rounded-full mb-2">
              <UserCheck size={14} /> Chapter Leadership Governance
            </div>
            <h1 className="text-2xl sm:text-3xl font-montserrat font-extrabold text-ieee-navy">
              Officers & Faculty Advisors
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Add, edit, reorder, and archive chapter counselors, advisors, and executive committee officers displayed on the public{" "}
              <Link href="/team" target="_blank" className="text-ieee-blue underline font-semibold">
                /team page <ExternalLink size={10} className="inline ml-0.5" />
              </Link>
              .
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={openCreateModal} variant="accent" size="md">
              <Plus size={16} className="mr-1.5" /> Add Officer / Advisor
            </Button>
          </div>
        </div>

        {/* Status Notification Toast */}
        {statusMessage && (
          <div className="p-4 bg-[#E6F4EA] border border-[#A8DAB5] rounded-xl text-xs text-[#00843D] flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} />
              <span className="font-semibold">{statusMessage}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-gray-400 hover:text-gray-700">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-card border border-ieee-border shadow-xs">
            <span className="text-[11px] font-montserrat font-bold text-gray-500 uppercase tracking-wider block">
              Total Listed
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-montserrat text-ieee-navy mt-1">
              {members.length}
            </div>
            <span className="text-[10px] text-gray-400 mt-0.5 block">Counselors, Advisors & ExCom</span>
          </div>

          <div className="bg-white p-5 rounded-card border border-ieee-border shadow-xs">
            <span className="text-[11px] font-montserrat font-bold text-status-active uppercase tracking-wider block">
              Active Tenure
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-montserrat text-status-active mt-1">
              {members.filter((m) => m.isCurrent).length}
            </div>
            <span className="text-[10px] text-gray-400 mt-0.5 block">Currently Serving</span>
          </div>

          <div className="bg-white p-5 rounded-card border border-ieee-border shadow-xs">
            <span className="text-[11px] font-montserrat font-bold text-ieee-blue uppercase tracking-wider block">
              Faculty Leadership
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-montserrat text-ieee-blue mt-1">
              {members.filter((m) => m.position.toLowerCase().includes("advisor") || m.position.toLowerCase().includes("counselor")).length}
            </div>
            <span className="text-[10px] text-gray-400 mt-0.5 block">Professors & Mentors</span>
          </div>

          <div className="bg-white p-5 rounded-card border border-ieee-border shadow-xs">
            <span className="text-[11px] font-montserrat font-bold text-gray-500 uppercase tracking-wider block">
              Historical Tenures
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-montserrat text-gray-700 mt-1">
              {availableYears.length}
            </div>
            <span className="text-[10px] text-gray-400 mt-0.5 block">Tenure Periods Logged</span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-card border border-ieee-border shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, role, or bio..."
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-xs focus:ring-1 focus:ring-ieee-blue outline-none"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Year Select */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Filter size={14} />
              <span>Tenure:</span>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="border rounded-md px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-ieee-blue"
              >
                <option value="ALL">All Years</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Tabs */}
            <div className="flex items-center bg-gray-100 p-1 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setFilterStatus("ALL")}
                className={clsx(
                  "px-3 py-1 rounded-md transition-colors",
                  filterStatus === "ALL" ? "bg-white text-ieee-navy shadow-xs" : "text-gray-600 hover:text-black"
                )}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus("CURRENT")}
                className={clsx(
                  "px-3 py-1 rounded-md transition-colors",
                  filterStatus === "CURRENT" ? "bg-white text-status-active shadow-xs font-bold" : "text-gray-600 hover:text-black"
                )}
              >
                Active
              </button>
              <button
                onClick={() => setFilterStatus("ARCHIVE")}
                className={clsx(
                  "px-3 py-1 rounded-md transition-colors",
                  filterStatus === "ARCHIVE" ? "bg-white text-gray-800 shadow-xs font-bold" : "text-gray-600 hover:text-black"
                )}
              >
                Archive
              </button>
            </div>
          </div>
        </div>

        {/* Officers Grid */}
        {loading ? (
          <div className="p-12 text-center bg-white rounded-card border border-ieee-border space-y-3">
            <div className="w-8 h-8 border-4 border-ieee-blue border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-500 font-montserrat">Loading leadership registry...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-card border border-dashed border-gray-300 space-y-3">
            <Users className="mx-auto text-gray-400" size={36} />
            <h3 className="font-montserrat font-bold text-gray-700 text-sm">No officers found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              No leadership records match the selected filters. Click below to register an officer.
            </p>
            <Button onClick={openCreateModal} variant="primary" size="sm">
              <Plus size={14} className="mr-1" /> Add Officer / Advisor
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member, idx) => {
              const isCounselor =
                member.position.toLowerCase().includes("counselor") ||
                member.position.toLowerCase().includes("advisor");

              return (
                <div
                  key={member.id}
                  className="bg-white rounded-card border border-ieee-border shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Card Top Banner */}
                    <div className="p-5 flex items-start gap-4 border-b border-gray-100 bg-gray-50/50">
                      {/* Photo / Avatar */}
                      <div className="flex-shrink-0">
                        {member.photoUrl ? (
                          <img
                            src={member.photoUrl}
                            alt={member.name}
                            className="w-14 h-14 rounded-full object-cover border-2 border-ieee-border shadow-xs"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-ieee-navy to-ieee-blue text-white flex items-center justify-center font-montserrat font-bold text-lg shadow-inner">
                            {member.name
                              .split(" ")
                              .filter(Boolean)
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")}
                          </div>
                        )}
                      </div>

                      {/* Header Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {isCounselor ? (
                            <span className="bg-blue-100 text-ieee-blue text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                              <GraduationCap size={10} /> Faculty
                            </span>
                          ) : (
                            <span className="bg-orange-100 text-ieee-orange text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                              <Briefcase size={10} /> ExCom
                            </span>
                          )}

                          <span
                            className={clsx(
                              "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase",
                              member.isCurrent
                                ? "bg-green-100 text-status-active"
                                : "bg-gray-200 text-gray-700"
                            )}
                          >
                            {member.isCurrent ? "Active" : "Archive"}
                          </span>
                        </div>

                        <h3 className="font-montserrat font-bold text-sm text-ieee-navy truncate mt-1">
                          {member.name}
                        </h3>
                        <p className="text-xs font-semibold text-ieee-blue truncate">{member.position}</p>
                        <span className="text-[10px] text-gray-400 block mt-0.5 font-mono">
                          Tenure {member.committeeYear}
                        </span>
                      </div>
                    </div>

                    {/* Bio Section */}
                    <div className="p-5 text-xs text-gray-600 leading-relaxed space-y-2">
                      <p className="line-clamp-3">
                        {member.approvedBio || "No approved biography entered yet."}
                      </p>
                      {member.email && (
                        <div className="text-[11px] text-gray-400 truncate">
                          ✉ {member.email}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2 text-xs">
                    {/* Ordering Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMove(idx, "up")}
                        disabled={idx === 0}
                        title="Move Up"
                        className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent text-gray-600 transition-colors"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        onClick={() => handleMove(idx, "down")}
                        disabled={idx === members.length - 1}
                        title="Move Down"
                        className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent text-gray-600 transition-colors"
                      >
                        <ArrowDown size={13} />
                      </button>
                    </div>

                    {/* Quick Toggle & Edit & Delete */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleCurrent(member)}
                        className={clsx(
                          "text-[10px] font-semibold px-2 py-1 rounded transition-colors",
                          member.isCurrent
                            ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            : "bg-green-100 text-status-active hover:bg-green-200"
                        )}
                        title="Toggle Active / Archive status"
                      >
                        {member.isCurrent ? "Mark Archive" : "Mark Active"}
                      </button>

                      <button
                        onClick={() => openEditModal(member)}
                        className="p-1.5 rounded-lg text-ieee-blue hover:bg-blue-50 transition-colors"
                        title="Edit Officer"
                      >
                        <Edit size={14} />
                      </button>

                      <button
                        onClick={() => setDeleteConfirmId(member.id)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete Officer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add / Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-card shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-2">
                  <UserCheck className="text-ieee-blue" size={20} />
                  <h2 className="font-montserrat font-bold text-base text-ieee-navy">
                    {editingId ? "Edit Officer / Advisor" : "Add New Officer / Advisor"}
                  </h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
                {/* Full Name */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Asjad Amin or Muhammad Roshan Ashraf"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none"
                  />
                </div>

                {/* Position / Title */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-gray-700">
                      Position / Leadership Role *
                    </label>
                    <span className="text-[10px] text-gray-400">Select preset or type custom</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="e.g. Chapter Chair or Faculty Advisor"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none mb-1.5"
                  />
                  {/* Preset Pills */}
                  <div className="flex flex-wrap gap-1">
                    {positionPresets.slice(0, 6).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setPosition(preset)}
                        className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded transition-colors"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Committee Year & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Committee Year / Tenure *
                    </label>
                    <input
                      type="text"
                      required
                      value={committeeYear}
                      onChange={(e) => setCommitteeYear(e.target.value)}
                      placeholder="e.g. 2026-2027"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={isCurrent ? "CURRENT" : "ARCHIVE"}
                      onChange={(e) => setIsCurrent(e.target.value === "CURRENT")}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none bg-white font-medium"
                    >
                      <option value="CURRENT">Active / Serving Tenure</option>
                      <option value="ARCHIVE">Historical Archive / Former</option>
                    </select>
                  </div>
                </div>

                {/* Photo Upload Section */}
                <div className="border border-gray-200 rounded-lg p-3.5 bg-gray-50/50 space-y-2">
                  <label className="block font-semibold text-gray-700">
                    Official Portrait / Photograph (Optional)
                  </label>
                  <p className="text-[11px] text-gray-500">
                    Upload a high-res photo from your local device or paste an image URL. If omitted, an official IEEE monogram avatar will be generated.
                  </p>

                  <div className="flex items-center gap-3 pt-1">
                    {photoUrl ? (
                      <div className="relative group">
                        <img
                          src={photoUrl}
                          alt="Preview"
                          className="w-16 h-16 rounded-full object-cover border-2 border-ieee-blue shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setPhotoUrl("")}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-xs"
                          title="Remove Photo"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-400">
                        <Camera size={20} />
                      </div>
                    )}

                    <div className="flex-1 space-y-1.5">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs"
                      >
                        <Upload size={13} /> Upload Photo from Computer
                      </button>
                      <input
                        type="text"
                        value={photoUrl}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                        placeholder="Or paste image URL (https://...)"
                        className="w-full px-2.5 py-1 border rounded text-[11px] outline-none bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Approved Bio */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Approved Biography & Portfolio Summary
                  </label>
                  <textarea
                    rows={3}
                    value={approvedBio}
                    onChange={(e) => setApprovedBio(e.target.value)}
                    placeholder="Enter academic credentials, chapter role responsibilities, or technical focus areas..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none"
                  />
                </div>

                {/* Optional Email & LinkedIn */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Official Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. roshan.ashraf@ieee.org"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      LinkedIn URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none"
                    />
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <Button type="submit" variant="accent" size="md">
                    {editingId ? "Save Changes" : "Create Officer"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-card shadow-2xl max-w-sm w-full p-6 space-y-4 border border-gray-200 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <AlertCircle size={24} />
              </div>
              <h3 className="font-montserrat font-bold text-base text-gray-800">
                Confirm Removal
              </h3>
              <p className="text-xs text-gray-600">
                Are you sure you want to remove this officer record from the chapter leadership registry? This action will immediately update the live website.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white"
                >
                  Yes, Remove Officer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

