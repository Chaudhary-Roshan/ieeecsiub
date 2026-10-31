import React from "react";
import { getEvents } from "@/lib/data/events";
import { EventsListClient } from "@/components/events/EventsListClient";

export const revalidate = 0; // Always serve fresh data synchronized with Postgres

export const metadata = {
  title: "Events & Technical Workshops | IEEE CS UCET-IUB",
  description: "Browse upcoming workshops, active code sprints, and archived technical sessions.",
};

export default async function EventsListPage() {
  const events = await getEvents({ publishedOnly: true });

  return (
    <div className="flex-1 bg-gray-50 py-12 md:py-16 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="space-y-3">
          <span className="text-xs font-montserrat font-bold text-ieee-orange uppercase tracking-widest block">
            Technical Calendar
          </span>
          <h1 className="text-3xl sm:text-5xl font-montserrat font-extrabold text-ieee-navy">
            Chapter Events & Technical Sessions
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
            Explore upcoming workshops, active code sprints, and archived event reports.
            All times are indicated in Pakistan Standard Time (PKT, UTC+5).
          </p>
        </div>

        {/* Client-side filtered list */}
        <EventsListClient initialEvents={events} />
      </div>
    </div>
  );
}
