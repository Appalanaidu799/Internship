import React, { useState } from 'react';
import { UserCheck, UserPlus, Trash2, KeyRound, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';

export const AdminManagementUsers: React.FC = () => {
  const { managementUsers, addManagementUser, deleteManagementUser } = useHotel();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName || !email) {
      setErrorMessage('Full name and email are required.');
      return;
    }

    addManagementUser({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      temporaryPassword: tempPassword
    });

    setSuccessMessage(`Management user ${fullName} created successfully with role 'Management'.`);
    setFullName('');
    setEmail('');
    setTempPassword('');
    setIsModalOpen(false);

    setTimeout(() => setSuccessMessage(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Management User Administration
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Authorize and supervise hotel management operators. All provisioned credentials automatically inherit the Management clearance tier.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold transition-colors shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create Management User</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Info card regarding single-role enforcement */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
        <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-blue-950">Role-Enforced Provisioning</p>
          <p className="text-blue-800/90 mt-0.5 leading-relaxed">
            In compliance with hotel governance rules, this console assigns exactly the <strong>Management</strong> role. Management accounts have access to revenue monitoring, occupancy forecasting, and cancellation intelligence, without system configuration privileges.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">
              Active Management Roster ({managementUsers.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Departmental Access Enabled</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Management User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {managementUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                        {user.fullName.charAt(0)}
                      </div>
                      <span className="font-semibold text-slate-900">{user.fullName}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{user.email}</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      Management
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{user.department}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{user.createdAt}</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={user.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => alert(`Password reset link dispatched to ${user.email}`)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Send temporary reset password"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Revoke management access for ${user.fullName}?`)) {
                            deleteManagementUser(user.id);
                          }
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Management User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Management User"
        subtitle="Provision a new hotel operations account. Role is automatically set to Management."
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
            >
              Create User
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="e.g. Ramesh Naidu"
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="operator@naiduhotel.com"
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Temporary Password
            </label>
            <input
              type="text"
              value={tempPassword}
              onChange={e => setTempPassword(e.target.value)}
              placeholder="e.g. NaiduMgmt2026! (leave blank to auto-generate)"
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="p-3 rounded-lg bg-slate-100 border border-slate-200 text-xs">
            <span className="font-semibold text-slate-800">Assigned Role:</span>{' '}
            <span className="text-blue-700 font-semibold font-mono">Management</span>
            <p className="text-[11px] text-slate-500 mt-1">
              No role selection required. The user is guaranteed Management dashboard clearance.
            </p>
          </div>
        </form>
      </Modal>
    </div>
  );
};
