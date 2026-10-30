import React from "react";
import { Image as ImageIcon, Calendar } from "lucide-react";

export default function GalleryPage() {
  const images = [
    {
      url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80",
      caption: "Interactive Coding Workshop at Computer Center",
      event: "Hands-on Flutter & Cloud 2026",
    },
    {
      url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80",
      caption: "Keynote Address by Dr. Aoun Muhammad & Faculty",
      event: "Spring Tech Symposium",
    },
    {
      url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80",
      caption: "Collaborative Open Source Git Sprint",
      event: "Git & GitHub Workshop",
    },
    {
      url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
      caption: "Certificate Distribution Ceremony",
      event: "Hands-on Flutter & Cloud 2026",
    },
    {
      url: "https://images.unsplash.com/photo-1531497865144-0464ef8fb9a9?auto=format&fit=crop&w=800&q=80",
      caption: "Student Participants Presenting Final Capstones",
      event: "Summer Hackathon",
    },
    {
      url: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80",
      caption: "Executive Team Strategy Session with Branch Counselor",
      event: "Advisory Council 2026",
    },
  ];

  return (
    <div className="flex-1 bg-gray-50 py-12 md:py-20 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="space-y-3">
          <span className="text-xs font-montserrat font-bold text-ieee-orange uppercase tracking-widest block">
            Media & Activity Archives
          </span>
          <h1 className="text-3xl sm:text-5xl font-montserrat font-extrabold text-ieee-navy">
            Chapter Event Photo Gallery
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
            Visual moments captured across workshops, seminars, and award ceremonies at
            UCET, The Islamia University of Bahawalpur.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-ieee-border rounded-card overflow-hidden shadow-sm group"
            >
              <div className="h-56 w-full overflow-hidden bg-gray-200 relative">
                <img
                  src={item.url}
                  alt={item.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4 space-y-1 text-xs">
                <p className="font-montserrat font-bold text-gray-900 leading-snug">
                  {item.caption}
                </p>
                <span className="text-ieee-blue font-semibold block text-[11px]">
                  {item.event}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
