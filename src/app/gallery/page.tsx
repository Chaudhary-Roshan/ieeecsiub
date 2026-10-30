"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/db";
import { Image as ImageIcon, Calendar, X, ZoomIn } from "lucide-react";

interface GalleryPhoto {
  url: string;
  caption: string;
  event: string;
}

export default function GalleryPage() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("ALL");
  const [activeLightbox, setActiveLightbox] = useState<GalleryPhoto | null>(null);

  useEffect(() => {
    const events = db.getEvents();
    const collected: GalleryPhoto[] = [];

    // Pull gallery photos from events in database
    events.forEach((evt) => {
      if (evt.galleryImages && evt.galleryImages.length > 0) {
        evt.galleryImages.forEach((url, i) => {
          collected.push({
            url,
            caption: `${evt.title} - Session Snapshot #${i + 1}`,
            event: evt.title,
          });
        });
      }
    });

    // Curated highlight images
    const curatedHighlights: GalleryPhoto[] = [
      {
        url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80",
        caption: "Interactive Coding Workshop at Computer Center",
        event: "Hands-on Flutter & Cloud Mobile Development",
      },
      {
        url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80",
        caption: "Keynote Address by Faculty Advisors & Executive Board",
        event: "UCET TechSprint: 24-Hour Web & AI Hackathon 2025",
      },
      {
        url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80",
        caption: "Collaborative Open Source Git Sprint",
        event: "Git & GitHub for Open Source Collaboration",
      },
      {
        url: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80",
        caption: "Student Participants Presenting Final Capstones",
        event: "UCET TechSprint: 24-Hour Web & AI Hackathon 2025",
      },
    ];

    // Merge without duplicate URLs
    const urlSet = new Set<string>();
    const merged: GalleryPhoto[] = [];

    [...collected, ...curatedHighlights].forEach((item) => {
      if (!urlSet.has(item.url)) {
        urlSet.add(item.url);
        merged.push(item);
      }
    });

    setPhotos(merged);
  }, []);

  const eventList = ["ALL", ...Array.from(new Set(photos.map((p) => p.event)))];

  const filteredPhotos = photos.filter((p) => {
    return selectedEvent === "ALL" || p.event === selectedEvent;
  });

  return (
    <div className="flex-1 bg-gray-50 py-12 md:py-20 px-4 sm:px-8 font-openSans">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <div className="space-y-3">
          <span className="text-xs font-montserrat font-bold text-ieee-orange uppercase tracking-widest block">
            Media & Activity Archives
          </span>
          <h1 className="text-3xl sm:text-5xl font-montserrat font-extrabold text-ieee-navy">
            Chapter Event Photo Gallery
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
            Visual moments captured across workshops, seminars, hackathons, and award ceremonies at
            UCET, The Islamia University of Bahawalpur.
          </p>
        </div>

        {/* Event Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pb-2">
          {eventList.map((evtName) => (
            <button
              key={evtName}
              onClick={() => setSelectedEvent(evtName)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-montserrat font-semibold transition-all ${
                selectedEvent === evtName
                  ? "bg-ieee-navy text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {evtName === "ALL" ? "All Moments" : evtName}
            </button>
          ))}
        </div>

        {/* Photos Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotos.map((item, idx) => (
            <div
              key={idx}
              onClick={() => setActiveLightbox(item)}
              className="bg-white border border-gray-200 rounded-card overflow-hidden shadow-sm group cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="h-56 w-full overflow-hidden bg-gray-200 relative">
                <img
                  src={item.url}
                  alt={item.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full">
                    <ZoomIn size={20} />
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-1 text-xs">
                <p className="font-montserrat font-bold text-gray-900 leading-snug line-clamp-1">
                  {item.caption}
                </p>
                <span className="text-ieee-blue font-semibold block text-[11px] truncate">
                  {item.event}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox Modal */}
        {activeLightbox && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setActiveLightbox(null)}
          >
            <div
              className="relative max-w-4xl w-full bg-white rounded-xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setActiveLightbox(null)}
                className="absolute top-4 right-4 z-10 w-9 h-9 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black transition-colors"
              >
                <X size={20} />
              </button>

              <div className="max-h-[75vh] w-full bg-black flex items-center justify-center overflow-hidden">
                <img
                  src={activeLightbox.url}
                  alt={activeLightbox.caption}
                  className="max-h-[75vh] w-auto object-contain"
                />
              </div>

              <div className="p-5 bg-white text-xs space-y-1">
                <h3 className="font-montserrat font-bold text-base text-ieee-navy">
                  {activeLightbox.caption}
                </h3>
                <p className="text-ieee-blue font-semibold">
                  {activeLightbox.event}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
