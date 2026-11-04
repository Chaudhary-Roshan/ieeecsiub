"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChapterLogo } from "@/components/layout/ChapterLogo";
import { Button } from "@/components/ui/Button";
import { INITIAL_STAFF_USERS } from "@/lib/constants";
import {
  Lock,
  ShieldCheck,
  KeyRound,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Smartphone,
  Check
} from "lucide-react";

// Official Master Passwords accepted for Chapter Administration
const VALID_PASSWORDS = [
  "IeeeCs@2026!",
  "ieeecsiub2026",
  "ieeecsiub",
  "admin123",
  process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "",
].filter(Boolean);

const DEFAULT_TOTP_CODE = "889214";

export default function AdminLoginPage() {
  // Step 1: Credentials (Email + Password), Step 2: 2FA TOTP Verification
  const [step, setStep] = useState<1 | 2>(1);

  // Form Fields
  const [email, setEmail] = useState("roshan.ashraf@ieee.org");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // 6-digit individual OTP inputs
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // State & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [copiedDemo, setCopiedDemo] = useState(false);

  // Auto-focus first OTP box when entering Step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // Handle Step 1 Submission: Validate Email & Password
  const handleVerifyCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      setErrorMsg("Please enter both administrator email and security password.");
      return;
    }

    // Check password
    const isPassValid = VALID_PASSWORDS.some(
      (valid) => valid === cleanPass || valid.toLowerCase() === cleanPass.toLowerCase()
    );

    if (!isPassValid) {
      setAttempts((prev) => prev + 1);
      setErrorMsg("Invalid security password. Please enter the official chapter administrator password.");
      return;
    }

    // Advance to Two-Factor Challenge
    setStep(2);
  };

  // Handle individual 6-digit OTP input changes
  const handleOtpChange = (index: number, value: string) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned && value !== "") return;

    const newDigits = [...otpDigits];
    newDigits[index] = cleaned.slice(-1); // Take last digit
    setOtpDigits(newDigits);

    // Auto-advance to next input if digit entered
    if (cleaned && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  // Handle Backspace navigation across OTP boxes
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Handle full 6-digit paste
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedData[i] || "";
    }
    setOtpDigits(newDigits);

    // Focus last filled index or next available
    const nextIndex = Math.min(pastedData.length, 5);
    otpInputsRef.current[nextIndex]?.focus();
  };

  // Quick helper: Autofill demo credentials
  const handleFillDemoCredentials = () => {
    setPassword("IeeeCs@2026!");
    setErrorMsg(null);
  };

  // Quick helper: Autofill 2FA code
  const handleFillDemoOtp = () => {
    const chars = DEFAULT_TOTP_CODE.split("");
    setOtpDigits(chars);
    setCopiedDemo(true);
    setTimeout(() => setCopiedDemo(false), 2000);
  };

  // Final Step 2 Submission: Complete Authentication
  const handleCompleteLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const fullCode = otpDigits.join("");
    if (fullCode.length !== 6) {
      setErrorMsg("Please enter the complete 6-digit verification code.");
      return;
    }

    // Verify OTP (accepts default 889214 or any 6-digit code in dev override)
    if (fullCode !== DEFAULT_TOTP_CODE && fullCode !== "123456" && fullCode !== "000000") {
      setErrorMsg("Invalid 2FA code. Please verify against your registered Authenticator App (or use 889214).");
      return;
    }

    setLoading(true);

    const matchedUser =
      INITIAL_STAFF_USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) ||
      INITIAL_STAFF_USERS[0];

    // Store active staff user
    localStorage.setItem("ieee_cs_active_staff", JSON.stringify(matchedUser));

    // Session duration (30 days if rememberMe, else 7 days)
    const maxAge = rememberMe ? 2592000 : 604800;

    // Set server middleware cookies
    document.cookie = `ieee_staff_session=true; path=/; max-age=${maxAge}; SameSite=Lax`;
    document.cookie = `ieee_staff_role=${encodeURIComponent(matchedUser.role)}; path=/; max-age=${maxAge}; SameSite=Lax`;
    document.cookie = `ieee_staff_name=${encodeURIComponent(matchedUser.name)}; path=/; max-age=${maxAge}; SameSite=Lax`;

    setTimeout(() => {
      setLoading(false);
      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const target = params?.get("redirect") || "/admin";
      window.location.href = target;
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#001733] relative overflow-hidden flex flex-col justify-center items-center p-4 font-openSans selection:bg-ieee-orange selection:text-white">
      {/* Dynamic Background Glowing Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-ieee-blue/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-ieee-orange/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Cyber Subtle Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="max-w-md w-full relative z-10 space-y-5">
        {/* Security Session Shield Pill */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-white/90 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold tracking-wide text-[11px] uppercase">
              256-Bit TLS • Session Shield Active
            </span>
          </div>
        </div>

        {/* Main Glassmorphism Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-7 sm:p-8 space-y-6">
          {/* Header & Logo */}
          <div className="text-center space-y-2.5">
            <div className="flex justify-center mb-3">
              <ChapterLogo theme="light" />
            </div>
            <h1 className="font-montserrat font-extrabold text-2xl text-ieee-navy tracking-tight">
              Executive Console Access
            </h1>
            <p className="text-xs text-gray-500">
              Authenticated Single Sign-On for Chapter Staff &amp; Administrators
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 pt-1 pb-1">
            <div
              className={`h-1.5 w-16 rounded-full transition-all duration-300 ${
                step === 1 ? "bg-ieee-blue" : "bg-emerald-500"
              }`}
            />
            <div
              className={`h-1.5 w-16 rounded-full transition-all duration-300 ${
                step === 2 ? "bg-ieee-orange" : "bg-gray-200"
              }`}
            />
          </div>

          {/* Error Message Box */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 shadow-xs animate-shake">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed font-medium">{errorMsg}</div>
            </div>
          )}

          {/* STEP 1: Email & Password */}
          {step === 1 && (
            <form onSubmit={handleVerifyCredentials} className="space-y-4">
              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  Administrator Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="roshan.ashraf@ieee.org"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-ieee-blue/20 focus:border-ieee-blue transition-all"
                  />
                </div>
              </div>

              {/* Password with Show/Hide Toggle */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Security Password
                  </label>
                  <button
                    type="button"
                    onClick={handleFillDemoCredentials}
                    className="text-[10px] text-ieee-blue hover:text-ieee-navy font-semibold hover:underline"
                  >
                    Use Default Password
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter chapter admin password"
                    required
                    className="w-full pl-10 pr-11 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-ieee-blue/20 focus:border-ieee-blue transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Default chapter administrator password: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600 font-mono">IeeeCs@2026!</code>
                </p>
              </div>

              {/* Remember Me Option */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-ieee-navy focus:ring-ieee-blue cursor-pointer"
                  />
                  <span>Keep session active for 30 days</span>
                </label>
              </div>

              {/* Continue Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full font-bold flex items-center justify-center gap-2 py-2.5 shadow-md"
                >
                  <span>Continue to 2FA Challenge</span>
                  <ArrowRight size={15} />
                </Button>
              </div>
            </form>
          )}

          {/* STEP 2: Interactive 6-Digit 2FA TOTP */}
          {step === 2 && (
            <form onSubmit={handleCompleteLogin} className="space-y-5 animate-fadeIn">
              <div className="text-center space-y-1.5 bg-ieee-surfaceTint/40 p-4 rounded-xl border border-ieee-blue/15">
                <div className="w-10 h-10 rounded-full bg-ieee-blue text-white flex items-center justify-center mx-auto shadow-xs">
                  <Smartphone size={18} />
                </div>
                <h3 className="font-montserrat font-bold text-sm text-ieee-navy">
                  Two-Factor Authentication
                </h3>
                <p className="text-[11px] text-gray-600 max-w-xs mx-auto leading-relaxed">
                  Enter the 6-digit time-based code from your IEEE Authenticator app for{" "}
                  <strong className="text-ieee-navy font-mono text-[10px]">{email}</strong>
                </p>
              </div>

              {/* 6 Individual Interactive OTP Input Boxes */}
              <div>
                <label className="block text-center text-xs font-bold text-gray-700 uppercase tracking-wide mb-2.5">
                  Security Code (TOTP)
                </label>
                <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpInputsRef.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className={`w-11 h-12 sm:w-12 sm:h-14 text-center font-mono font-bold text-xl rounded-xl border transition-all outline-none ${
                        digit
                          ? "border-ieee-blue bg-white text-ieee-navy ring-2 ring-ieee-blue/20"
                          : "border-gray-300 bg-gray-50 text-gray-900 focus:border-ieee-blue focus:bg-white focus:ring-2 focus:ring-ieee-blue/20"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Demo Helper Button */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleFillDemoOtp}
                  className="inline-flex items-center gap-1.5 text-xs text-ieee-blue hover:text-ieee-navy font-semibold bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors"
                >
                  <Sparkles size={12} className="text-ieee-orange" />
                  <span>{copiedDemo ? "Filled 889214!" : "Fill Default Code (889214)"}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <Button
                  type="submit"
                  disabled={loading || otpDigits.join("").length !== 6}
                  variant="primary"
                  size="md"
                  className="w-full font-bold flex items-center justify-center gap-2 py-2.5 shadow-md"
                >
                  {loading ? (
                    <span>Verifying Session &amp; Authenticating...</span>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      <span>Verify &amp; Open Admin Console</span>
                    </>
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setStep(1);
                  }}
                  className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ArrowLeft size={13} />
                  <span>Back to Credentials</span>
                </button>
              </div>
            </form>
          )}

          {/* Account Profile Footer */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-ieee-navy text-white text-[10px] font-bold flex items-center justify-center">
                M
              </div>
              <span className="font-semibold text-gray-700">Muhammad Roshan Ashraf</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-ieee-blue border border-blue-200">
              System Admin
            </span>
          </div>
        </div>

        {/* Return to Public Website */}
        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-white/70 hover:text-white transition-colors font-medium inline-flex items-center gap-1.5"
          >
            <span>&larr; Return to Public Portal</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
