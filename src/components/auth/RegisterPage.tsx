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
  RefreshCw,
  AlertTriangle,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface RegisterPageProps {
  onNavigateToLogin: () => void;
  onNavigateToLanding?: () => void;
  onSuccess: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onNavigateToLogin,
  onNavigateToLanding,
  onSuccess
}) => {
  const {
    sendEmailOtp,
    verifyEmailOtp,
    completeRegistration,
    checkEmailExists,
    setIsRegistrationInProgress,
    isLoading
  } = useAuth();

  // Inform AuthContext that registration is in progress to prevent premature redirection
  useEffect(() => {
    setIsRegistrationInProgress(true);
    return () => {
      setIsRegistrationInProgress(false);
    };
  }, [setIsRegistrationInProgress]);

  // Basic form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email verification & OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [verifiedUserId, setVerifiedUserId] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [otpStatusMessage, setOtpStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Email check & duplication handling
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailAlreadyExists, setEmailAlreadyExists] = useState(false);
  const [showEmailTooltip, setShowEmailTooltip] = useState(false);

  // General form feedback
  const [errorMessage, setErrorMessage] = useState('');

  // 60-second countdown timer for Resend OTP
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

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
        } else {
          setEmailAlreadyExists(false);
          setShowEmailTooltip(false);
        }
      } catch {
        // Ignore check error
      } finally {
        setIsCheckingEmail(false);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [email, checkEmailExists]);

  // Reset verification if user modifies email after verifying
  const handleEmailChange = (newVal: string) => {
    setEmail(newVal);
    const clean = newVal.trim().toLowerCase();
    if (isEmailVerified && clean !== verifiedEmail) {
      setIsEmailVerified(false);
      setVerifiedEmail(null);
      setVerifiedUserId(null);
      setOtpSent(false);
      setOtpDigits(['', '', '', '', '', '', '', '']);
      setOtpStatusMessage(null);
    }
  };

  // Step 2: Validate ALL required fields BEFORE sending OTP
  const handleSendOtp = async () => {
    setErrorMessage('');
    setOtpStatusMessage(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanPassword = password.trim();
    const cleanConfirm = confirmPassword.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // 1. Validate Full Name
    if (!cleanName || cleanName.length < 2) {
      setErrorMessage('Please enter your full name (at least 2 characters) before sending OTP.');
      return;
    }

    // 2. Validate Email
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    // 3. Validate Phone Number
    if (!cleanPhone || cleanPhone.length < 7) {
      setErrorMessage('Please enter your phone number (at least 7 digits) before sending OTP.');
      return;
    }

    // 4. Validate Password
    if (!cleanPassword || cleanPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    // 5. Validate Confirm Password matches Password
    if (cleanPassword !== cleanConfirm) {
      setErrorMessage('Passwords do not match. Please ensure both password fields match before sending OTP.');
      return;
    }

    if (emailAlreadyExists) {
      setErrorMessage(`The email "${cleanEmail}" is already registered. Please sign in instead.`);
      setShowEmailTooltip(true);
      return;
    }

    if (resendCountdown > 0) {
      setOtpStatusMessage({
        type: 'info',
        text: `Please wait ${resendCountdown} seconds before requesting a new code.`
      });
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await sendEmailOtp(cleanEmail);
      if (res.success) {
        setOtpSent(true);
        setOtpDigits(['', '', '', '', '', '', '', '']);
        setResendCountdown(60);
        setOtpStatusMessage({
          type: 'success',
          text: 'Verification code sent successfully. Please check your email for the 8-digit OTP.'
        });
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 150);
      } else {
        if (res.alreadyExists) {
          setEmailAlreadyExists(true);
          setShowEmailTooltip(true);
        }
        setErrorMessage(res.error || 'Failed to send verification code. Please try again.');
      }
    } catch {
      setErrorMessage('Failed to send verification code. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle typing inside individual OTP box
  const handleOtpChange = (index: number, value: string) => {
    // Only accept numeric digits
    const cleaned = value.replace(/\D/g, '');

    // User cleared the input
    if (!cleaned) {
      setOtpDigits(prev => {
        const next = [...prev];
        next[index] = '';
        return next;
      });
      return;
    }

    // Multiple digits input (e.g. typing or autofill)
    if (cleaned.length > 1) {
      setOtpDigits(prev => {
        const next = [...prev];
        for (let i = 0; i < cleaned.length && index + i < 8; i++) {
          next[index + i] = cleaned[i];
        }
        return next;
      });
      const nextFocus = Math.min(index + cleaned.length, 7);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    // Single digit input
    setOtpDigits(prev => {
      const next = [...prev];
      next[index] = cleaned;
      return next;
    });

    // Automatically advance focus to next box
    if (index < 7) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace, arrow keys, and enter navigation
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (otpDigits[index]) {
        // Clear current box if it has a digit
        setOtpDigits(prev => {
          const next = [...prev];
          next[index] = '';
          return next;
        });
      } else if (index > 0) {
        // Move to previous box and clear it
        inputRefs.current[index - 1]?.focus();
        setOtpDigits(prev => {
          const next = [...prev];
          next[index - 1] = '';
          return next;
        });
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 7) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const currentCode = otpDigits.join('');
      if (currentCode.length === 8) {
        handleVerifyOtp();
      }
    }
  };

  // Support pasting the complete 8-digit OTP
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const numeric = pasted.replace(/\D/g, '').slice(0, 8);
    if (!numeric) return;

    const nextDigits = Array(8).fill('');
    for (let i = 0; i < 8; i++) {
      nextDigits[i] = numeric[i] || '';
    }
    setOtpDigits(nextDigits);

    // Focus last filled box
    const targetFocus = Math.min(numeric.length, 7);
    inputRefs.current[targetFocus]?.focus();
  };

  // Step 3: Verify OTP (Validates exactly 8 digits and passes to Supabase verifyOtp)
  const handleVerifyOtp = async () => {
    setErrorMessage('');
    setOtpStatusMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otpDigits.join('').trim();

    if (!cleanEmail) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!cleanOtp || cleanOtp.length !== 8 || !/^\d{8}$/.test(cleanOtp)) {
      setOtpStatusMessage({
        type: 'error',
        text: 'Please enter the complete 8-digit verification code.'
      });
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await verifyEmailOtp(cleanEmail, cleanOtp);
      if (res.success && res.user) {
        setIsEmailVerified(true);
        setVerifiedEmail(cleanEmail);
        setVerifiedUserId(res.user.id);
        setOtpStatusMessage({
          type: 'success',
          text: 'Email verified successfully!'
        });
      } else {
        if (res.isExpired) {
          setOtpStatusMessage({
            type: 'error',
            text: 'Verification code expired. Please request a new one.'
          });
        } else {
          setOtpStatusMessage({
            type: 'error',
            text: res.error || 'Invalid verification code. Please try again.'
          });
        }
      }
    } catch {
      setOtpStatusMessage({
        type: 'error',
        text: 'Invalid verification code. Please try again.'
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Step 5: Complete Registration
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
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    // Security Gate: Ensure email was verified via Supabase Auth
    if (!isEmailVerified || cleanEmail !== verifiedEmail || !verifiedUserId) {
      setErrorMessage('Please verify your email before creating your account.');
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

    const res = await completeRegistration({
      fullName: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      password: cleanPassword,
      verifiedUserId
    });

    if (res.success) {
      onSuccess();
    } else {
      setErrorMessage(res.error || 'Failed to create account. Please try again.');
    }
  };

  // Step 4 verification requirement check
  const isFormValid = Boolean(
    isEmailVerified &&
    verifiedEmail === email.trim().toLowerCase() &&
    verifiedUserId &&
    fullName.trim().length > 0 &&
    password.length >= 6 &&
    password === confirmPassword
  );

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
            Sign up with verified email OTP to access your guest dashboard.
          </p>
        </div>

        {/* Card */}
        <div className="mt-6 bg-white py-7 px-6 sm:px-9 shadow-2xl rounded-2xl border border-slate-100">
          {/* Global Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in duration-150">
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
                {isEmailVerified ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Email Verified</span>
                  </span>
                ) : isCheckingEmail ? (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Checking...</span>
                  </span>
                ) : emailAlreadyExists ? (
                  <button
                    type="button"
                    onClick={() => setShowEmailTooltip(!showEmailTooltip)}
                    className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                    title="Click to view details"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Email already registered</span>
                  </button>
                ) : null}
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
                  disabled={isEmailVerified}
                  value={email}
                  onChange={e => handleEmailChange(e.target.value)}
                  onFocus={() => {
                    if (emailAlreadyExists) setShowEmailTooltip(true);
                  }}
                  placeholder="name@example.com"
                  className={`w-full pl-9.5 pr-8 py-2 text-xs sm:text-sm rounded-lg transition-all ${
                    isEmailVerified
                      ? 'bg-emerald-50/60 border border-emerald-300 text-slate-900 font-medium'
                      : emailAlreadyExists
                      ? 'bg-amber-50/50 border-2 border-amber-500 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20'
                      : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white'
                  }`}
                />
                {isEmailVerified && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2" />
                )}
              </div>
            </div>

            {/* 3. Phone Number */}
            <div>
              <label htmlFor="reg-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reg-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* EMAIL OTP VERIFICATION SECTION */}
            {/* ========================================================================= */}
            {!isEmailVerified ? (
              <div className="pt-2">
                {!otpSent ? (
                  <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                        Email OTP Verification Required
                      </span>
                      <span className="text-[11px] text-blue-600 font-medium">Step 1 of 2</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      All fields above will be validated, and an 8-digit verification code will be sent to{' '}
                      <strong className="font-mono text-slate-800">{email || 'your email'}</strong>.
                    </p>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isSendingOtp || isCheckingEmail}
                      className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      {isSendingOtp ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Validating fields & sending OTP...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Send 8-Digit Verification OTP</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="p-3.5 sm:p-4 bg-blue-50/70 border border-blue-200/90 rounded-xl space-y-3.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                        <label className="block text-xs font-semibold text-slate-800">
                          Enter 8-Digit Verification Code <span className="text-rose-500">*</span>
                        </label>
                      </div>
                      <span className="text-[11px] text-blue-700 font-medium">
                        Sent to <strong className="font-mono">{email}</strong>
                      </span>
                    </div>

                    {/* 8 Individual OTP Input Boxes */}
                    <div
                      className="grid grid-cols-8 gap-1.5 sm:gap-2.5 max-w-full"
                      onPaste={handleOtpPaste}
                    >
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={el => {
                            inputRefs.current[idx] = el;
                          }}
                          id={`reg-otp-${idx}`}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          autoComplete="one-time-code"
                          maxLength={1}
                          value={digit}
                          onChange={e => handleOtpChange(idx, e.target.value)}
                          onKeyDown={e => handleOtpKeyDown(idx, e)}
                          onFocus={e => e.target.select()}
                          aria-label={`OTP Digit ${idx + 1} of 8`}
                          className={`w-full h-11 sm:h-12 text-center text-base sm:text-lg font-bold font-mono rounded-lg border transition-all outline-none ${
                            digit
                              ? 'bg-blue-50/80 border-blue-500 text-blue-950 ring-1 ring-blue-500/20'
                              : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Status summary & Verify Button */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-0.5">
                      <p className="text-[11px] text-slate-500">
                        {otpDigits.filter(Boolean).length === 8 ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 inline text-emerald-600" />
                            8 of 8 digits entered. Ready to verify!
                          </span>
                        ) : (
                          <span>
                            Entered {otpDigits.filter(Boolean).length}/8 digits (paste supported)
                          </span>
                        )}
                      </p>

                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={isVerifyingOtp || otpDigits.join('').length !== 8}
                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                      >
                        {isVerifyingOtp ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Verify Email</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* OTP Feedback Message */}
                    {otpStatusMessage && (
                      <div
                        className={`text-xs p-2.5 rounded-lg flex items-center gap-2 ${
                          otpStatusMessage.type === 'success'
                            ? 'bg-emerald-100/80 text-emerald-800 border border-emerald-300'
                            : otpStatusMessage.type === 'error'
                            ? 'bg-rose-100/80 text-rose-800 border border-rose-300'
                            : 'bg-blue-100/80 text-blue-800 border border-blue-300'
                        }`}
                      >
                        {otpStatusMessage.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        )}
                        <span>{otpStatusMessage.text}</span>
                      </div>
                    )}

                    {/* Resend OTP timer */}
                    <div className="flex items-center justify-between text-[11px] text-slate-600 pt-0.5">
                      <span>Didn't receive the code?</span>
                      {resendCountdown > 0 ? (
                        <span className="font-mono text-slate-500 font-medium">Resend in {resendCountdown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={isSendingOtp}
                          className="text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2 cursor-pointer"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Email Verification Success Indicator */
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 animate-in fade-in duration-150">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-900">✓ Email Verified Successfully</p>
                    <p className="text-[11px] text-emerald-700 font-mono">{verifiedEmail}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsEmailVerified(false);
                    setVerifiedEmail(null);
                    setVerifiedUserId(null);
                    setOtpSent(false);
                    setOtpDigits(['', '', '', '', '', '', '', '']);
                    setOtpStatusMessage(null);
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium text-emerald-800 hover:bg-emerald-100 rounded-lg border border-emerald-300 transition-colors cursor-pointer"
                  title="Change email"
                >
                  Change Email
                </button>
              </div>
            )}

            {/* Helper notice if email is not verified */}
            {!isEmailVerified && (
              <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Verify your email with the 8-digit OTP to enable "Create Account".</span>
              </p>
            )}

            {/* Submit button (Disabled until email verified and form complete) */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-xs ${
                  isFormValid && !isLoading
                    ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer shadow-blue-500/20'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-70'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creating Account & Saving Profile...</span>
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
                className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600 font-medium transition-colors cursor-pointer"
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
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer"
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
