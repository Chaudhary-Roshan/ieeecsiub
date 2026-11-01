import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getEvents } from "@/lib/data/events";
import { formatPKTDateOnly, formatPKTDateTime } from "@/lib/sha256";
import {
  Calendar,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Code2,
  Trophy,
  Users2,
  CheckCircle,
  ExternalLink,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const events = await getEvents({ publishedOnly: true });

  const upcomingEvents = events.filter((e) => e.status === "UPCOMING" || e.status === "ONGOING").slice(0, 3);
  const completedEvents = events.filter((e) => e.status === "COMPLETED").slice(0, 3);

  return (
    <div className="flex flex-col w-full">
      {/* 1. Hero Section with Brand IEEE Navy Gradient */}
      <section className="relative min-h-[520px] md:min-h-[580px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#001733] via-ieee-navy to-[#003B73]">
        {/* Subtle geometric grid backdrop */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

        {/* Content Container */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 py-20 text-center text-white space-y-6">
          <div className="flex justify-center mb-2">
            <Image
              src="/ieee-cs-logo-white.png"
              alt="IEEE Computer Society"
              width={240}
              height={73}
              priority
              className="h-12 sm:h-14 md:h-16 w-auto object-contain drop-shadow-md"
            />
          </div>
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full text-xs font-montserrat font-semibold tracking-wide text-ieee-cyan">
            <Sparkles size={14} />
            Official Student Branch Chapter • UCET, IUB
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight font-montserrat max-w-4xl mx-auto">
            IEEE Computer Society at{" "}
            <span className="text-ieee-orange underline decoration-ieee-cyan decoration-4 underline-offset-8">
              UCET-IUB
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-gray-200 max-w-3xl mx-auto font-openSans font-normal leading-relaxed">
            Empowering engineers and computing students through hands-on technical
            workshops, cutting-edge hackathons, mentorship, and cryptographic,
            tamper-evident credential verification.
          </p>

          {/* Three Pill Buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Button href="/events" variant="primary" size="lg">
              <Calendar size={18} className="mr-2" />
              Upcoming Events
            </Button>

            <Button href="/verify" variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-ieee-navy">
              <ShieldCheck size={18} className="mr-2 text-ieee-cyan" />
              Verify a Certificate
            </Button>

            <Button href="/membership" variant="accent" size="lg">
              Join the Chapter
            </Button>
          </div>
        </div>
      </section>

      {/* 2. Statistics Band: IEEE Blue (#00629B) with Process Cyan (#00B5E2) highlight numbers */}
      <section className="bg-ieee-blue text-white py-10 px-4 sm:px-8 border-y border-white/10 shadow-inner">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl md:text-5xl font-montserrat font-extrabold text-ieee-cyan">
              18+
            </div>
            <div className="text-xs sm:text-sm uppercase tracking-wider font-montserrat font-semibold text-white/90">
              Technical Events Held
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl md:text-5xl font-montserrat font-extrabold text-ieee-cyan">
              240+
            </div>
            <div className="text-xs sm:text-sm uppercase tracking-wider font-montserrat font-semibold text-white/90">
              Active Chapter Members
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl md:text-5xl font-montserrat font-extrabold text-ieee-cyan">
              12+
            </div>
            <div className="text-xs sm:text-sm uppercase tracking-wider font-montserrat font-semibold text-white/90">
              Hands-on Workshops
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl md:text-5xl font-montserrat font-extrabold text-ieee-cyan">
              100%
            </div>
            <div className="text-xs sm:text-sm uppercase tracking-wider font-montserrat font-semibold text-white/90">
              Verifiable Certificates
            </div>
          </div>
        </div>
      </section>

      {/* 3. Three-Column Cards: Workshops, Competitions, Volunteering */}
      <section className="py-16 md:py-24 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-montserrat font-bold text-ieee-orange uppercase tracking-widest block">
            What We Do
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold font-montserrat text-ieee-navy">
            Building Future Computing Leaders
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            From modern AI frameworks to competitive programming and community leadership,
            we bridge academia and the global tech ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Workshops */}
          <div className="bg-white border border-ieee-border rounded-card p-8 flex flex-col justify-between hover:shadow-md transition-shadow group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-ieee-surfaceTint flex items-center justify-center text-ieee-blue mb-6 group-hover:scale-110 transition-transform">
                <Code2 size={26} />
              </div>
              <h3 className="font-montserrat font-bold text-xl text-ieee-navy mb-3">
                Hands-on Technical Workshops
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Practical, code-along bootcamps in AI agents, Flutter, Cloud, and Web
                technologies taught by industry engineers.
              </p>
            </div>
            <Link
              href="/events"
              className="inline-flex items-center text-xs font-montserrat font-bold text-ieee-blue group-hover:text-ieee-navy transition-colors"
            >
              Explore our workshops <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Card 2: Competitions */}
          <div className="bg-white border border-ieee-border rounded-card p-8 flex flex-col justify-between hover:shadow-md transition-shadow group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#FEF3D6] flex items-center justify-center text-ieee-orange mb-6 group-hover:scale-110 transition-transform">
                <Trophy size={26} />
              </div>
              <h3 className="font-montserrat font-bold text-xl text-ieee-navy mb-3">
                Hackathons & CodeSprints
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                IEEE Extreme prep bootcamps, algorithmic contests, and multi-day product
                hackathons that test innovation under time constraints.
              </p>
            </div>
            <Link
              href="/events"
              className="inline-flex items-center text-xs font-montserrat font-bold text-ieee-blue group-hover:text-ieee-navy transition-colors"
            >
              View competition schedule <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Card 3: Volunteering */}
          <div className="bg-white border border-ieee-border rounded-card p-8 flex flex-col justify-between hover:shadow-md transition-shadow group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#E6F4EA] flex items-center justify-center text-status-active mb-6 group-hover:scale-110 transition-transform">
                <Users2 size={26} />
              </div>
              <h3 className="font-montserrat font-bold text-xl text-ieee-navy mb-3">
                Leadership & Volunteering
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Develop management, technical writing, event coordination, and public
                speaking skills inside a globally recognized entity.
              </p>
            </div>
            <Link
              href="/membership"
              className="inline-flex items-center text-xs font-montserrat font-bold text-ieee-blue group-hover:text-ieee-navy transition-colors"
            >
              Get involved locally <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Upcoming Events Section */}
      <section className="bg-gray-50 py-16 md:py-24 px-4 sm:px-8 border-y border-ieee-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-montserrat font-bold text-ieee-orange uppercase tracking-widest block mb-2">
                Join Us
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold font-montserrat text-ieee-navy">
                Upcoming Chapter Events
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                All event times are presented in Pakistan Standard Time (PKT, UTC+5).
              </p>
            </div>
            <Button href="/events" variant="outline" size="sm">
              View All Events
            </Button>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-card p-10 text-center space-y-2">
              <Calendar className="mx-auto text-gray-400" size={32} />
              <h3 className="font-montserrat font-bold text-gray-800 text-sm">
                No Upcoming Events Scheduled Right Now
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                New technical bootcamps and competitions are being organized. Check back soon or view our completed events and expos below!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {upcomingEvents.map((evt) => {
                const eventSlug = (evt.slug || "").trim().replace(/^\/+/, "");
                return (
                  <div
                    key={evt.id}
                    className="bg-white border border-ieee-border rounded-card overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all group"
                  >
                    <div>
                      <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
                        <img
                          src={evt.featuredImage || "/ieee-cs-logo.png"}
                          alt={evt.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            if (!target.src.includes("ieee-cs-logo.png")) {
                              target.src = "/ieee-cs-logo.png";
                              target.className = "w-full h-full object-contain p-4";
                            }
                          }}
                        />
                        <div className="absolute top-3 right-3">
                          <Badge status={evt.status} />
                        </div>
                      </div>

                      <div className="p-6 space-y-3">
                        <div className="flex items-center gap-1.5 text-xs text-ieee-blue font-semibold">
                          <Calendar size={14} />
                          <span>{formatPKTDateTime(evt.startDate)}</span>
                        </div>

                        <h3 className="font-montserrat font-bold text-lg text-ieee-navy group-hover:text-ieee-blue transition-colors line-clamp-2">
                          <Link href={`/events/${eventSlug}`}>
                            {evt.title}
                          </Link>
                        </h3>

                        <p className="text-xs text-gray-600 line-clamp-2">
                          {evt.description}
                        </p>

                        <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-1">
                          <MapPin size={13} className="text-ieee-muted" />
                          <span className="truncate">{evt.venue}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 pt-0 border-t border-gray-100 mt-4 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700">
                        {evt.feePkr > 0 ? `PKR ${evt.feePkr}` : "Free Event"}
                      </span>
                      <Link
                        href={`/events/${eventSlug}`}
                        className="inline-flex items-center text-xs font-montserrat font-bold text-ieee-blue hover:underline"
                      >
                        View & Register &rarr;
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 5. Recent Completed Activities & Reports */}
      <section className="py-16 md:py-24 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-montserrat font-bold text-ieee-orange uppercase tracking-widest block">
            Impact & Transparency
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold font-montserrat text-ieee-navy">
            Recent Completed Activities
          </h2>
          <p className="text-gray-600 text-sm">
            Permanent records, photo galleries, and post-event technical reports published
            within 7 days of each event.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {completedEvents.map((evt) => {
            const eventSlug = (evt.slug || "").trim().replace(/^\/+/, "");
            return (
              <div
                key={evt.id}
                className="bg-white border border-ieee-border rounded-card overflow-hidden flex flex-col sm:flex-row shadow-sm group"
              >
                <div className="sm:w-2/5 h-48 sm:h-auto relative bg-gray-200">
                  <img
                    src={evt.featuredImage || "/ieee-cs-logo.png"}
                    alt={evt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="p-6 sm:w-3/5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-ieee-muted">
                      <span>{formatPKTDateOnly(evt.startDate)}</span>
                      <Badge status="COMPLETED" size="sm" />
                    </div>

                    <h3 className="font-montserrat font-bold text-base text-ieee-navy group-hover:text-ieee-blue transition-colors">
                      <Link href={`/events/${eventSlug}`}>
                        {evt.title}
                      </Link>
                    </h3>

                    <p className="text-xs text-gray-600 line-clamp-3">
                      {evt.eventReport || evt.description}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] text-ieee-muted">
                      vTools L31 Filed
                    </span>
                    <Link
                      href={`/events/${eventSlug}`}
                      className="inline-flex items-center text-xs font-montserrat font-bold text-ieee-blue hover:underline"
                    >
                      View Report & Photos <ArrowRight size={12} className="ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Membership Comparison Block */}
      <section className="bg-ieee-surfaceTint/40 py-16 px-4 sm:px-8 border-y border-ieee-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 space-y-2">
            <span className="text-xs font-montserrat font-bold text-ieee-orange uppercase tracking-widest block">
              Join Our Community
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-montserrat text-ieee-navy">
              Two Paths of Chapter Participation
            </h2>
            <p className="text-gray-600 text-xs sm:text-sm max-w-xl mx-auto">
              We maintain clear separation between free local university participation
              and official global IEEE Computer Society membership.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Free Path */}
            <div className="bg-white border-2 border-ieee-blue rounded-card p-8 flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-montserrat font-bold text-xl text-ieee-navy">
                    Local Participation
                  </h3>
                  <span className="bg-[#E6F4EA] text-[#00843D] text-xs font-bold px-3 py-1 rounded-full">
                    Free
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Open to all currently enrolled undergraduate & graduate students at UCET
                  and The Islamia University of Bahawalpur.
                </p>
                <ul className="space-y-2.5 text-xs text-gray-700 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={15} className="text-status-active" />
                    Attend on-campus workshops & open technical seminars
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={15} className="text-status-active" />
                    Receive verifiable chapter certificates of participation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={15} className="text-status-active" />
                    Volunteer in organizing committees and hackathons
                  </li>
                </ul>
              </div>
              <div className="pt-8">
                <Button href="/membership" variant="accent" size="md" className="w-full">
                  Join Local Chapter (Free)
                </Button>
              </div>
            </div>

            {/* Paid Official IEEE Path */}
            <div className="bg-white border border-gray-300 rounded-card p-8 flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-montserrat font-bold text-xl text-ieee-navy">
                    Official IEEE CS Member
                  </h3>
                  <span className="bg-gray-100 text-gray-800 text-xs font-bold px-3 py-1 rounded-full">
                    Paid via IEEE.org
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Global professional membership handled directly by IEEE headquarters in
                  the USA with student concession rates.
                </p>
                <ul className="space-y-2.5 text-xs text-gray-700 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={15} className="text-ieee-blue" />
                    Access to IEEE Xplore Digital Library & Computer Magazine
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={15} className="text-ieee-blue" />
                    IEEE @ieee.org Google Workspace email alias
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={15} className="text-ieee-blue" />
                    Eligibility for international IEEE officer positions & grants
                  </li>
                </ul>
              </div>
              <div className="pt-8">
                <Button
                  href="https://www.computer.org/membership/join"
                  external
                  variant="outline"
                  size="md"
                  className="w-full"
                >
                  Join via IEEE.org <ExternalLink size={14} className="ml-1.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Partners & Academic Collaboration */}
      <section className="py-14 px-4 sm:px-8 max-w-7xl mx-auto w-full text-center">
        <h4 className="text-xs font-montserrat font-bold text-ieee-muted uppercase tracking-widest mb-6">
          Affiliated Academic Institutions & Partners
        </h4>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-80">
          <div className="font-montserrat font-bold text-gray-700 text-sm">
            University College of Engineering & Technology (UCET)
          </div>
          <div className="font-montserrat font-bold text-gray-700 text-sm">
            The Islamia University of Bahawalpur (IUB)
          </div>
          <div className="font-montserrat font-bold text-gray-700 text-sm">
            IEEE Lahore Section
          </div>
          <div className="font-montserrat font-bold text-gray-700 text-sm">
            IEEE Bahawalpur Subsection
          </div>
          <div className="font-montserrat font-bold text-gray-700 text-sm">
            EnlivenAI (Technical Partner)
          </div>
        </div>
      </section>
    </div>
  );
}
