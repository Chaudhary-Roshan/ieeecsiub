"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatPKTDateOnly } from "@/lib/sha256";
import { Newspaper, Calendar, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface NewsItem {
  id: string;
  title: string;
  date: string;
  category: string;
  summary: string;
  imageUrl?: string;
}

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNews() {
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from("news")
            .select("*")
            .order("published_date", { ascending: false });
          if (data && !error && data.length > 0) {
            setArticles(
              data.map((d: any) => ({
                id: d.id,
                title: d.title,
                date: d.published_date,
                category: "Announcements",
                summary: d.summary,
                imageUrl: d.image_url,
              }))
            );
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn("Supabase news load fallback:", err);
        }
      }
      setArticles([]);
      setLoading(false);
    }

    loadNews();
  }, []);

  return (
    <div className="flex-1 bg-gray-50 py-12 md:py-20 px-4 sm:px-8 font-openSans">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="space-y-3">
          <span className="text-xs font-montserrat font-bold text-ieee-orange uppercase tracking-widest block">
            Official Bulletins
          </span>
          <h1 className="text-3xl sm:text-5xl font-montserrat font-extrabold text-ieee-navy">
            Chapter News & Technical Bulletins
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
            Live technical bulletins, competition announcements, and executive reports from the IEEE Computer Society Student Branch Chapter, UCET IUB.
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            Loading official announcements from database...
          </div>
        ) : articles.length === 0 ? (
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
            {articles.map((art) => (
              <div
                key={art.id}
                className="bg-white border border-gray-200 rounded-card overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group"
              >
                <div>
                  {art.imageUrl && (
                    <div className="h-48 w-full bg-gray-100 overflow-hidden relative">
                      <img
                        src={art.imageUrl}
                        alt={art.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3 bg-ieee-navy/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                        {art.category}
                      </div>
                    </div>
                  )}

                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
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
                    Official Bulletin <ArrowRight size={13} className="ml-1" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
