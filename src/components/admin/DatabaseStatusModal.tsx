"use client";

import React, { useState, useEffect } from "react";
import {
  testSupabaseConnection,
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
  const [copySuccess, setCopySuccess] = useState(false);
  const [copySqlSuccess, setCopySqlSuccess] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedNotice, setSeedNotice] = useState<string | null>(null);

  const creds = getActiveSupabaseCredentials();

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

  const handleSeedDatabase = async () => {
    if (!confirm("Upload and seed all official chapter production records (IEEE DigitalFest 2026, Chapter Officers, Templates, and Certificates) directly into your live Supabase database?")) {
      return;
    }
    setIsSeeding(true);
    setSeedNotice(null);
    try {
      const res = await db.seedCloudDatabase();
      setSeedNotice(res.message);
      await checkConnection();
    } catch (err: any) {
      setSeedNotice("Seeding failed: " + (err.message || String(err)));
    } finally {
      setIsSeeding(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkConnection();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const envFileContent = `# IEEE CS UCET-IUB Supabase Production Configuration
NEXT_PUBLIC_SUPABASE_URL=${creds.url || "https://gbuafbcebcbwzvefqhcr.supabase.co"}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${creds.key || ""}`;

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
                    <AlertTriangle size={10} /> Disconnected / Error
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
              <RefreshCw size={12} className={testing ? "animate-spin text-ieee-blue" : ""} />
              {testing ? "Checking..." : "Re-check"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
            <div>
              <span className="text-gray-500">Connected Project:</span>{" "}
              <span className="font-semibold text-gray-800">{creds.url ? new URL(creds.url).hostname : "None"}</span>
            </div>
            <div>
              <span className="text-gray-500">Config Source:</span>{" "}
              <span className="font-semibold text-gray-800">{status?.source || "PROD_DEFAULT"}</span>
            </div>
          </div>

          {status?.error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
              <strong>Error:</strong> {status.error}
            </div>
          )}

          {status?.isConnected && status.tableCounts && (
            <div className="pt-2 border-t border-emerald-200/70">
              <div className="text-[11px] font-bold text-emerald-900 mb-1.5">Cloud Database Table Counts:</div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center">
                <div className="bg-white/80 p-1.5 rounded border border-emerald-200">
                  <div className="text-sm font-bold text-ieee-navy">{status.tableCounts.events ?? 0}</div>
                  <div className="text-[10px] text-gray-500">Events</div>
                </div>
                <div className="bg-white/80 p-1.5 rounded border border-emerald-200">
                  <div className="text-sm font-bold text-ieee-navy">{status.tableCounts.teamMembers ?? 0}</div>
                  <div className="text-[10px] text-gray-500">Officers</div>
                </div>
                <div className="bg-white/80 p-1.5 rounded border border-emerald-200">
                  <div className="text-sm font-bold text-ieee-navy">{status.tableCounts.certificates ?? 0}</div>
                  <div className="text-[10px] text-gray-500">Certificates</div>
                </div>
                <div className="bg-white/80 p-1.5 rounded border border-emerald-200">
                  <div className="text-sm font-bold text-ieee-navy">{status.tableCounts.registrations ?? 0}</div>
                  <div className="text-[10px] text-gray-500">Registrations</div>
                </div>
                <div className="bg-white/80 p-1.5 rounded border border-emerald-200">
                  <div className="text-sm font-bold text-ieee-navy">{status.tableCounts.templates ?? 0}</div>
                  <div className="text-[10px] text-gray-500">Templates</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cloud Seeding Action */}
        <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-900 flex items-center gap-1.5">
              <Server size={14} className="text-emerald-700" /> Database Seeding
            </span>
          </div>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            Upload and seed chapter official production events (IEEE DigitalFest 2026), executive officers, and certificates directly to PostgreSQL.
          </p>

          <div className="pt-2 border-t border-emerald-200/60 flex flex-wrap items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSeeding || !status?.isConnected}
              onClick={handleSeedDatabase}
              className="text-xs flex items-center gap-1.5 bg-white hover:bg-emerald-100/50"
            >
              <Server size={13} className={isSeeding ? "animate-spin text-ieee-blue" : "text-gray-600"} />
              <span>{isSeeding ? "Uploading Official Records..." : "Seed Official Chapter Data to Cloud DB"}</span>
            </Button>
            {seedNotice && (
              <span className="text-[11px] font-semibold text-emerald-700">{seedNotice}</span>
            )}
          </div>
        </div>

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
            <span>Database Migrations: <strong>npm run db:migrate</strong> or GitHub Actions CI/CD</span>
            <span className="font-mono text-[10px] text-gray-400">PostgreSQL / Supabase</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (confirm("Reset local testing cache and revert to clean official production state?")) {
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
