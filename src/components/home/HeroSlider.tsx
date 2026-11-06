"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  Calendar,
  ShieldCheck,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Pause,
  Play,
  Camera,
  MapPin,
} from "lucide-react";
import { formatPKTDateOnly } from "@/lib/sha256";

export interface HeroSlide {
  id: string;
  imageUrl: string;
  eventTitle: string;
  eventDate?: string;
  venue?: string;
  slug?: string;
  isUpcoming?: boolean;
  badgeText?: string;
}

interface HeroSliderProps {
  slides: HeroSlide[];
}

export const HeroSlider: React.FC<HeroSliderProps> = ({ slides }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const totalSlides = slides.length;

  const handleNext = useCallback(() => {
    if (totalSlides === 0) return;
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const handlePrev = useCallback(() => {
    if (totalSlides === 0) return;
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // 5-second automatic rotator
  useEffect(() => {
    if (totalSlides <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      handleNext();
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [totalSlides, isPaused, handleNext]);

  const currentSlide = totalSlides > 0 ? slides[currentIndex] : null;

  return (
    <section
      aria-label="IEEE Computer Society UCET-IUB Past Events Showcase"
      className="relative min-h-[560px] sm:min-h-[620px] md:min-h-[660px] flex items-center justify-center overflow-hidden bg-[#001733] select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* 1. Background Image Slider */}
      {totalSlides > 0 ? (
        <div className="absolute inset-0 z-0">
          {slides.map((slide, idx) => {
            const isActive = idx === currentIndex;
            return (
              <div
                key={`${slide.id}-${idx}`}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                  isActive
                    ? "opacity-100 scale-100 z-10"
                    : "opacity-0 scale-105 pointer-events-none z-0"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.imageUrl}
                  alt={slide.eventTitle}
                  className="w-full h-full object-cover object-center transform transition-transform duration-[7000ms]"
                />
              </div>
            );
          })}
        </div>
      ) : (
        /* Fallback subtle geometric grid backdrop if no photos yet */
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />
      )}

      {/* 2. Professional Brand Overlay Gradient (ensures WCAG AA compliant readability while keeping photo vivid) */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#001428]/88 via-[#002855]/62 to-[#001733]/68 backdrop-brightness-95" />
      <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,20,40,0.55)_100%)]" />

      {/* 3. Hero Content Container */}
      <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-8 py-16 sm:py-20 text-center text-white space-y-6">
        {/* Chapter Logo Brand Lockup */}
        <div className="flex justify-center mb-1">
          <Image
            src="/ieee-cs-logo-white.png"
            alt="IEEE Computer Society"
            width={240}
            height={73}
            priority
            className="h-11 sm:h-14 md:h-16 w-auto object-contain drop-shadow-lg"
          />
        </div>

        {/* Official Chapter Badge / Dynamic Slide State */}
        <div className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-montserrat font-semibold tracking-wide text-ieee-cyan shadow-sm transition-all duration-300">
          {currentSlide?.isUpcoming ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span className="text-emerald-300 font-bold uppercase tracking-wider">
                Upcoming Chapter Activity • Registrations Open
              </span>
            </>
          ) : (
            <>
              <Sparkles size={14} className="text-ieee-orange animate-pulse" />
              <span>Official Student Branch Chapter • UCET, IUB</span>
            </>
          )}
        </div>

        {/* Main Hero Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight font-montserrat max-w-4xl mx-auto drop-shadow-md">
          IEEE Computer Society at{" "}
          <span className="text-ieee-orange underline decoration-ieee-cyan decoration-4 underline-offset-8">
            UCET-IUB
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base md:text-xl text-gray-200 max-w-3xl mx-auto font-openSans font-normal leading-relaxed drop-shadow-sm px-2">
          Empowering engineers and computing students through hands-on technical
          workshops, cutting-edge hackathons, mentorship, and cryptographic,
          tamper-evident credential verification.
        </p>

        {/* Three Action Buttons */}
        <div className="pt-2 sm:pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Button href="/events" variant="primary" size="lg" className="w-full sm:w-auto shadow-md">
            <Calendar size={18} className="mr-2" />
            Upcoming Events
          </Button>

          <Button
            href="/verify"
            variant="outline"
            size="lg"
            className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-ieee-navy shadow-md"
          >
            <ShieldCheck size={18} className="mr-2 text-ieee-cyan" />
            Verify QR Credential
          </Button>

          <Button href="/membership" variant="accent" size="lg" className="w-full sm:w-auto shadow-md">
            Join the Chapter
          </Button>
        </div>

        {/* 4. Live Event Showcase Tag (Auto-rotates every 5s) */}
        {currentSlide && (
          <div className="pt-4 sm:pt-6">
            <div
              className={`inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-3 px-4 py-2 sm:py-2.5 rounded-2xl sm:rounded-full backdrop-blur-md text-xs transition-all shadow-xl max-w-2xl mx-auto border ${
                currentSlide.isUpcoming
                  ? "bg-ieee-blue/65 hover:bg-ieee-blue/85 border-ieee-cyan/70 shadow-cyan-900/40"
                  : "bg-black/45 hover:bg-black/60 border-white/20"
              }`}
            >
              <div className="flex items-center gap-1.5 font-montserrat font-bold whitespace-nowrap">
                {currentSlide.isUpcoming ? (
                  <>
                    <Sparkles size={14} className="text-emerald-300 animate-spin" />
                    <span className="text-emerald-300">Upcoming Event:</span>
                  </>
                ) : (
                  <>
                    <Camera size={14} className="text-ieee-cyan" />
                    <span className="text-ieee-orange">Past Event Spotlight:</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 overflow-hidden text-center sm:text-left">
                <span className="font-semibold text-white truncate max-w-xs sm:max-w-md">
                  {currentSlide.eventTitle}
                </span>
                {currentSlide.eventDate && (
                  <span className="text-gray-300 hidden md:inline text-[11px]">
                    • {formatPKTDateOnly(currentSlide.eventDate)}
                  </span>
                )}
              </div>
              {currentSlide.slug && (
                <Link
                  href={`/events/${currentSlide.slug}`}
                  className={`text-[11px] whitespace-nowrap flex items-center gap-1 transition-all ${
                    currentSlide.isUpcoming
                      ? "bg-gradient-to-r from-emerald-400 to-ieee-cyan text-ieee-navy font-extrabold px-3 py-1 rounded-full shadow-md hover:brightness-110"
                      : "text-ieee-cyan hover:text-white underline font-medium"
                  }`}
                >
                  {currentSlide.isUpcoming ? "Register Now" : "View Details"}{" "}
                  <ExternalLink size={11} />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 5. Slider Controls & Indicators */}
      {totalSlides > 1 && (
        <>
          {/* Previous Arrow */}
          <button
            onClick={handlePrev}
            aria-label="Previous slide"
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full bg-black/35 hover:bg-black/70 text-white/80 hover:text-white border border-white/10 hover:border-white/30 backdrop-blur-sm transition-all shadow-lg focus:outline-none"
          >
            <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
          </button>

          {/* Next Arrow */}
          <button
            onClick={handleNext}
            aria-label="Next slide"
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full bg-black/35 hover:bg-black/70 text-white/80 hover:text-white border border-white/10 hover:border-white/30 backdrop-blur-sm transition-all shadow-lg focus:outline-none"
          >
            <ChevronRight size={20} className="sm:w-6 sm:h-6" />
          </button>

          {/* Slide Indicators & Auto-play Pause Toggle */}
          <div className="absolute bottom-4 left-0 right-0 z-30 flex items-center justify-center gap-2 px-4">
            <button
              onClick={() => setIsPaused(!isPaused)}
              aria-label={isPaused ? "Resume auto slideshow" : "Pause auto slideshow"}
              className="text-white/70 hover:text-white p-1 rounded-full bg-black/30 hover:bg-black/50 transition-colors mr-1"
              title={isPaused ? "Resume slideshow (5s)" : "Pause slideshow"}
            >
              {isPaused ? <Play size={12} /> : <Pause size={12} />}
            </button>

            <div className="flex items-center gap-1.5 max-w-[280px] overflow-x-auto py-1.5 no-scrollbar">
              {slides.map((slide, idx) => {
                const isCurrent = idx === currentIndex;
                const isUpcoming = Boolean(slide.isUpcoming);
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    title={
                      isUpcoming
                        ? `Upcoming: ${slide.eventTitle}`
                        : `Past: ${slide.eventTitle}`
                    }
                    className={`h-2 rounded-full transition-all duration-300 flex-shrink-0 ${
                      isCurrent
                        ? isUpcoming
                          ? "w-8 bg-emerald-400 shadow-sm"
                          : "w-7 bg-ieee-orange shadow-sm"
                        : isUpcoming
                        ? "w-2.5 bg-emerald-400/50 hover:bg-emerald-300"
                        : "w-2 bg-white/40 hover:bg-white/70"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </>
      )}
    </section>
  );
};

