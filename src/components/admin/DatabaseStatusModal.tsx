"use client";

import React, { useState, useEffect } from "react";
import {
  testSupabaseConnection,
  saveDynamicSupabaseCredentials,
  clearDynamicSupabaseCredentials,
  getActiveSupabaseCredentials,
  SupabaseConfigStatus,
} from "@/lib/supabase";
import { db } from "@/lib/db";
import {
  Database,
  CheckCircle,
  AlertTriangle,
  X,
  RefreshCw,
  Copy,
  ExternalLink,
  ShieldCheck,
  Server,
  Key,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface DatabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (status: SupabaseConfigStatus) => void;
}

export const DatabaseStatusModal: React.FC<DatabaseStatusModalProps> = ({
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const [status, setStatus] = useState<SupabaseConfigStatus | null>(null);
  const [testing, setTesting] = useState(false);
  const [inputUrl, setInputUrl] = useState("");
  const [inputKey, setInputKey] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const checkConnection = async () => {
    setTesting(true);
    try {
      const res = await testSupabaseConnection();
      setStatus(res);
      if (onStatusChange) onStatusChange(res);
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const creds = getActiveSupabaseCredentials();
      setInputUrl(creds.url);
      setInputKey(creds.key);
      checkConnection();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim() || !inputKey.trim()) {
      alert("Please provide both Supabase Project URL and Anon API Key.");
      return;
    }

    if (!inputUrl.startsWith("http")) {
      alert("Supabase URL must start with https:// (e.g. https://your-id.supabase.co)");
      return;
    }

    saveDynamicSupabaseCredentials(inputUrl.trim(), inputKey.trim());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);

    await checkConnection();
  };

  const handleDisconnect = async () => {
    if (confirm("Disconnect database? The site will fallback to offline local browser mode.")) {
      clearDynamicSupabaseCredentials();
      setInputUrl("");
      setInputKey("");
      await checkConnection();
    }
  };

  const envFileContent = `# IEEE CS UCET-IUB Supabase Production Configuration
NEXT_PUBLIC_SUPABASE_URL=${inputUrl.trim() || "https://your-project.supabase.co"}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${inputKey.trim() || "your-anon-api-key"}`;

  const copyEnvConfig = () => {
    navigator.clipboard.writeText(envFileContent);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-card max-w-2xl w-full shadow-2xl border border-gray-200 p-6 md:p-8 space-y-6 my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                status?.isConnected
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : "bg-amber-50 text-amber-600 border-amber-200"
              }`}
            >
              <Database size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-montserrat font-extrabold text-xl text-ieee-navy">
                  Database Connection Center
                </h3>
                {status?.isConnected ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle size={10} /> Live Connected
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                    <AlertTriangle size={10} /> Disconnected / Local Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                PostgreSQL cloud database synchronization for public website and admin console.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        {/* Live Diagnostics Card */}
        <div
          className={`p-4 rounded-xl border text-xs space-y-3 ${
            status?.isConnected
              ? "bg-emerald-50/50 border-emerald-200 text-emerald-950"
              : "bg-amber-50/50 border-amber-200 text-amber-950"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Server size={14} /> Connection Health Diagnostics
            </span>
            <button
              onClick={checkConnection}
              disabled={testing}
              className="px-2.5 py-1 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 text-[11px] font-semibold flex items-center gap-1 text-gray-700"
            >
              <RefreshCw size={12} className={testing ? "animate-spin" : ""} />
              {testing ? "Testing..." : "Test Connection"}
            </button>
          </div>

          {status?.isConnected ? (
            <div className="space-y-2">
              <p className="text-emerald-800 leading-relaxed">
                ✅ Connected successfully to Supabase cloud! All changes in the Admin Panel sync directly to the live database, accessible by all website visitors.
              </p>
              {status.tableCounts && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-emerald-200/60">
                  <div className="bg-white p-2 rounded border border-emerald-100 text-center">
                    <span className="text-[10px] text-gray-500 block">Events</span>
                    <strong className="text-sm text-emerald-700">{status.tableCounts.events}</strong>
                  </div>
                  <div className="bg-white p-2 rounded border border-emerald-100 text-center">
                    <span className="text-[10px] text-gray-500 block">Certificates</span>
                    <strong className="text-sm text-emerald-700">{status.tableCounts.certificates}</strong>
                  </div>
                  <div className="bg-white p-2 rounded border border-emerald-100 text-center">
                    <span className="text-[10px] text-gray-500 block">Officers</span>
                    <strong className="text-sm text-emerald-700">{status.tableCounts.teamMembers}</strong>
                  </div>
                  <div className="bg-white p-2 rounded border border-emerald-100 text-center">
                    <span className="text-[10px] text-gray-500 block">Registrations</span>
                    <strong className="text-sm text-emerald-700">{status.tableCounts.registrations}</strong>
                  </div>
                  <div className="bg-white p-2 rounded border border-emerald-100 text-center">
                    <span className="text-[10px] text-gray-500 block">Templates</span>
                    <strong className="text-sm text-emerald-700">{status.tableCounts.templates}</strong>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="font-semibold text-amber-900">
                {status?.error || "Database is currently disconnected."}
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                The website is operating in <strong>offline browser storage mode</strong>. To enable real-time cloud data across all users and mobile devices, enter your Supabase URL & Anon Key below.
              </p>
            </div>
          )}
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSaveCredentials} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1 flex items-center justify-between">
              <span>Supabase Project URL</span>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-ieee-blue hover:underline flex items-center gap-1 font-normal text-[11px]"
              >
                Find on Supabase Dashboard &rarr;
              </a>
            </label>
            <input
              type="text"
              required
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://xyzabcdefghijklm.supabase.co"
              className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none font-mono text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <Key size={13} className="text-gray-500" />
              <span>Supabase Anon / Public Key (eyJhbGci...)</span>
            </label>
            <input
              type="password"
              required
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full p-2.5 border rounded-lg focus:ring-1 focus:ring-ieee-blue outline-none font-mono text-xs"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Button type="submit" variant="primary" size="sm">
                Save & Connect Database
              </Button>
              {saveSuccess && (
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle size={13} /> Saved!
                </span>
              )}
            </div>

            {status?.source === "LOCAL_STORAGE" && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="text-red-600 hover:text-red-800 text-[11px] font-semibold flex items-center gap-1 self-start sm:self-auto"
              >
                <Trash2 size={13} /> Clear Saved Credentials
              </button>
            )}
          </div>
        </form>

        {/* Quick Instructions & Schema Notice */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-700">Production Deployment (.env.local / Vercel)</span>
            <button
              onClick={copyEnvConfig}
              className="text-xs font-semibold text-ieee-blue hover:underline flex items-center gap-1"
            >
              <Copy size={13} /> {copySuccess ? "Copied!" : "Copy Env Variables"}
            </button>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            For automatic synchronization on Vercel, copy the environment variables above and add them in your{" "}
            <strong>Vercel Project Settings &rarr; Environment Variables</strong>.
          </p>
          <div className="pt-1 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-600">
            <span>Database Tables: <strong>supabase/schema.sql</strong> (13 tables prepared)</span>
            <span className="font-mono text-[10px] text-gray-400">PostgreSQL / Supabase</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (confirm("Reset local testing cache and revert to clean official production seed state? (This will clear unsaved local tests and pull clean records)")) {
                db.purgeAllTestData();
                window.location.reload();
              }
            }}
            className="text-[11px] text-gray-500 hover:text-red-600 font-semibold flex items-center gap-1.5"
          >
            <Trash2 size={12} /> Reset Local Cache & Test Data
          </button>
          <Button onClick={onClose} variant="outline" size="sm">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

