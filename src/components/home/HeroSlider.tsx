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

      {/* 2. Professional Brand Overlay Gradient (ensures WCAG AA compliant readability) */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#001428] via-[#002855]/85 to-[#001733]/90 backdrop-brightness-75" />
      <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,20,40,0.8)_100%)]" />

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

        {/* Official Chapter Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-montserrat font-semibold tracking-wide text-ieee-cyan shadow-sm transition-colors">
          <Sparkles size={14} className="text-ieee-orange animate-pulse" />
          <span>Official Student Branch Chapter • UCET, IUB</span>
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

        {/* 4. Live Past Event Showcase Tag (Auto-rotates every 5s) */}
        {currentSlide && (
          <div className="pt-4 sm:pt-6">
            <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-3 bg-black/45 hover:bg-black/60 border border-white/20 px-4 py-2 sm:py-2.5 rounded-2xl sm:rounded-full backdrop-blur-md text-xs transition-all shadow-xl max-w-2xl mx-auto">
              <div className="flex items-center gap-1.5 text-ieee-orange font-montserrat font-bold whitespace-nowrap">
                <Camera size={14} className="text-ieee-cyan" />
                <span>Past Event Highlight ({currentIndex + 1}/{totalSlides}):</span>
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
                  className="text-ieee-cyan hover:text-white underline font-medium text-[11px] whitespace-nowrap flex items-center gap-1"
                >
                  View Details <ExternalLink size={11} />
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
            aria-label="Previous past event photo"
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full bg-black/35 hover:bg-black/70 text-white/80 hover:text-white border border-white/10 hover:border-white/30 backdrop-blur-sm transition-all shadow-lg focus:outline-none"
          >
            <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
          </button>

          {/* Next Arrow */}
          <button
            onClick={handleNext}
            aria-label="Next past event photo"
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

            <div className="flex items-center gap-1.5 max-w-[260px] overflow-x-auto py-1 custom-scrollbar">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Go to past event photo ${idx + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? "w-7 bg-ieee-orange shadow-sm"
                      : "w-2 bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>

            <span className="text-[10px] text-gray-300 font-mono hidden sm:inline ml-1">
              5s auto-change
            </span>
          </div>
        </>
      )}
    </section>
  );
};

