import React from "react";
import Link from "next/link";
import { formatPKTDateOnly } from "@/lib/sha256";
import { Newspaper, Calendar, ArrowRight, Sparkles } from "lucide-react";
import { getEvents } from "@/lib/data/events";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "News & Bulletins | IEEE CS UCET-IUB",
  description: "Official announcements, technical reports, and event bulletins from IEEE Computer Society UCET-IUB.",
};

interface NewsItem {
  id: string;
  title: string;
  date: string;
  category: string;
  summary: string;
  imageUrl?: string;
  link?: string;
}

export default async function NewsPage() {
  const supabase = await createClient();
  const events = await getEvents();

  let dbArticles: NewsItem[] = [];

  try {
    const { data, error } = await supabase
      .from("news")
      .select("*")
      .order("published_date", { ascending: false });

    if (!error && data && data.length > 0) {
      dbArticles = data.map((d: any) => ({
        id: d.id,
        title: d.title,
        date: d.published_date,
        category: d.category || "Announcements",
        summary: d.summary || "",
        imageUrl: d.image_url || "/ieee-cs-logo.png",
      }));
    }
  } catch (err) {
    console.warn("News fetch warning:", err);
  }

  // Dynamic Event-derived bulletins synchronized with database events
  const eventBulletins: NewsItem[] = events.map((evt) => ({
    id: `event-bulletin-${evt.id}`,
    title: evt.status === "COMPLETED" 
      ? `${evt.title} Concludes with Outstanding Student Participation`
      : `Upcoming: ${evt.title} Registration & Technical Program Details`,
    date: evt.startDate,
    category: evt.status === "COMPLETED" ? "Expos & Competitions" : "Upcoming Events",
    summary: evt.description.slice(0, 180) + (evt.description.length > 180 ? "..." : ""),
    imageUrl: evt.featuredImage || "/ieee-cs-logo.png",
    link: `/events/${evt.slug}`,
  }));

  // Combine and deduplicate
  const allArticles: NewsItem[] = [...dbArticles, ...eventBulletins];

  return (
    <div className="flex-1 bg-gray-50 py-12 md:py-20 px-4 sm:px-8 font-openSans">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-ieee-blue text-xs font-montserrat font-bold uppercase tracking-wider">
            <Sparkles size={14} className="text-ieee-orange" />
            Live Official Bulletins
          </div>
          <h1 className="text-3xl sm:text-5xl font-montserrat font-extrabold text-ieee-navy">
            Chapter News & Technical Bulletins
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
            Real-time technical bulletins, competition announcements, and executive reports from the IEEE Computer Society Student Branch Chapter, UCET IUB.
          </p>
        </div>

        {allArticles.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-card p-12 text-center space-y-3">
            <Newspaper className="mx-auto text-gray-400" size={36} />
            <h3 className="font-montserrat font-bold text-gray-800 text-base">
              No Announcements Published Yet
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
              Official chapter press releases, technical notices, and competition callouts will appear here in real time.
            </p>
            <div className="pt-2">
              <Link
                href="/events"
                className="inline-flex items-center text-xs font-montserrat font-bold text-ieee-blue hover:underline"
              >
                Browse Chapter Events &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {allArticles.map((art) => (
              <div
                key={art.id}
                className="bg-white border border-ieee-border rounded-card overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group"
              >
                <div>
                  <div className="h-44 w-full bg-gradient-to-br from-blue-900 to-indigo-950 relative overflow-hidden flex items-center justify-center p-4">
                    <img
                      src={art.imageUrl || "/ieee-cs-logo.png"}
                      alt={art.title}
                      className="max-h-24 w-auto object-contain opacity-90 group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-ieee-navy text-[10px] font-montserrat font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-2xs">
                      {art.category}
                    </div>
                  </div>

                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                      <Calendar size={13} className="text-ieee-blue" />
                      <span>{formatPKTDateOnly(art.date)}</span>
                    </div>

                    <h2 className="font-montserrat font-bold text-base text-ieee-navy group-hover:text-ieee-blue transition-colors line-clamp-2">
                      {art.title}
                    </h2>

                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                      {art.summary}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-gray-100 flex items-center justify-between text-xs font-montserrat font-bold text-ieee-blue">
                  <Link
                    href={art.link || "/events"}
                    className="inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                  >
                    Read Details <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
