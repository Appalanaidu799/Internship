import React, { useState } from 'react';
import { User, Mail, Phone, Lock, CheckCircle2, Shield, Edit2, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const CustomerProfile: React.FC = () => {
  const { user } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || 'Rajesh Naidu');
  const [email] = useState(user?.email || 'customer@gmail.com');
  const [phone, setPhone] = useState(user?.phone || '+1 (555) 234-5678');
  const [isEditing, setIsEditing] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    setProfileSuccess('Profile preferences updated successfully.');
    setTimeout(() => setProfileSuccess(''), 3500);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordSuccess('Account security credentials updated successfully.');
    setTimeout(() => setPasswordSuccess(''), 3500);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="pb-3 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Guest Profile & Preferences</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your contact credentials, loyalty registration, and security details.
        </p>
      </div>

      {profileSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{profileSuccess}</span>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            {/* Profile Avatar Placeholder */}
            <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-md ring-4 ring-slate-100">
              {fullName.charAt(0)}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{fullName}</h3>
              <p className="text-xs text-slate-500 font-mono">{email}</p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Guest Member
                </span>
                <span className="text-[11px] text-slate-400">· Member since 2025</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
          </button>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  disabled={!isEditing}
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 disabled:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address (Fixed)</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-lg font-mono text-slate-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Telephone Contact</label>
            <div className="relative max-w-sm">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                disabled={!isEditing}
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 disabled:text-slate-500 font-mono"
              />
            </div>
          </div>

          {isEditing && (
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs"
              >
                Save Changes
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Change Password Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Lock className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900">Change Password</h3>
        </div>

        {passwordSuccess && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
            {passwordSuccess}
          </div>
        )}
        {passwordError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {passwordError}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 text-xs max-w-md">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs"
          >
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
};
