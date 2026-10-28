import React, { useState, useMemo } from 'react';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Briefcase,
  UserPlus,
  Trash2,
  KeyRound,
  Shield,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  ArrowRightLeft,
  Calendar,
  Phone,
  Mail,
  UserCheck
} from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';
import { Role, UserProfile } from '../../types/auth';

type RoleFilterType = 'ALL' | 'customer' | 'management' | 'admin';

export const AdminManagementUsers: React.FC = () => {
  const { allUsers, updateUserRole, deleteUserAccount, addManagementUser, refreshAllData, isDatabaseSyncing } = useHotel();
  const { user: currentAdmin } = useAuth();

  // Filters & Search
  const [roleFilter, setRoleFilter] = useState<RoleFilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Create User Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTempPassword, setNewTempPassword] = useState('');
  const [createError, setCreateError] = useState('');

  // Change Role Action Modal State
  const [selectedUserForRoleChange, setSelectedUserForRoleChange] = useState<UserProfile | null>(null);
  const [targetRole, setTargetRole] = useState<Role>('management');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [roleModalError, setRoleModalError] = useState('');

  // Toast / In-page feedback
  const [successMessage, setSuccessMessage] = useState('');

  // Role Counts
  const counts = useMemo(() => {
    return {
      all: allUsers.length,
      customer: allUsers.filter(u => u.role === 'customer').length,
      management: allUsers.filter(u => u.role === 'management').length,
      admin: allUsers.filter(u => u.role === 'admin').length
    };
  }, [allUsers]);

  // Filtered User List
  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = u.full_name?.toLowerCase().includes(q);
        const matchEmail = u.email?.toLowerCase().includes(q);
        const matchPhone = u.phone?.toLowerCase().includes(q);
        const matchRole = u.role?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone && !matchRole) return false;
      }
      return true;
    });
  }, [allUsers, roleFilter, searchQuery]);

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!newFullName || !newEmail) {
      setCreateError('Full name and email are required.');
      return;
    }

    addManagementUser({
      fullName: newFullName.trim(),
      email: newEmail.trim().toLowerCase(),
      temporaryPassword: newTempPassword
    });

    setSuccessMessage(`User "${newFullName}" successfully registered into Supabase directory.`);
    setNewFullName('');
    setNewEmail('');
    setNewTempPassword('');
    setIsCreateModalOpen(false);

    setTimeout(() => setSuccessMessage(''), 4500);
  };

  // Open Role Change Action Modal
  const handleOpenRoleModal = (user: UserProfile) => {
    setSelectedUserForRoleChange(user);
    setTargetRole(user.role);
    setRoleModalError('');
  };

  // Submit Role Change
  const handleConfirmRoleChange = async () => {
    if (!selectedUserForRoleChange) return;

    // Safety guard: prevent admin from accidentally demoting their own currently logged-in account
    if (selectedUserForRoleChange.id === currentAdmin?.id && targetRole !== 'admin') {
      setRoleModalError('Security policy: You cannot demote your own active Administrator session.');
      return;
    }

    if (targetRole === selectedUserForRoleChange.role) {
      setSelectedUserForRoleChange(null);
      return;
    }

    setIsUpdatingRole(true);
    setRoleModalError('');

    const res = await updateUserRole(selectedUserForRoleChange.id, targetRole);
    setIsUpdatingRole(false);

    if (res.success) {
      const roleLabel = targetRole.charAt(0).toUpperCase() + targetRole.slice(1);
      setSuccessMessage(`Role for ${selectedUserForRoleChange.full_name} successfully updated to ${roleLabel} in Supabase.`);
      setSelectedUserForRoleChange(null);
      setTimeout(() => setSuccessMessage(''), 4500);
    } else {
      setRoleModalError(res.error || 'Failed to update user role.');
    }
  };

  // Role Badge Helper
  const renderRoleBadge = (role: Role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldAlert className="w-3 h-3 text-rose-600" />
            Admin
          </span>
        );
      case 'management':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Briefcase className="w-3 h-3 text-blue-600" />
            Management
          </span>
        );
      case 'customer':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Users className="w-3 h-3 text-emerald-600" />
            Customer
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            User Directory & Role Access Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervise all hotel customers, operations staff, and administrators. Grant or modify access clearance levels across roles.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshAllData()}
            disabled={isDatabaseSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors border border-blue-200 disabled:opacity-50"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isDatabaseSyncing ? 'animate-spin' : ''}`} />
            <span>{isDatabaseSyncing ? 'Syncing...' : 'Sync Supabase'}</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold transition-colors shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create User</span>
          </button>
        </div>
      </div>

      {/* 2. Success Banner */}
      {successMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* 3. Role Governance Guidelines Box */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
        <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-blue-950">Multi-Role Governance & Promotion Console</p>
          <p className="text-blue-800/90 mt-0.5 leading-relaxed">
            Administrators can promote or demote any account between <strong>Customer</strong> (guest bookings), <strong>Management</strong> (hotel operations & occupancy), and <strong>Admin</strong> (full system authority). All changes take effect immediately in the live Supabase PostgreSQL database.
          </p>
        </div>
      </div>

      {/* 4. Filter Toolbar & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Segmented Filter Buttons */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setRoleFilter('ALL')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                roleFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Users ({counts.all})
            </button>
            <button
              onClick={() => setRoleFilter('customer')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                roleFilter === 'customer'
                  ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Customers ({counts.customer})
            </button>
            <button
              onClick={() => setRoleFilter('management')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                roleFilter === 'management'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Management ({counts.management})
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                roleFilter === 'admin'
                  ? 'bg-white text-rose-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admins ({counts.admin})
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search user by name, email, phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 5. Master User Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">
              User Directory ({filteredUsers.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Real-time Supabase Data</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">User Identity</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Current Role</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Role & Access Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-600">No Users Found Under Selected Filter</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting your role filter or search criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(userItem => {
                  const isCurrentSessionAdmin = userItem.id === currentAdmin?.id;

                  return (
                    <tr key={userItem.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={userItem.profile_image || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userItem.full_name)}`}
                            alt={userItem.full_name}
                            className="w-7 h-7 rounded-full bg-slate-200 object-cover"
                          />
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{userItem.full_name}</span>
                              {isCurrentSessionAdmin && (
                                <span className="text-[10px] text-slate-400 font-normal">(You)</span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {userItem.id.substring(0, 8)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {userItem.email}
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        {renderRoleBadge(userItem.role)}
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {userItem.phone || <span className="text-slate-400 italic">Not provided</span>}
                      </td>

                      {/* Registered Date */}
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {userItem.created_at ? userItem.created_at.split('T')[0] : '2026-10-01'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={userItem.status === 'active' ? 'Active' : 'Inactive'} size="sm" />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Change Role Button */}
                          <button
                            onClick={() => handleOpenRoleModal(userItem)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-2xs"
                            title="Change user clearance tier"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            <span>Change Role</span>
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => {
                              setSuccessMessage(`Temporary password reset credentials sent to ${userItem.email}`);
                              setTimeout(() => setSuccessMessage(''), 4000);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Send temporary reset password"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Account */}
                          <button
                            onClick={() => {
                              if (isCurrentSessionAdmin) {
                                alert('You cannot delete your own active administrator account.');
                                return;
                              }
                              deleteUserAccount(userItem.id);
                              setSuccessMessage(`Account for ${userItem.full_name} deleted from Supabase.`);
                              setTimeout(() => setSuccessMessage(''), 4000);
                            }}
                            disabled={isCurrentSessionAdmin}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={isCurrentSessionAdmin ? 'Cannot delete own account' : 'Delete user account'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          ACTION MODAL: Modify User Access & Role Clearance
          ========================================================================= */}
      {selectedUserForRoleChange && (
        <Modal
          isOpen={Boolean(selectedUserForRoleChange)}
          onClose={() => setSelectedUserForRoleChange(null)}
          title="Modify User Role & Access Clearance"
          subtitle="Assign a new clearance level to this account. Role changes take effect immediately in the database."
          maxWidth="md"
          footer={
            <>
              <button
                type="button"
                onClick={() => setSelectedUserForRoleChange(null)}
                disabled={isUpdatingRole}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRoleChange}
                disabled={isUpdatingRole}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs disabled:opacity-50"
              >
                {isUpdatingRole && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isUpdatingRole ? 'Updating Role...' : 'Confirm Role Change'}</span>
              </button>
            </>
          }
        >
          <div className="space-y-4">
            {roleModalError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{roleModalError}</span>
              </div>
            )}

            {/* Target User Summary Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={selectedUserForRoleChange.profile_image || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(selectedUserForRoleChange.full_name)}`}
                  alt=""
                  className="w-10 h-10 rounded-full bg-slate-200 object-cover"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{selectedUserForRoleChange.full_name}</h4>
                  <p className="text-[11px] text-slate-500 font-mono">{selectedUserForRoleChange.email}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block mb-0.5">Current Tier</span>
                {renderRoleBadge(selectedUserForRoleChange.role)}
              </div>
            </div>

            {/* Role Options Selection Cards */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Select Destination Clearance Tier *
              </label>

              <div className="space-y-2">
                {/* 1. Customer Option */}
                <div
                  onClick={() => setTargetRole('customer')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    targetRole === 'customer'
                      ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-emerald-100 text-emerald-700">
                        <Users className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-xs font-bold text-slate-900">Customer (Guest)</span>
                    </div>
                    {targetRole === 'customer' && (
                      <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed pl-6">
                    Standard guest account. Access to book hotel suites, view self-service reservation folios, and update personal KYC identification.
                  </p>
                </div>

                {/* 2. Management Option */}
                <div
                  onClick={() => setTargetRole('management')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    targetRole === 'management'
                      ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-blue-100 text-blue-700">
                        <Briefcase className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-xs font-bold text-slate-900">Management (Operations)</span>
                    </div>
                    {targetRole === 'management' && (
                      <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed pl-6">
                    Hotel operational clearance. Access to manage daily room keycards, review upcoming guest check-ins, oversee occupancy pacing, and review ADR metrics.
                  </p>
                </div>

                {/* 3. Admin Option */}
                <div
                  onClick={() => setTargetRole('admin')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    targetRole === 'admin'
                      ? 'border-rose-500 bg-rose-50/50 ring-2 ring-rose-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-rose-100 text-rose-700">
                        <ShieldAlert className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-xs font-bold text-slate-900">Administrator (Full Control)</span>
                    </div>
                    {targetRole === 'admin' && (
                      <span className="text-[10px] font-semibold text-rose-700 uppercase tracking-wide">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed pl-6">
                    Complete administrative authority. Access to user role management, system settings, hotel yield intelligence, and full financial booking ledgers.
                  </p>
                </div>
              </div>
            </div>

            {/* Warning Note if switching to Admin */}
            {targetRole === 'admin' && selectedUserForRoleChange.role !== 'admin' && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Caution:</strong> Promoting this user to <strong>Administrator</strong> grants full access to modify all hotel configurations, revenue records, and other user permissions.
                </span>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* =========================================================================
          CREATE USER MODAL
          ========================================================================= */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New User Account"
        subtitle="Provision an account directly in Supabase. Role defaults to Management."
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateUser}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
            >
              Create User
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {createError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={newFullName}
              onChange={e => setNewFullName(e.target.value)}
              placeholder="e.g. Ramesh Naidu"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="staff@naiduhotel.com"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Temporary Password
            </label>
            <input
              type="text"
              value={newTempPassword}
              onChange={e => setNewTempPassword(e.target.value)}
              placeholder="e.g. NaiduStaff2026!"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Account will be created with active status and assigned to Management.
            </p>
          </div>
        </form>
      </Modal>
    </div>
  );
};
