"use client";

import React, { useState } from "react";
import Link from "next/link";
import { EventItem, EventStatus } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { formatPKTDateTime } from "@/lib/sha256";
import {
  Calendar,
  MapPin,
  ArrowRight,
  Clock,
  AlertTriangle,
  Filter,
} from "lucide-react";
import clsx from "clsx";

interface EventsListClientProps {
  initialEvents: EventItem[];
}

export const EventsListClient: React.FC<EventsListClientProps> = ({ initialEvents }) => {
  const [activeTab, setActiveTab] = useState<"ALL" | EventStatus>("ALL");

  const tabs: { label: string; value: "ALL" | EventStatus }[] = [
    { label: "All Events", value: "ALL" },
    { label: "Upcoming", value: "UPCOMING" },
    { label: "Ongoing", value: "ONGOING" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Postponed", value: "POSTPONED" },
    { label: "Cancelled", value: "CANCELLED" },
  ];

  const filteredEvents = initialEvents.filter((evt) => {
    if (activeTab === "ALL") return true;
    return evt.status === activeTab;
  });

  return (
    <div className="space-y-10">
      {/* Status Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-200">
        <Filter size={16} className="text-gray-400 mr-2 flex-shrink-0" />
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={clsx(
              "px-4 py-2 rounded-full text-xs font-montserrat font-semibold whitespace-nowrap transition-all",
              activeTab === tab.value
                ? "bg-ieee-navy text-white shadow-sm"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            )}
          >
            {tab.label}
            <span className="ml-1.5 opacity-70">
              (
              {tab.value === "ALL"
                ? initialEvents.length
                : initialEvents.filter((e) => e.status === tab.value).length}
              )
            </span>
          </button>
        ))}
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white border border-ieee-border rounded-card p-12 text-center text-gray-500 text-sm">
          No events found in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEvents.map((evt) => {
            const cleanSlug = evt.slug.trim().replace(/^\/+/, "");
            const isPostponed = evt.status === "POSTPONED";
            const isCancelled = evt.status === "CANCELLED";

            return (
              <div
                key={evt.id}
                className="bg-white border border-ieee-border rounded-card overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all group"
              >
                <div>
                  {/* Event Image */}
                  <div className="relative h-48 w-full bg-gray-200 overflow-hidden">
                    <img
                      src={evt.featuredImage || "/ieee-cs-logo.png"}
                      alt={evt.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge status={evt.status} />
                    </div>
                  </div>

                  {/* Postponed / Cancelled Banner */}
                  {(isPostponed || isCancelled) && evt.statusReason && (
                    <div
                      className={clsx(
                        "px-4 py-2.5 text-xs flex items-start gap-2 border-b",
                        isPostponed
                          ? "bg-[#FEF3D6] text-[#B45309] border-[#FAD79A]"
                          : "bg-[#FCE8E6] text-[#BA0C2F] border-[#F5C2BE]"
                      )}
                    >
                      <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>{evt.status}:</strong> {evt.statusReason}
                      </span>
                    </div>
                  )}

                  {/* Event Body */}
                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs text-ieee-blue font-semibold">
                      <Calendar size={14} />
                      <span>{formatPKTDateTime(evt.startDate)}</span>
                    </div>

                    <h3 className="font-montserrat font-bold text-lg text-ieee-navy group-hover:text-ieee-blue transition-colors line-clamp-2">
                      <Link href={`/events/${cleanSlug}`}>
                        {evt.title}
                      </Link>
                    </h3>

                    <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                      {evt.description}
                    </p>

                    <div className="pt-2 text-xs text-gray-500 space-y-1">
                      <p className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-ieee-muted" />
                        <span className="truncate">{evt.venue}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Clock size={13} className="text-ieee-muted" />
                        <span>Cert: {evt.certificateType}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer & Action */}
                <div className="p-6 pt-0 border-t border-gray-100 mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-800">
                      {evt.feePkr > 0 ? `PKR ${evt.feePkr}` : "Free Event"}
                    </span>
                    {evt.seatsLimit && evt.status === "UPCOMING" && (
                      <span className="block text-[10px] text-gray-500">
                        {evt.registeredCount || 0} / {evt.seatsLimit} seats filled
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/events/${cleanSlug}`}
                    className="inline-flex items-center text-xs font-montserrat font-bold text-ieee-blue group-hover:text-ieee-navy hover:underline"
                  >
                    Permanent Page <ArrowRight size={13} className="ml-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
