import React, { useState } from 'react';
import { Database, Copy, Check, ExternalLink, RefreshCw, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SUPABASE_USERS_TABLE_SQL, supabaseUrl } from '../../lib/supabase';

interface SupabaseDbBannerProps {
  alwaysVisible?: boolean;
}

export const SupabaseDbBanner: React.FC<SupabaseDbBannerProps> = ({ alwaysVisible = false }) => {
  const { isTableMissing, checkDatabaseStatus, appendUsersToRemoteDb, databaseStatus } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!alwaysVisible && (!isTableMissing || isDismissed)) {
    return null;
  }

  // Extract project ref from URL (e.g. ksjcdbirvgmhhppzagsq from https://ksjcdbirvgmhhppzagsq.supabase.co)
  const projectRef = (() => {
    try {
      const u = new URL(supabaseUrl);
      return u.hostname.split('.')[0];
    } catch {
      return 'ksjcdbirvgmhhppzagsq';
    }
  })();

  const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_USERS_TABLE_SQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback copy
      const ta = document.createElement('textarea');
      ta.value = SUPABASE_USERS_TABLE_SQL;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleVerifyAndSync = async () => {
    setIsVerifying(true);
    setStatusMsg('');
    try {
      const status = await checkDatabaseStatus(true);
      if (status.tableExists) {
        const syncRes = await appendUsersToRemoteDb();
        if (syncRes.success) {
          setStatusMsg(`Table active! Appended ${syncRes.count} user rows to Supabase.`);
        } else {
          setStatusMsg('Table verified on Supabase! Ready to accept users.');
        }
      } else {
        setStatusMsg('Table public.users not detected yet. Please run the SQL in Supabase SQL Editor and try again.');
      }
    } catch (err: any) {
      setStatusMsg(err?.message || 'Verification check failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 text-slate-800 relative z-30 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-700 shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <span>Supabase Database Setup: Customers, Rooms & Bookings Schema</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-200/60 text-amber-900 rounded font-semibold">
                {projectRef}
              </span>
            </div>
            <p className="text-slate-600 mt-0.5">
              The remote Supabase database requires the public schema tables (<code>users</code>, <code>customers</code>, <code>room_types</code>, <code>rooms</code>, <code>bookings</code>). Copy the idempotent SQL script and execute it in your Supabase SQL Editor.
            </p>
            {statusMsg && (
              <p className={`mt-1 font-semibold ${statusMsg.includes('active') ? 'text-emerald-700' : 'text-amber-800'}`}>
                {statusMsg}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-center">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors shadow-2xs"
          >
            <span>{isExpanded ? 'Hide SQL' : 'View SQL'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handleCopySql}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'SQL Copied!' : 'Copy SQL Script'}</span>
          </button>

          <a
            href={sqlEditorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Supabase SQL Editor</span>
          </a>

          <button
            type="button"
            disabled={isVerifying}
            onClick={handleVerifyAndSync}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold transition-colors shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'Checking...' : 'Verify & Append Rows'}</span>
          </button>

          {!alwaysVisible && (
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="text-slate-400 hover:text-slate-600 text-xs px-1"
              title="Dismiss banner"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="max-w-7xl mx-auto mt-3 p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto shadow-inner border border-slate-800">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="text-slate-400">PostgreSQL Schema & Seed Rows for Supabase:</span>
            <button
              type="button"
              onClick={handleCopySql}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre>{SUPABASE_USERS_TABLE_SQL}</pre>
        </div>
      )}
    </div>
  );
};
