import React, { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, User, Phone, CheckCircle2, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminSetupPageProps {
  onComplete: () => void;
  onNavigateToLogin: () => void;
}

export const AdminSetupPage: React.FC<AdminSetupPageProps> = ({ onComplete, onNavigateToLogin }) => {
  const { setupAdmin, isLoading } = useAuth();
  const defaultAdminEmail = 'appalanaidu.dev@gmail.com';

  const [fullName, setFullName] = useState('Appala Naidu');
  const [phone, setPhone] = useState('+91 99000 11223');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!password) {
      setErrorMessage('Please enter a secure password for the Admin account.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both password fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await setupAdmin(fullName.trim() || 'Appala Naidu', phone.trim(), password);
      if (res.success) {
        onComplete();
      } else {
        setErrorMessage(res.error || 'Failed to initialize Admin account. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred during admin setup.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/25 mb-4 ring-4 ring-blue-500/20 font-bold text-2xl tracking-tight">
            L
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Luxery Hotel
          </h1>
          <p className="mt-1 text-xs text-blue-200/80 uppercase tracking-widest font-mono">
            AI-Powered Hotel Booking & Intelligence System
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>One-Time Master Admin Setup</span>
          </div>
          <p className="mt-2 text-xs text-slate-400 max-w-sm mx-auto">
            Configure the credentials for the default property administrator. This single-instance setup provisions master governance access.
          </p>
        </div>

        {/* Setup Card */}
        <div className="mt-6 bg-white py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-100">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {errorMessage}
              </div>
            )}

            {/* Read-Only Admin Email */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Admin Email Address
                </label>
                <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                  Fixed / Read-Only
                </span>
              </div>
              <div className="relative">
                <Shield className="w-4 h-4 text-blue-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  readOnly
                  disabled
                  value={defaultAdminEmail}
                  className="w-full pl-9.5 pr-4 py-2.5 text-xs sm:text-sm bg-slate-100/90 border border-slate-200 rounded-lg text-slate-800 font-mono font-medium cursor-not-allowed select-all"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Designated master administrator account for the property.
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="admin-fullname" className="block text-xs font-semibold text-slate-700 mb-1">
                Administrator Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="admin-fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Appala Naidu"
                  className="w-full pl-9.5 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="admin-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Phone
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="admin-phone"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 99000 11223"
                  className="w-full pl-9.5 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="admin-password" className="block text-xs font-semibold text-slate-700 mb-1">
                Set Admin Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Create secure administrator password"
                  className="w-full pl-9.5 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="admin-confirm-password" className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm Admin Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="admin-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat administrator password"
                  className="w-full pl-9.5 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 text-white text-xs sm:text-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-60 shadow-sm mt-3"
            >
              {isSubmitting || isLoading ? (
                <span>Configuring Admin Account...</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Create Admin Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Already Configured Link */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600 font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Already configured? Sign in with existing credentials
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-5 text-center">
          <p className="text-[11px] text-slate-400">
            Protected by Supabase Authentication & Role-Based Row Level Security (RLS)
          </p>
        </div>
      </div>
    </div>
  );
};
