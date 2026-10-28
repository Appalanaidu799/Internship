import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Calendar,
  X,
  Eye,
  AlertTriangle,
  CheckCircle,
  FileText,
  RefreshCw,
  Database
} from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { Booking, BookingStatus } from '../../types/hotel';
import { StatusBadge } from '../common/StatusBadge';
import { RiskBadge } from '../common/RiskBadge';
import { Modal } from '../common/Modal';

export const AdminBookings: React.FC = () => {
  const { bookings, updateBookingStatus, cancelBooking, refreshAllData, isDatabaseSyncing } = useHotel();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter logic
  const filteredBookings = bookings.filter(b => {
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    if (riskFilter !== 'ALL' && b.cancellationRisk !== riskFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        b.id.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.customerEmail.toLowerCase().includes(q) ||
        b.roomTypeName.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage) || 1;
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const exportCSV = () => {
    const headers = 'BookingID,Customer,Email,RoomType,CheckIn,CheckOut,Guests,ADR,Total,Status,CancellationRisk,Probability\n';
    const rows = filteredBookings
      .map(
        b =>
          `${b.id},"${b.customerName}",${b.customerEmail},"${b.roomTypeName}",${b.checkIn},${b.checkOut},${b.guests},${b.adr},${b.totalAmount},${b.status},${b.cancellationRisk},${b.cancellationProbability}%`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `luxery-hotel-bookings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Master Bookings Ledger</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit, verify, modify and monitor check-ins, ADR revenue, and predictive cancellation probabilities.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshAllData()}
            disabled={isDatabaseSyncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors border border-blue-200 disabled:opacity-50"
            title="Refresh bookings from Supabase database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isDatabaseSyncing ? 'animate-spin' : ''}`} />
            <span>{isDatabaseSyncing ? 'Syncing...' : 'Sync Supabase'}</span>
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors border border-slate-200"
          >
            <Download className="w-4 h-4" />
            <span>Export Data (CSV)</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by ID, guest name, email, or room type..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            >
              <option value="ALL">All Booking Statuses</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Checked-In">Checked-In</option>
              <option value="Checked-Out">Checked-Out</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <select
              value={riskFilter}
              onChange={e => {
                setRiskFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="HIGH">High Risk (&gt;70%)</option>
              <option value="MEDIUM">Medium Risk (30–70%)</option>
              <option value="LOW">Low Risk (&lt;30%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Booking ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Room Type</th>
                <th className="py-3 px-4">Check-In</th>
                <th className="py-3 px-4">Check-Out</th>
                <th className="py-3 px-4">Guests</th>
                <th className="py-3 px-4">ADR</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Cancellation Risk</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedBookings.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No bookings found matching current filters.
                  </td>
                </tr>
              ) : (
                paginatedBookings.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                      {b.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{b.customerName}</div>
                      <div className="text-[11px] text-slate-500 font-mono truncate">{b.customerEmail}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      <div>{b.roomTypeName}</div>
                      {b.roomNumber && (
                        <span className="text-[10px] text-slate-400 font-mono">Room {b.roomNumber}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{b.checkIn}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{b.checkOut}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{b.guests}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">₹{b.adr.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={b.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      <RiskBadge
                        level={b.cancellationRisk}
                        probability={b.cancellationProbability}
                        size="sm"
                      />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-700 font-mono">{filteredBookings.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> to{' '}
            <span className="font-semibold text-slate-700 font-mono">
              {Math.min(currentPage * itemsPerPage, filteredBookings.length)}
            </span>{' '}
            of <span className="font-semibold text-slate-700 font-mono">{filteredBookings.length}</span> bookings
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              Previous
            </button>
            <span className="px-2 font-mono font-medium">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <Modal
          isOpen={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          title={`Booking ${selectedBooking.id}`}
          subtitle={`Reserved for ${selectedBooking.customerName}`}
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <div>
                {selectedBooking.status === 'Confirmed' && (
                  <button
                    onClick={() => {
                      if (confirm(`Cancel reservation for ${selectedBooking.customerName}?`)) {
                        cancelBooking(selectedBooking.id);
                        setSelectedBooking(null);
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedBooking.status === 'Confirmed' && (
                  <button
                    onClick={() => {
                      updateBookingStatus(selectedBooking.id, 'Checked-In');
                      setSelectedBooking({ ...selectedBooking, status: 'Checked-In' });
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200"
                  >
                    Mark Checked-In
                  </button>
                )}
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Top Status & Risk Banner */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Status</span>
                <div className="mt-1">
                  <StatusBadge status={selectedBooking.status} />
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">ML Cancellation Risk</span>
                <div className="mt-1">
                  <RiskBadge level={selectedBooking.cancellationRisk} probability={selectedBooking.cancellationProbability} />
                </div>
              </div>
            </div>

            {/* Cancelled Banner if applicable */}
            {selectedBooking.status === 'Cancelled' && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                <span className="font-bold block text-xs">Reservation Cancelled & Refund Processed</span>
                <p className="text-[11px] text-amber-800">
                  Refund Credited: <strong>₹{(selectedBooking.refundAmount ?? selectedBooking.totalAmount).toLocaleString('en-IN')}</strong>
                  {selectedBooking.cancellationFee !== undefined && ` · Retention: ₹${selectedBooking.cancellationFee.toLocaleString('en-IN')}`}
                  {selectedBooking.cancellationReason && ` · Reason: ${selectedBooking.cancellationReason}`}
                </p>
              </div>
            )}

            {/* Guest & Room Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Guest KYC & Verification</span>
                <p className="font-bold text-slate-900 text-sm">{selectedBooking.customerName}</p>
                <p className="font-mono text-slate-600">{selectedBooking.customerEmail}</p>
                <p className="font-mono text-slate-600">{selectedBooking.customerPhone || 'N/A'}</p>
                <p className="text-slate-600">
                  Age: <span className="font-semibold">{selectedBooking.customerAge || '18+'}</span> · Gender: <span className="font-semibold">{selectedBooking.customerGender || 'N/A'}</span>
                </p>
                {(selectedBooking.aadharNumber || selectedBooking.idProofNumber) && (
                  <p className="text-slate-700 font-mono text-[11px] bg-slate-50 p-1 rounded border border-slate-200">
                    <span className="font-bold">{selectedBooking.idProofType || 'Aadhar'}:</span> {selectedBooking.aadharNumber || selectedBooking.idProofNumber}
                  </p>
                )}
                {selectedBooking.customerAddress && (
                  <p className="text-[11px] text-slate-500 truncate" title={`${selectedBooking.customerAddress}, ${selectedBooking.customerCity || ''}`}>
                    Address: {selectedBooking.customerAddress}, {selectedBooking.customerCity}
                  </p>
                )}
                <p className="text-slate-500 pt-1">Purpose: <span className="font-semibold text-slate-700">{selectedBooking.purposeOfVisit || 'Leisure'}</span></p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Room & Stay</span>
                <p className="font-bold text-slate-900 text-sm">{selectedBooking.roomTypeName}</p>
                <p className="text-slate-600">Assigned Unit: <span className="font-mono font-semibold">{selectedBooking.roomNumber || 'Pending'}</span></p>
                <p className="text-slate-600">Dates: <span className="font-mono">{selectedBooking.checkIn} → {selectedBooking.checkOut}</span></p>
                <p className="text-slate-600">Guests: <span className="font-mono">{selectedBooking.guests}</span> | Nights: <span className="font-mono">{selectedBooking.nights}</span></p>
              </div>
            </div>

            {/* Financials & Deposit */}
            <div className="p-3 bg-white rounded-lg border border-slate-200 grid grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Daily Rate (ADR)</span>
                <p className="font-mono font-bold text-slate-900 text-base mt-0.5">₹{selectedBooking.adr.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Total Revenue</span>
                <p className="font-mono font-bold text-slate-900 text-base mt-0.5">₹{selectedBooking.totalAmount.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Deposit Policy</span>
                <p className="font-semibold text-slate-800 text-xs mt-1">{selectedBooking.depositType}</p>
              </div>
            </div>

            {/* Razorpay Settlement Details */}
            <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                  R
                </div>
                <div>
                  <span className="font-bold text-slate-900">Payment Gateway: {selectedBooking.paymentMethod || 'Razorpay'}</span>
                  <span className="text-[10px] text-slate-500 block font-mono">
                    ID: {selectedBooking.razorpayPaymentId || 'pay_verified'} {selectedBooking.razorpayOrderId ? `· Order: ${selectedBooking.razorpayOrderId}` : ''}
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white uppercase tracking-wider">
                Settled · Paid
              </span>
            </div>

            {selectedBooking.specialRequests && (
              <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200 text-xs">
                <span className="font-semibold text-blue-900 block mb-1">Special Guest Notes & Preferences</span>
                <p className="text-blue-800">{selectedBooking.specialRequests}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
