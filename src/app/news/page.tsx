import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatPKTDateOnly } from "@/lib/sha256";
import { Newspaper, Calendar, ArrowRight } from "lucide-react";

export default function NewsPage() {
  const articles = [
    {
      id: "news-1",
      title: "IEEE CS UCET-IUB Launches Automated Two-Option Certificate Verification System",
      date: "2026-10-30",
      category: "Announcements",
      summary:
        "The chapter has deployed its Next.js and Supabase backed credential platform, providing instantaneous QR code lookups and cryptographic SHA-256 validation.",
      imageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "news-2",
      title: "Hands-on Flutter & Cloud Mobile Workshop Concludes with 45 Certified Students",
      date: "2026-03-18",
      category: "Event Reports",
      summary:
        "Two days of rigorous mobile development concluded with keynote addresses from Dr. Asjad Amin and Dr. Aoun Muhammad.",
      imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "news-3",
      title: "Executive Committee Tenure 2026-2027 Officially Appointed",
      date: "2026-01-05",
      category: "Governance",
      summary:
        "New executive leadership team announced, led by Chapter Chair Muhammad Roshan Ashraf and General Secretary Ayesha Siddiqa.",
      imageUrl: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80",
    },
  ];

  return (
    <div className="flex-1 bg-gray-50 py-12 md:py-20 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="space-y-3">
          <span className="text-xs font-montserrat font-bold text-ieee-orange uppercase tracking-widest block">
            Announcements & Reports
          </span>
          <h1 className="text-3xl sm:text-5xl font-montserrat font-extrabold text-ieee-navy">
            Chapter News & Technical Bulletins
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
            Stay updated with chapter executive decisions, post-event technical reports,
            and competition callouts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.map((art) => (
            <div
              key={art.id}
              className="bg-white border border-ieee-border rounded-card overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group"
            >
              <div>
                <div className="h-48 w-full bg-gray-200 overflow-hidden relative">
                  <img
                    src={art.imageUrl}
                    alt={art.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-ieee-navy/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                    {art.category}
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs text-ieee-muted">
                    <Calendar size={13} />
                    <span>{formatPKTDateOnly(art.date)}</span>
                  </div>

                  <h3 className="font-montserrat font-bold text-base text-ieee-navy group-hover:text-ieee-blue transition-colors line-clamp-2">
                    {art.title}
                  </h3>

                  <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                    {art.summary}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0 border-t border-gray-100 mt-2">
                <span className="inline-flex items-center text-xs font-montserrat font-bold text-ieee-blue group-hover:text-ieee-navy">
                  Read Full Bulletin <ArrowRight size={13} className="ml-1" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
