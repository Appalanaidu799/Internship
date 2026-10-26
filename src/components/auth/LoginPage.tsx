import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoginPageProps {
  onNavigateToRegister: () => void;
  onNavigateToAdminSetup?: () => void;
  onSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigateToRegister,
  onSuccess
}) => {
  const { login, resendConfirmationEmail, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isEmailUnconfirmed, setIsEmailUnconfirmed] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ loading: boolean; message?: string }>({ loading: false });

  const handleResendConfirmation = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address to resend confirmation.');
      return;
    }
    setResendStatus({ loading: true });
    const res = await resendConfirmationEmail(cleanEmail);
    setResendStatus({ loading: false, message: res.message });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsEmailUnconfirmed(false);
    setResendStatus({ loading: false });

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    if (!cleanPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    const res = await login(cleanEmail, cleanPassword);
    if (res.success) {
      onSuccess();
    } else {
      if (res.isEmailUnconfirmed) {
        setIsEmailUnconfirmed(true);
      }
      setErrorMessage(res.error || 'Authentication failed. Please verify your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative ambient gradients */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand logo & header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20 mb-4 ring-4 ring-blue-500/20 font-bold text-2xl tracking-tight">
            L
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Luxery Hotel
          </h1>
          <p className="mt-1 text-xs text-blue-200/80 uppercase tracking-widest font-mono">
            AI-Powered Hotel Booking & Intelligence System
          </p>
          <p className="mt-2 text-xs sm:text-sm text-slate-400">
            Sign in to access your hotel portal and dashboard.
          </p>
        </div>

        {/* Card */}
        <div className="mt-7 bg-white py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-100">
          {/* Email Unconfirmed Notification */}
          {isEmailUnconfirmed && (
            <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-amber-900">Email Confirmation Required</h4>
                  <p className="mt-1 text-amber-800 leading-relaxed text-[11px]">
                    Your account exists, but your email has not been verified yet. Please click the confirmation link sent to your inbox.
                  </p>
                </div>
              </div>

              {resendStatus.message && (
                <div className="p-2 rounded-lg bg-white border border-amber-200 text-amber-900 text-[11px] font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{resendStatus.message}</span>
                </div>
              )}

              <div className="pt-1">
                <button
                  type="button"
                  disabled={resendStatus.loading}
                  onClick={handleResendConfirmation}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                >
                  {resendStatus.loading ? 'Sending link...' : 'Resend Confirmation Email'}
                </button>
              </div>
            </div>
          )}

          {/* Standard Error Message */}
          {errorMessage && !isEmailUnconfirmed && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Demo Access Pills */}
          <div className="mb-5 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">
              Quick Demo Access
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={async () => {
                  setEmail('appalanaidu.dev@gmail.com');
                  setPassword('password');
                  const res = await login('appalanaidu.dev@gmail.com', 'password');
                  if (res.success) onSuccess();
                }}
                className="py-1.5 px-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-semibold border border-indigo-200 transition-colors text-center"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={async () => {
                  setEmail('manager@naiduhotel.com');
                  setPassword('password');
                  const res = await login('manager@naiduhotel.com', 'password');
                  if (res.success) onSuccess();
                }}
                className="py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold border border-emerald-200 transition-colors text-center"
              >
                Management
              </button>
              <button
                type="button"
                onClick={async () => {
                  setEmail('customer@gmail.com');
                  setPassword('password');
                  const res = await login('customer@gmail.com', 'password');
                  if (res.success) onSuccess();
                }}
                className="py-1.5 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold border border-blue-200 transition-colors text-center"
              >
                Customer
              </button>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9.5 pr-4 py-2.5 text-xs sm:text-sm rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Password Field with Show/Hide toggle */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
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

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span className="text-xs text-slate-600 select-none">Remember this device</span>
              </label>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 text-white text-xs sm:text-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-60 shadow-sm mt-3"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Registration link */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>New customer?</span>
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create an account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
