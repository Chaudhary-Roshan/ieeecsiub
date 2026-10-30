"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { Camera, ZoomIn, X, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

interface GalleryPhoto {
  url: string;
  caption: string;
  event: string;
}

export default function GalleryPage() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string>("ALL");
  const [activeLightbox, setActiveLightbox] = useState<number | null>(null);

  useEffect(() => {
    async function loadGallery() {
      const events = await db.fetchEvents();
      const collected: GalleryPhoto[] = [];

      events.forEach((evt) => {
        if (evt.galleryImages && evt.galleryImages.length > 0) {
          evt.galleryImages.forEach((imgUrl, i) => {
            collected.push({
              url: imgUrl,
              caption: `${evt.title} – Snapshot #${i + 1}`,
              event: evt.title,
            });
          });
        }
      });

      setPhotos(collected);
      setLoading(false);
    }

    loadGallery();
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
            Live Media Archives
          </span>
          <h1 className="text-3xl sm:text-5xl font-montserrat font-extrabold text-ieee-navy">
            Chapter Event Photo Gallery
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
            Real-time moments and technical highlights captured across official IEEE CS chapter expos, workshops, and ceremonies at UCET IUB.
          </p>
        </div>

        {/* Filter Pills if multiple events have photos */}
        {eventList.length > 2 && (
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
        )}

        {/* Real-time Content or Empty State */}
        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            Loading real-time gallery moments from database...
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-card p-12 text-center space-y-3">
            <Camera className="mx-auto text-gray-400" size={36} />
            <h3 className="font-montserrat font-bold text-gray-800 text-base">
              No Gallery Photos Published Yet
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
              Photographs attached to completed events in the Events Manager will dynamically appear here in real time.
            </p>
            <div className="pt-2">
              <Link
                href="/admin/events"
                className="inline-flex items-center text-xs font-montserrat font-bold text-ieee-blue hover:underline"
              >
                Go to Events Manager &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPhotos.map((item, idx) => (
              <div
                key={idx}
                onClick={() => setActiveLightbox(idx)}
                className="bg-white border border-gray-200 rounded-card overflow-hidden shadow-sm group cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="h-56 w-full overflow-hidden bg-gray-100 relative">
                  <img
                    src={item.url}
                    alt={item.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
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
        )}

        {/* Lightbox Modal */}
        {activeLightbox !== null && filteredPhotos.length > 0 && (
          <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 select-none"
            onClick={() => setActiveLightbox(null)}
          >
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-20">
              <div className="text-xs font-montserrat font-semibold">
                <span className="text-blue-300">{filteredPhotos[activeLightbox].event}</span> &bull; {activeLightbox + 1} of {filteredPhotos.length}
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={filteredPhotos[activeLightbox].url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink size={14} /> Open Full Size
                </a>
                <button
                  onClick={() => setActiveLightbox(null)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {filteredPhotos.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveLightbox((activeLightbox - 1 + filteredPhotos.length) % filteredPhotos.length);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors z-20"
                aria-label="Previous Photo"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            <div
              className="max-w-4xl max-h-[80vh] w-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={filteredPhotos[activeLightbox].url}
                alt={filteredPhotos[activeLightbox].caption}
                className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl"
              />
            </div>

            {filteredPhotos.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveLightbox((activeLightbox + 1) % filteredPhotos.length);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors z-20"
                aria-label="Next Photo"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
