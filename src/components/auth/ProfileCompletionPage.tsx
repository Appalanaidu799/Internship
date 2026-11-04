import React, { useState } from 'react';
import {
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GenderOption } from '../../types/auth';

interface ProfileCompletionPageProps {
  onSuccess: () => void;
}

export const ProfileCompletionPage: React.FC<ProfileCompletionPageProps> = ({ onSuccess }) => {
  const { userProfile, customerProfile, saveCompletedProfile, logout, isLoading } = useAuth();

  const [fullName, setFullName] = useState(
    userProfile?.full_name && !userProfile.full_name.includes('@')
      ? userProfile.full_name
      : customerProfile?.full_name || ''
  );
  const [phone, setPhone] = useState(userProfile?.phone || customerProfile?.phone || '');
  const [dateOfBirth, setDateOfBirth] = useState(customerProfile?.date_of_birth || '');
  const [gender, setGender] = useState<GenderOption>(
    (customerProfile?.gender as GenderOption) || 'Prefer not to say'
  );
  const [city, setCity] = useState(customerProfile?.city || '');
  const [state, setState] = useState(customerProfile?.state || '');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const verifiedEmail = userProfile?.email || customerProfile?.email || 'user@example.com';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();

    if (!cleanName || cleanName.length < 2) {
      setErrorMessage('Please enter your full name (at least 2 characters).');
      return;
    }

    if (!cleanPhone || cleanPhone.length < 7) {
      setErrorMessage('Please enter a valid phone number (at least 7 digits).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await saveCompletedProfile({
        fullName: cleanName,
        phone: cleanPhone,
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined
      });

      if (res.success) {
        onSuccess();
      } else {
        setErrorMessage(res.error || 'Failed to save profile. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred while saving your profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient background accents */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20 mb-3 ring-4 ring-blue-500/20 font-bold text-2xl tracking-tight">
            L
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Complete Your Profile
          </h1>
          <p className="mt-1 text-xs text-blue-200/80 uppercase tracking-widest font-mono">
            Guest Membership Verification
          </p>
          <p className="mt-2 text-xs sm:text-sm text-slate-400">
            Please finalize your profile details to unlock your personal guest dashboard.
          </p>
        </div>

        {/* Card */}
        <div className="mt-6 bg-white py-8 px-6 sm:px-9 shadow-2xl rounded-2xl border border-slate-100">
          {/* Verified Email Banner */}
          <div className="mb-5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-emerald-900">Verified Email Address</p>
                <p className="text-[11px] font-mono text-emerald-700">{verifiedEmail}</p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded">
              Verified
            </span>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div>
              <label htmlFor="cp-fullname" className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="cp-fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full pl-9.5 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="cp-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="cp-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="w-full pl-9.5 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Optional Demographics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Date of Birth */}
              <div>
                <label htmlFor="cp-dob" className="block text-xs font-semibold text-slate-700 mb-1">
                  Date of Birth <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="cp-dob"
                    type="date"
                    value={dateOfBirth}
                    onChange={e => setDateOfBirth(e.target.value)}
                    className="w-full pl-9.5 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label htmlFor="cp-gender" className="block text-xs font-semibold text-slate-700 mb-1">
                  Gender <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <select
                  id="cp-gender"
                  value={gender}
                  onChange={e => setGender(e.target.value as GenderOption)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                >
                  <option value="Prefer not to say">Prefer not to say</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                </select>
              </div>
            </div>

            {/* City & State (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="cp-city" className="block text-xs font-semibold text-slate-700 mb-1">
                  City <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="cp-city"
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="e.g. Visakhapatnam"
                    className="w-full pl-9.5 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="cp-state" className="block text-xs font-semibold text-slate-700 mb-1">
                  State <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  id="cp-state"
                  type="text"
                  value={state}
                  onChange={e => setState(e.target.value)}
                  placeholder="e.g. Andhra Pradesh"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || isLoading || fullName.trim().length < 2 || phone.trim().length < 7}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Save & Enter Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Logout / Switch Account */}
            <div className="text-center pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={logout}
                className="text-xs text-slate-500 hover:text-rose-600 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log out and switch account</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
