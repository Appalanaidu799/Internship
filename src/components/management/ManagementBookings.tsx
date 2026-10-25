import React, { useState } from 'react';
import { Search, Filter, Eye, Download, RefreshCw } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { Booking } from '../../types/hotel';
import { StatusBadge } from '../common/StatusBadge';
import { RiskBadge } from '../common/RiskBadge';
import { Modal } from '../common/Modal';

export const ManagementBookings: React.FC = () => {
  const { bookings, updateBookingStatus, refreshAllData, isDatabaseSyncing } = useHotel();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const filtered = bookings.filter(b => {
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        b.id.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.roomTypeName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Front Desk & Operations Bookings</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational reservation check-in list, daily folio audit, and risk flags.
          </p>
        </div>
        <div>
          <button
            onClick={() => refreshAllData()}
            disabled={isDatabaseSyncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors border border-blue-200 disabled:opacity-50"
            title="Refresh bookings from Supabase database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isDatabaseSyncing ? 'animate-spin' : ''}`} />
            <span>{isDatabaseSyncing ? 'Syncing...' : 'Sync Supabase'}</span>
          </button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search booking or guest..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
        >
          <option value="ALL">All Statuses</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Checked-In">Checked-In</option>
          <option value="Checked-Out">Checked-Out</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Booking ID</th>
                <th className="py-3 px-4">Guest</th>
                <th className="py-3 px-4">Room Type</th>
                <th className="py-3 px-4">Check-In</th>
                <th className="py-3 px-4">Check-Out</th>
                <th className="py-3 px-4">ADR</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Risk</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(b => (
                <tr key={b.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-mono font-bold text-blue-700">{b.id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{b.customerName}</td>
                  <td className="py-3 px-4 text-slate-700">{b.roomTypeName}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{b.checkIn}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{b.checkOut}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">${b.adr}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={b.status} size="sm" />
                  </td>
                  <td className="py-3 px-4">
                    <RiskBadge level={b.cancellationRisk} probability={b.cancellationProbability} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedBooking(b)}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedBooking && (
        <Modal
          isOpen={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          title={`Reservation ${selectedBooking.id}`}
          subtitle={`Guest: ${selectedBooking.customerName}`}
          maxWidth="md"
          footer={
            <div className="flex items-center justify-between w-full">
              {selectedBooking.status === 'Confirmed' ? (
                <button
                  onClick={() => {
                    updateBookingStatus(selectedBooking.id, 'Checked-In');
                    setSelectedBooking({ ...selectedBooking, status: 'Checked-In' });
                  }}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold text-xs hover:bg-emerald-700"
                >
                  Confirm Check-In
                </button>
              ) : <div />}
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="font-bold text-slate-900 text-sm">{selectedBooking.roomTypeName}</p>
              <p className="text-slate-600 font-mono mt-0.5">{selectedBooking.checkIn} → {selectedBooking.checkOut} ({selectedBooking.nights} nights, {selectedBooking.guests} guests)</p>
              <p className="text-slate-600">Rate: ${selectedBooking.adr} / night · Total: ${selectedBooking.totalAmount}</p>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Guest KYC & Verification</span>
              <p className="font-bold text-slate-900">{selectedBooking.customerName}</p>
              <p className="font-mono text-slate-600">{selectedBooking.customerPhone || 'Phone not recorded'} · {selectedBooking.customerEmail}</p>
              <p className="text-slate-600">Age: {selectedBooking.customerAge || '18+'} · Gender: {selectedBooking.customerGender || 'Verified'}</p>
              {(selectedBooking.aadharNumber || selectedBooking.idProofNumber) && (
                <p className="font-mono text-[11px] text-slate-800 bg-slate-50 p-1 rounded border border-slate-200">
                  <span className="font-bold">{selectedBooking.idProofType || 'Aadhar'}:</span> {selectedBooking.aadharNumber || selectedBooking.idProofNumber}
                </p>
              )}
              {selectedBooking.customerAddress && (
                <p className="text-slate-500 text-[11px]">
                  Address: {selectedBooking.customerAddress}, {selectedBooking.customerCity}
                </p>
              )}
            </div>

            {selectedBooking.specialRequests && (
              <div className="p-2.5 bg-blue-50 rounded-lg text-blue-900 border border-blue-200">
                <span className="font-bold block mb-0.5">Special Requests:</span>
                {selectedBooking.specialRequests}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
