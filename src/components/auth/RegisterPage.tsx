import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  User,
  Phone,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface RegisterPageProps {
  onNavigateToLogin: () => void;
  onNavigateToLanding?: () => void;
  onSuccess: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateToLogin, onNavigateToLanding, onSuccess }) => {
  const { register, checkEmailExists, isLoading } = useAuth();

  // Basic form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email check
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailAlreadyExists, setEmailAlreadyExists] = useState(false);
  const [showEmailTooltip, setShowEmailTooltip] = useState(false);
  const [existingEmailRole, setExistingEmailRole] = useState<string | null>(null);

  // General form feedback
  const [errorMessage, setErrorMessage] = useState('');

  // Debounced check whenever email changes
  useEffect(() => {
    const clean = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!clean || !emailRegex.test(clean)) {
      setEmailAlreadyExists(false);
      setShowEmailTooltip(false);
      setIsCheckingEmail(false);
      return;
    }

    setIsCheckingEmail(true);
    const handler = setTimeout(async () => {
      try {
        const result = await checkEmailExists(clean);
        if (result.exists) {
          setEmailAlreadyExists(true);
          setShowEmailTooltip(true);
          setExistingEmailRole(result.role || 'customer');
        } else {
          setEmailAlreadyExists(false);
          setShowEmailTooltip(false);
          setExistingEmailRole(null);
        }
      } catch {
        // Ignore check error
      } finally {
        setIsCheckingEmail(false);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [email, checkEmailExists]);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanPassword = password.trim();

    if (!cleanName) {
      setErrorMessage('Please enter your full name.');
      return;
    }

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
      setErrorMessage('Please create a password.');
      return;
    }

    if (cleanPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (cleanPassword !== confirmPassword.trim()) {
      setErrorMessage('Passwords do not match. Please verify both password fields.');
      return;
    }

    const res = await register(cleanName, cleanEmail, cleanPhone, cleanPassword);

    if (res.success) {
      onSuccess();
    } else {
      if (res.alreadyExists) {
        setEmailAlreadyExists(true);
        setShowEmailTooltip(true);
      }
      setErrorMessage(res.error || 'Failed to create account. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative ambient gradients */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        {/* Brand header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20 mb-3 ring-4 ring-blue-500/20 font-bold text-2xl tracking-tight">
            L
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Create Account
          </h1>
          <p className="mt-1 text-xs text-blue-200/80 uppercase tracking-widest font-mono">
            Luxery Hotel Guest Membership
          </p>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
            Sign up to access your guest dashboard and reservation management.
          </p>
        </div>

        {/* Card */}
        <div className="mt-6 bg-white py-7 px-6 sm:px-9 shadow-2xl rounded-2xl border border-slate-100">
          {/* Global Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* 1. Full Name */}
            <div>
              <label htmlFor="reg-fullname" className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reg-fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full pl-9.5 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* 2. Email Address */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-700">
                  Email Address <span className="text-rose-500">*</span>
                </label>

                {/* Status indicator on the label line */}
                {isCheckingEmail && (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Checking...</span>
                  </span>
                )}
                {emailAlreadyExists && !isCheckingEmail && (
                  <button
                    type="button"
                    onClick={() => setShowEmailTooltip(!showEmailTooltip)}
                    className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                    title="Click to view details"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Email already registered</span>
                  </button>
                )}
              </div>

              {/* TOOLTIP: "Email already exists" */}
              {showEmailTooltip && emailAlreadyExists && (
                <div
                  className="absolute z-40 bottom-full left-0 right-0 mb-2 p-3 bg-slate-900 text-white rounded-xl border-2 border-amber-500 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
                  role="tooltip"
                >
                  <div className="absolute -bottom-2 left-8 w-3.5 h-3.5 bg-slate-900 border-r-2 border-b-2 border-amber-500 transform rotate-45" />

                  <div className="flex items-start gap-2.5 relative z-10">
                    <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-amber-300 text-xs">Email already registered</h4>
                      <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
                        The email <strong className="font-mono text-amber-200">{email}</strong> already has an account.
                      </p>
                      <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={onNavigateToLogin}
                          className="text-xs font-semibold text-amber-300 hover:text-white underline underline-offset-2 flex items-center gap-1 transition-colors"
                        >
                          Sign in with this email →
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowEmailTooltip(false)}
                          className="text-[10px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded bg-slate-800 transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reg-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => {
                    if (emailAlreadyExists) setShowEmailTooltip(true);
                  }}
                  placeholder="name@example.com"
                  className={`w-full pl-9.5 pr-10 py-2 text-xs sm:text-sm rounded-lg transition-all ${
                    emailAlreadyExists
                      ? 'bg-amber-50/50 border-2 border-amber-500 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20'
                      : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white'
                  }`}
                />

                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {isCheckingEmail && <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />}
                  {emailAlreadyExists && !isCheckingEmail && (
                    <button
                      type="button"
                      onClick={() => setShowEmailTooltip(!showEmailTooltip)}
                      className="text-amber-600 hover:text-amber-700 p-0.5"
                      title="Email already exists"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Phone Number */}
            <div>
              <label htmlFor="reg-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reg-phone"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-9.5 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* 4. Password */}
            <div>
              <label htmlFor="reg-password" className="block text-xs font-semibold text-slate-700 mb-1">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9.5 pr-10 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
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

            {/* 5. Confirm Password */}
            <div>
              <label htmlFor="reg-confirm-password" className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full pl-9.5 pr-10 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs sm:text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-xs disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Back to login */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center space-y-2">
            <div>
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600 font-medium transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Already have an account? Sign In</span>
              </button>
            </div>
            {onNavigateToLanding && (
              <div>
                <button
                  type="button"
                  onClick={onNavigateToLanding}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors"
                >
                  <span>Return to Luxury Hotel Home</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
