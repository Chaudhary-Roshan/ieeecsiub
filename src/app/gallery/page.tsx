import React from "react";
import { getEvents } from "@/lib/data/events";
import { GalleryClient, GalleryPhoto } from "@/components/gallery/GalleryClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Media Gallery | IEEE CS UCET-IUB",
  description: "Live photos and moments captured across official IEEE CS UCET-IUB events.",
};

export default async function GalleryPage() {
  const events = await getEvents();
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
    } else if (evt.featuredImage && evt.featuredImage !== "/ieee-cs-logo.png") {
      collected.push({
        url: evt.featuredImage,
        caption: `${evt.title} – Featured Highlight`,
        event: evt.title,
      });
    }
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

        {/* Real-time Content */}
        <GalleryClient initialPhotos={collected} />
      </div>
    </div>
  );
}
