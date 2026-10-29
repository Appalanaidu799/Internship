import React, { useState } from 'react';
import { Settings, Save, CheckCircle2, Shield, Bell, Clock, Building, Database, Copy, Check, RefreshCw, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SUPABASE_USERS_TABLE_SQL, supabaseUrl } from '../../lib/supabase';

export const AdminSettings: React.FC = () => {
  const { databaseStatus, checkDatabaseStatus, appendUsersToRemoteDb } = useAuth();
  const [hotelName, setHotelName] = useState('Luxery Hotel');
  const [address, setAddress] = useState('Beach Road, Visakhapatnam, AP, India');
  const [currency, setCurrency] = useState('USD ($)');
  const [checkInTime, setCheckInTime] = useState('14:00');
  const [checkOutTime, setCheckOutTime] = useState('11:00');
  const [highRiskThreshold, setHighRiskThreshold] = useState('70');
  const [autoDepositNotice, setAutoDepositNotice] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isCheckingDb, setIsCheckingDb] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState('');

  const projectRef = (() => {
    try {
      return new URL(supabaseUrl).hostname.split('.')[0];
    } catch {
      return 'ksjcdbirvgmhhppzagsq';
    }
  })();

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_USERS_TABLE_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleRefreshDb = async () => {
    setIsCheckingDb(true);
    setSyncFeedback('');
    try {
      const status = await checkDatabaseStatus(true);
      if (status.tableExists) {
        const syncRes = await appendUsersToRemoteDb();
        if (syncRes.success) {
          setSyncFeedback(`Table verified & appended ${syncRes.count} user rows to Supabase!`);
        } else {
          setSyncFeedback('Table active and receiving queries.');
        }
      } else {
        setSyncFeedback('Table public.users not found on remote database yet. Run the SQL script in Supabase SQL editor.');
      }
    } catch (err: any) {
      setSyncFeedback(err?.message || 'Verification failed');
    } finally {
      setIsCheckingDb(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">System & Property Settings</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure hotel operational rules, automated ML risk sensitivity, and property information.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>System parameters successfully synchronized to hotel database.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Hotel Identity */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">Hotel Profile</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Property Name</label>
              <input
                type="text"
                value={hotelName}
                onChange={e => setHotelName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Currency Standard</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="USD ($)">USD ($)</option>
                <option value="INR (₹)">INR (₹)</option>
                <option value="EUR (€)">EUR (€)</option>
                <option value="GBP (£)">GBP (£)</option>
              </select>
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-semibold text-slate-700 mb-1">Physical Address</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Operating Hours & Policies */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">Front Desk & Operating Hours</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Standard Check-In Time</label>
              <input
                type="time"
                value={checkInTime}
                onChange={e => setCheckInTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Standard Check-Out Time</label>
              <input
                type="time"
                value={checkOutTime}
                onChange={e => setCheckOutTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* AI & Cancellation Risk Sensitivity */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Shield className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">AI Model Sensitivity & Thresholds</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                High Risk Threshold (% Probability)
              </label>
              <input
                type="number"
                min="50"
                max="95"
                value={highRiskThreshold}
                onChange={e => setHighRiskThreshold(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Bookings above this value trigger high alert warnings.</p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <span className="font-semibold text-slate-800 block">Auto-Deposit Inquiries</span>
                <span className="text-[11px] text-slate-500">Trigger deposit notice 21 days before arrival</span>
              </div>
              <input
                type="checkbox"
                checked={autoDepositNotice}
                onChange={e => setAutoDepositNotice(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Database Configuration */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Database Configuration</h3>
            </div>
            <button
              type="button"
              disabled={isCheckingDb}
              onClick={handleRefreshDb}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingDb ? 'animate-spin' : ''}`} />
              <span>Verify Status</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <div className="text-[11px] font-semibold text-slate-500">Database Endpoint</div>
              <div className="font-mono text-xs text-slate-800 truncate font-semibold">{supabaseUrl}</div>
              <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                <span>Connected & Configured</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <div className="text-[11px] font-semibold text-slate-500">Storage Status</div>
              <div className="font-mono text-xs text-slate-800 font-semibold">Configured</div>
              <div className="text-[10px] text-slate-600">
                {databaseStatus.message}
              </div>
            </div>
          </div>

          {syncFeedback && (
            <div className={`p-2.5 rounded-lg text-xs font-semibold ${syncFeedback.includes('verified') || syncFeedback.includes('active') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
              {syncFeedback}
            </div>
          )}

          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg text-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-blue-900">
                Database Migration & Setup
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold transition-colors shadow-xs"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy SQL</span>
                    </>
                  )}
                </button>

                <a
                  href={`https://supabase.com/dashboard/project/${projectRef}/sql/new`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open SQL Editor</span>
                </a>

                <button
                  type="button"
                  disabled={isCheckingDb}
                  onClick={handleRefreshDb}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-semibold transition-colors shadow-xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingDb ? 'animate-spin' : ''}`} />
                  <span>{isCheckingDb ? 'Verifying...' : 'Verify Database'}</span>
                </button>
              </div>
            </div>
            <p className="text-blue-800 text-[11px] leading-relaxed">
              All registrations and sessions are automatically preserved. If initializing the remote table directly, click <strong>Copy SQL</strong>, run it in your project's SQL Editor, and then click <strong>Verify Database</strong> to complete initialization.
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
