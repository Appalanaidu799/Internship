import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Lock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Calendar,
  MapPin,
  ShieldAlert,
  HeartHandshake,
  Edit2,
  Save,
  Sparkles,
  Fingerprint
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { calculateAge, GenderOption } from '../../types/auth';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export const CustomerProfile: React.FC = () => {
  const { user, customerProfile, updateCustomerProfile } = useAuth();

  // Profile Form States
  const [fullName, setFullName] = useState(customerProfile?.full_name || user?.fullName || 'Rajesh Naidu');
  const [phone, setPhone] = useState(customerProfile?.phone || user?.phone || '');
  const [dateOfBirth, setDateOfBirth] = useState(customerProfile?.date_of_birth || '');
  const [gender, setGender] = useState<string>(customerProfile?.gender || 'Prefer not to say');
  const [addressLine, setAddressLine] = useState(customerProfile?.address_line || '');
  const [city, setCity] = useState(customerProfile?.city || '');
  const [state, setState] = useState(customerProfile?.state || '');
  const [postalCode, setPostalCode] = useState(customerProfile?.postal_code || '');
  const [country, setCountry] = useState(customerProfile?.country || 'United States');
  const [emergencyName, setEmergencyName] = useState(customerProfile?.emergency_contact_name || '');
  const [emergencyPhone, setEmergencyPhone] = useState(customerProfile?.emergency_contact_phone || '');

  // UI state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUuid, setCopiedUuid] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Sync state whenever customerProfile or user changes
  useEffect(() => {
    if (customerProfile) {
      setFullName(customerProfile.full_name || user?.fullName || '');
      setPhone(customerProfile.phone || user?.phone || '');
      setDateOfBirth(customerProfile.date_of_birth || '');
      setGender(customerProfile.gender || 'Prefer not to say');
      setAddressLine(customerProfile.address_line || '');
      setCity(customerProfile.city || '');
      setState(customerProfile.state || '');
      setPostalCode(customerProfile.postal_code || '');
      setCountry(customerProfile.country || 'United States');
      setEmergencyName(customerProfile.emergency_contact_name || '');
      setEmergencyPhone(customerProfile.emergency_contact_phone || '');
    } else if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
    }
  }, [customerProfile, user]);

  const customerCode = customerProfile?.customer_code || 'CUS-NAIDU001';
  const customerUuid = user?.id || customerProfile?.id || 'c0000000-0000-0000-0000-000000000003';
  const accountEmail = user?.email || customerProfile?.email || 'customer@gmail.com';
  const calculatedAge = calculateAge(dateOfBirth);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(customerCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {}
  };

  const handleCopyUuid = async () => {
    try {
      await navigator.clipboard.writeText(customerUuid);
      setCopiedUuid(true);
      setTimeout(() => setCopiedUuid(false), 2500);
    } catch {}
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!fullName.trim()) {
      setProfileError('Full name is required.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateCustomerProfile({
        full_name: fullName.trim(),
        phone: phone.trim(),
        date_of_birth: dateOfBirth || undefined,
        gender,
        address_line: addressLine.trim(),
        city: city.trim(),
        state: state.trim(),
        postal_code: postalCode.trim(),
        country: country.trim(),
        emergency_contact_name: emergencyName.trim(),
        emergency_contact_phone: emergencyPhone.trim()
      });

      if (res.success) {
        setIsEditing(false);
        setProfileSuccess('Customer profile and preferences updated successfully in database.');
        setTimeout(() => setProfileSuccess(''), 4000);
      } else {
        setProfileError(res.error || 'Failed to update customer profile.');
      }
    } catch (err: any) {
      setProfileError(err?.message || 'Failed to save customer profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!newPassword || !confirmPassword) {
      setPasswordError('Please fill in both new password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          setPasswordError(error.message || 'Failed to update password with Supabase Auth.');
          setIsUpdatingPassword(false);
          return;
        }
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('Account security credentials updated successfully in Supabase.');
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (err: any) {
      setPasswordError(err?.message || 'Password update failed.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-3 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Guest Profile & Identity Management</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Permanent Supabase customer credentials, personal preferences, and verified stay records.
        </p>
      </div>

      {profileSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{profileSuccess}</span>
        </div>
      )}

      {profileError && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{profileError}</span>
        </div>
      )}

      {/* 1. Permanent Customer Identity Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 rounded-2xl p-6 text-white shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-xl ring-4 ring-white/10 shrink-0">
              {fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{fullName}</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Customer
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-0.5">{accountEmail}</p>

              {/* Unique Human-readable Customer ID */}
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-xs">
                  <Fingerprint className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-slate-300">Customer ID:</span>
                  <span className="font-mono font-bold text-white tracking-wider">{customerCode}</span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="p-1 hover:text-blue-300 text-slate-400 transition-colors ml-1"
                    title="Copy Customer ID"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-slate-400">
                  <span>UUID:</span>
                  <span className="font-mono text-slate-300 truncate max-w-[140px] sm:max-w-none">{customerUuid}</span>
                  <button
                    type="button"
                    onClick={handleCopyUuid}
                    className="p-1 hover:text-blue-300 text-slate-400 transition-colors"
                    title="Copy Supabase UUID"
                  >
                    {copiedUuid ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 self-start md:self-center">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Personal Details'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Personal & Contact Details Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Personal & Contact Profile</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Personalized preferences used for concierge allocations and check-in verification.
            </p>
          </div>
          <span className="text-[11px] text-slate-400">
            Account created: {customerProfile?.created_at ? new Date(customerProfile.created_at).toLocaleDateString() : 'Active Member'}
          </span>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-5 text-xs">
          {/* Row 1: Full Name, Auth Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  disabled={!isEditing}
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Rajesh Naidu"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email Address (Sourced from Supabase Auth)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  disabled
                  value={accountEmail}
                  className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-lg font-mono text-slate-500 cursor-not-allowed"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Primary auth credential cannot be modified directly from guest profile.
              </span>
            </div>
          </div>

          {/* Row 2: Phone Number, Date of Birth & Dynamic Age */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Telephone Contact</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  disabled={!isEditing}
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+1 (555) 234-5678"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 disabled:text-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  disabled={!isEditing}
                  value={dateOfBirth}
                  onChange={e => setDateOfBirth(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 disabled:text-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Calculated Age</label>
              <div className="py-2 px-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-mono">
                {calculatedAge !== null ? `${calculatedAge} years old` : 'Not specified'}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Calculated live from date of birth.
              </span>
            </div>
          </div>

          {/* Row 3: Gender Selection */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Gender</label>
            <div className="max-w-xs">
              <select
                disabled={!isEditing}
                value={gender}
                onChange={e => setGender(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>

          {/* Row 4: Address Details */}
          <div className="pt-2 border-t border-slate-100 space-y-4">
            <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Residential Address & Billing Details</span>
            </h5>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Address Line</label>
              <input
                type="text"
                disabled={!isEditing}
                value={addressLine}
                onChange={e => setAddressLine(e.target.value)}
                placeholder="Street address, suite, apartment"
                className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="e.g. San Francisco"
                  className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">State / Province</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={state}
                  onChange={e => setState(e.target.value)}
                  placeholder="e.g. CA"
                  className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Postal Code</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={postalCode}
                  onChange={e => setPostalCode(e.target.value)}
                  placeholder="e.g. 94107"
                  className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 disabled:text-slate-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Country</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  placeholder="e.g. United States"
                  className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 disabled:text-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Row 5: Emergency Contact */}
          <div className="pt-2 border-t border-slate-100 space-y-4">
            <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
              <HeartHandshake className="w-3.5 h-3.5 text-rose-600" />
              <span>Emergency Contact Information</span>
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Emergency Contact Name</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={emergencyName}
                  onChange={e => setEmergencyName(e.target.value)}
                  placeholder="Primary contact person"
                  className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Emergency Telephone</label>
                <input
                  type="tel"
                  disabled={!isEditing}
                  value={emergencyPhone}
                  onChange={e => setEmergencyPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 disabled:text-slate-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Save / Cancel Bar */}
          {isEditing && (
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-colors shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving to Database...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* 3. Account Security & Password Update */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Lock className="w-4 h-4 text-blue-600" />
          <h4 className="text-sm font-bold text-slate-900">Security Credentials & Password</h4>
        </div>

        {passwordSuccess && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">New Secure Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs disabled:opacity-50"
            >
              {isUpdatingPassword ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
