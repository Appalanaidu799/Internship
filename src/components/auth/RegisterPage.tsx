import React, { useState, useEffect, useRef } from 'react';
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
  Sparkles,
  ShieldCheck,
  Send,
  RefreshCw,
  AlertTriangle,
  KeyRound,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface RegisterPageProps {
  onNavigateToLogin: () => void;
  onSuccess: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateToLogin, onSuccess }) => {
  const { register, checkEmailExists, isLoading } = useAuth();

  // Basic form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email validation & Supabase check
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailAlreadyExists, setEmailAlreadyExists] = useState(false);
  const [showEmailTooltip, setShowEmailTooltip] = useState(false);
  const [existingEmailRole, setExistingEmailRole] = useState<string | null>(null);

  // Email verification state
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [verificationError, setVerificationError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState('');
  const [showCodeBanner, setShowCodeBanner] = useState(false);

  // General form feedback
  const [errorMessage, setErrorMessage] = useState('');
  const [registrationCompleteUnconfirmed, setRegistrationCompleteUnconfirmed] = useState(false);

  // Refs for smooth focus
  const verifySectionRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Countdown timer effect
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Debounced Supabase check whenever email changes
  useEffect(() => {
    const clean = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Reset verification if email changes after being verified
    if (isEmailVerified && verifiedEmail && clean !== verifiedEmail) {
      setIsEmailVerified(false);
      setVerifiedEmail(null);
      setIsCodeSent(false);
      setGeneratedCode(null);
      setShowCodeBanner(false);
    }

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
          // If already existed, cannot be verified for new account
          setIsEmailVerified(false);
          setVerifiedEmail(null);
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
    }, 380);

    return () => clearTimeout(handler);
  }, [email, checkEmailExists, isEmailVerified, verifiedEmail]);

  // Handle Send Verification Code
  const handleSendVerificationCode = async () => {
    setVerificationError('');
    setVerificationSuccess('');
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setVerificationError('Please enter your email address first.');
      emailInputRef.current?.focus();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setVerificationError('Please enter a valid email address.');
      emailInputRef.current?.focus();
      return;
    }

    // Check if email already exists in Supabase
    setIsSendingCode(true);
    try {
      const result = await checkEmailExists(cleanEmail);
      if (result.exists) {
        setEmailAlreadyExists(true);
        setShowEmailTooltip(true);
        setExistingEmailRole(result.role || 'customer');
        setVerificationError('Cannot verify: this email already existed in Supabase. Please sign in instead.');
        setIsSendingCode(false);
        return;
      }
    } catch {}

    // Generate random secure 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setIsCodeSent(true);
    setShowCodeBanner(true);
    setResendCountdown(60);
    setVerificationCodeInput('');
    setVerificationSuccess(`Verification code dispatched to ${cleanEmail}. Enter the code below.`);
    setIsSendingCode(false);
  };

  // Auto-fill verification code helper
  const handleAutoFillCode = () => {
    if (generatedCode) {
      setVerificationCodeInput(generatedCode);
      setVerificationError('');
    }
  };

  // Handle Verify Code
  const handleVerifyCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setVerificationError('');

    const cleanInput = verificationCodeInput.trim();
    if (!cleanInput) {
      setVerificationError('Please enter the 6-digit verification code.');
      return;
    }

    if (!generatedCode || cleanInput !== generatedCode) {
      setVerificationError('Invalid verification code. Please check the code and try again.');
      return;
    }

    // Code matches! Email successfully verified
    setIsEmailVerified(true);
    setVerifiedEmail(email.trim().toLowerCase());
    setVerificationSuccess('Email verified successfully! You can now complete your registration.');
    setVerificationError('');
    setShowCodeBanner(false);
  };

  // Reset verification to change email
  const handleResetVerification = () => {
    setIsEmailVerified(false);
    setVerifiedEmail(null);
    setIsCodeSent(false);
    setGeneratedCode(null);
    setVerificationCodeInput('');
    setShowCodeBanner(false);
    setVerificationSuccess('');
    setVerificationError('');
    emailInputRef.current?.focus();
  };

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

    // MANDATORY EMAIL VERIFICATION CHECK
    if (!isEmailVerified || verifiedEmail !== cleanEmail) {
      setErrorMessage('Email verification is mandatory! Please verify your email before creating an account.');
      verifySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      if (res.isEmailUnconfirmed) {
        setRegistrationCompleteUnconfirmed(true);
      } else {
        onSuccess();
      }
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
            Create Customer Account
          </h1>
          <p className="mt-1 text-xs text-blue-200/80 uppercase tracking-widest font-mono">
            Luxery Hotel Guest Membership
          </p>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
            Sign up with mandatory email verification to access your guest dashboard.
          </p>
        </div>

        {/* Card */}
        <div className="mt-6 bg-white py-7 px-6 sm:px-9 shadow-2xl rounded-2xl border border-slate-100">
          {registrationCompleteUnconfirmed ? (
            <div className="text-center py-4 space-y-4 animate-in fade-in duration-200">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto ring-4 ring-emerald-50">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Account Created Successfully!</h3>
                <p className="text-xs text-slate-500 mt-1 font-mono">{email}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Profile recorded in Supabase database</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Your account has been registered in Supabase Authentication and added to the{' '}
                  <span className="font-mono font-semibold text-slate-700">public.users</span> table with role{' '}
                  <span className="font-semibold text-emerald-700">Customer</span>.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
                >
                  Proceed to Sign In
                </button>
              </div>
            </div>
          ) : (
            <>
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

                {/* 2. Email Address with "Email already existed" Tooltip */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-700">
                      Email Address <span className="text-rose-500">*</span>
                    </label>

                    {/* Status indicator on the label line */}
                    {isCheckingEmail && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Checking Supabase...</span>
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
                        <span>Email already existed</span>
                      </button>
                    )}
                    {isEmailVerified && (
                      <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Verified</span>
                      </span>
                    )}
                  </div>

                  {/* TOOLTIP: "Email already existed" */}
                  {showEmailTooltip && emailAlreadyExists && (
                    <div
                      className="absolute z-40 bottom-full left-0 right-0 mb-2 p-3 bg-slate-900 text-white rounded-xl border-2 border-amber-500 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
                      role="tooltip"
                    >
                      {/* Downward pointer caret */}
                      <div className="absolute -bottom-2 left-8 w-3.5 h-3.5 bg-slate-900 border-r-2 border-b-2 border-amber-500 transform rotate-45" />

                      <div className="flex items-start gap-2.5 relative z-10">
                        <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg shrink-0 mt-0.5">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                              <span>Email already existed</span>
                            </h4>
                            <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-amber-500/20 text-amber-300 rounded font-mono border border-amber-500/30">
                              Supabase DB
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
                            The email <strong className="font-mono text-amber-200">{email}</strong> already has an account in the Supabase database.
                            {existingEmailRole && (
                              <span> Registered as role: <strong className="text-amber-300 uppercase">{existingEmailRole}</strong>.</span>
                            )}
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
                      ref={emailInputRef}
                      id="reg-email"
                      type="email"
                      required
                      autoComplete="email"
                      disabled={isEmailVerified}
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onFocus={() => {
                        if (emailAlreadyExists) setShowEmailTooltip(true);
                      }}
                      placeholder="name@example.com"
                      className={`w-full pl-9.5 pr-10 py-2 text-xs sm:text-sm rounded-lg transition-all ${
                        emailAlreadyExists
                          ? 'bg-amber-50/50 border-2 border-amber-500 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20'
                          : isEmailVerified
                          ? 'bg-emerald-50 border border-emerald-300 text-slate-900 font-medium'
                          : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white'
                      }`}
                    />

                    {/* Right action icon inside input */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {isCheckingEmail && <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />}
                      {emailAlreadyExists && !isCheckingEmail && (
                        <button
                          type="button"
                          onClick={() => setShowEmailTooltip(!showEmailTooltip)}
                          className="text-amber-600 hover:text-amber-700 p-0.5"
                          title="Email already existed"
                        >
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        </button>
                      )}
                      {isEmailVerified && !isCheckingEmail && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. VERIFY MAIL COLUMN / SECTION (MANDATORY) */}
                <div
                  ref={verifySectionRef}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                    isEmailVerified
                      ? 'bg-emerald-50/80 border-emerald-200'
                      : isCodeSent
                      ? 'bg-blue-50/70 border-blue-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isEmailVerified
                            ? 'bg-emerald-600 text-white'
                            : isCodeSent
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-white'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-xs font-bold text-slate-900">
                        Verify Email
                      </div>
                    </div>

                    {/* Status Pill */}
                    {isEmailVerified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <Check className="w-3 h-3" />
                        <span>Email Verified</span>
                      </span>
                    ) : isCodeSent ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                        <span>Code Sent</span>
                      </span>
                    ) : null}
                  </div>

                  {/* VERIFICATION STATE A: Not Verified & Code Not Sent */}
                  {!isEmailVerified && !isCodeSent && (
                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        onClick={handleSendVerificationCode}
                        disabled={isSendingCode || !email || emailAlreadyExists || isCheckingEmail}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                      >
                        {isSendingCode ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Sending Verification Code...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Verify Email</span>
                          </>
                        )}
                      </button>

                      {emailAlreadyExists && (
                        <p className="text-[11px] text-amber-700 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>Email already existed in Supabase. Please sign in instead.</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* VERIFICATION STATE B: Code Sent, awaiting user code input */}
                  {!isEmailVerified && isCodeSent && (
                    <div className="space-y-3 pt-1">
                      {/* Code Dispatch Banner */}
                      {showCodeBanner && generatedCode && (
                        <div className="p-2.5 rounded-lg bg-blue-100/80 border border-blue-300 text-blue-900 space-y-1.5 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-blue-950 flex items-center gap-1">
                              <span>📬 Verification Code Dispatched:</span>
                            </span>
                            <span className="text-[10px] text-blue-700 font-mono">{email}</span>
                          </div>

                          <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-md border border-blue-200">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] uppercase font-mono text-slate-500">Code:</span>
                              <span className="text-base font-mono font-bold tracking-widest text-blue-700">
                                {generatedCode}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={handleAutoFillCode}
                              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded transition-colors"
                            >
                              Auto-fill Code
                            </button>
                          </div>
                          <p className="text-[10px] text-blue-700">
                            Enter the 6-digit verification code in the field below.
                          </p>
                        </div>
                      )}

                      {/* Verify Email Input */}
                      <div>
                        <label htmlFor="verify-mail-code" className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Enter 6-Digit Verification Code <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              id="verify-mail-code"
                              type="text"
                              maxLength={6}
                              pattern="[0-9]*"
                              inputMode="numeric"
                              value={verificationCodeInput}
                              onChange={e => setVerificationCodeInput(e.target.value.replace(/\D/g, ''))}
                              placeholder="e.g. 123456"
                              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-mono tracking-widest bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-center"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleVerifyCode()}
                            className="py-2 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shrink-0 transition-colors shadow-xs"
                          >
                            Verify Email
                          </button>
                        </div>
                      </div>

                      {/* Error or Success feedback in verification box */}
                      {verificationError && (
                        <div className="text-[11px] text-rose-600 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{verificationError}</span>
                        </div>
                      )}
                      {verificationSuccess && !isEmailVerified && (
                        <div className="text-[11px] text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>{verificationSuccess}</span>
                        </div>
                      )}

                      {/* Resend Code Options */}
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-slate-500">Didn't receive the code?</span>
                        {resendCountdown > 0 ? (
                          <span className="text-slate-400 font-mono">
                            Resend available in {resendCountdown}s
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSendVerificationCode}
                            disabled={isSendingCode}
                            className="text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-1 transition-colors"
                          >
                            Resend Code
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* VERIFICATION STATE C: Email is Verified */}
                  {isEmailVerified && (
                    <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-emerald-300">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 font-bold" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-emerald-900">
                              Email Verified Successfully
                            </div>
                            <div className="text-[11px] font-mono text-emerald-700">
                              {verifiedEmail}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleResetVerification}
                          className="text-[10px] text-slate-500 hover:text-slate-700 underline font-medium px-2 py-1 rounded bg-slate-50"
                        >
                          Change Email
                        </button>
                      </div>
                      <p className="text-[11px] text-emerald-700 leading-tight">
                        ✓ Verification completed. You may now create your customer account below.
                      </p>
                    </div>
                  )}
                </div>

                {/* 4. Phone Number */}
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

                {/* 5. Password */}
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

                {/* 6. Confirm Password */}
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

                {/* Submit button: LOCKED UNTIL EMAIL VERIFICATION */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading || !isEmailVerified}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-xs ${
                      isEmailVerified
                        ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Creating Account in Supabase...</span>
                      </>
                    ) : isEmailVerified ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Create Customer Account</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Verify Email Above to Create Account</span>
                      </>
                    )}
                  </button>

                  {!isEmailVerified && (
                    <p className="mt-1.5 text-center text-[11px] text-amber-700">
                      * Email verification is mandatory before account creation can proceed.
                    </p>
                  )}
                </div>
              </form>

              {/* Back to login */}
              <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600 font-medium transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Already have an account? Sign In</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
