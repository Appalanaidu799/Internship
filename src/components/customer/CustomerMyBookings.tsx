import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  BedDouble,
  DollarSign,
  ShieldCheck,
  FileText,
  Filter,
  Check,
  Copy,
  Users,
  RefreshCw
} from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { useAuth } from '../../context/AuthContext';
import { Booking } from '../../types/hotel';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';

type BookingFilterTab = 'ALL' | 'UPCOMING' | 'CURRENT' | 'COMPLETED' | 'CANCELLED';

export const CustomerMyBookings: React.FC = () => {
  const { customerBookings, cancelBooking, refreshCustomerBookings, isDatabaseSyncing } = useHotel();
  const { user, customerProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<BookingFilterTab>('ALL');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancelFeedback, setCancelFeedback] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  // Today reference date: 2026-10-14
  const todayStr = new Date().toISOString().split('T')[0];

  // Real-time classification based on actual dates & statuses
  const categorizedBookings = useMemo(() => {
    const upcoming: Booking[] = [];
    const current: Booking[] = [];
    const completed: Booking[] = [];
    const cancelled: Booking[] = [];

    customerBookings.forEach(b => {
      if (b.status === 'Cancelled') {
        cancelled.push(b);
      } else if (b.status === 'Checked-Out' || (b.checkOut < todayStr && b.status !== 'Checked-In')) {
        completed.push(b);
      } else if (b.checkIn <= todayStr && b.checkOut >= todayStr) {
        current.push(b);
      } else if (b.checkIn > todayStr && b.status === 'Confirmed') {
        upcoming.push(b);
      } else {
        completed.push(b);
      }
    });

    return { upcoming, current, completed, cancelled };
  }, [customerBookings, todayStr]);

  const filteredList = useMemo(() => {
    switch (activeTab) {
      case 'UPCOMING':
        return categorizedBookings.upcoming;
      case 'CURRENT':
        return categorizedBookings.current;
      case 'COMPLETED':
        return categorizedBookings.completed;
      case 'CANCELLED':
        return categorizedBookings.cancelled;
      default:
        return customerBookings;
    }
  }, [activeTab, categorizedBookings, customerBookings]);

  // Hotel Cancellation Policy check: standard reservations eligible for cancellation if check-in >= 48 hours away
  const canCancel = (b: Booking): boolean => {
    if (b.status !== 'Confirmed') return false;
    const checkInDate = new Date(b.checkIn).getTime();
    const now = new Date().getTime();
    const hoursDifference = (checkInDate - now) / (1000 * 3600);
    return hoursDifference >= 48;
  };

  const handleCancel = async (bookingId: string) => {
    setCancelError('');
    setCancelFeedback('');

    const target = customerBookings.find(b => b.id === bookingId || b.bookingReference === bookingId);
    if (!target) return;

    if (!canCancel(target)) {
      setCancelError('According to hotel policy, cancellations must be made at least 48 hours prior to check-in.');
      return;
    }

    if (
      !confirm(
        `Are you sure you want to cancel reservation ${target.bookingReference || target.id}? Any refundable deposit will be credited back.`
      )
    ) {
      return;
    }

    setIsCancelling(true);
    try {
      await cancelBooking(target.id);
      setCancelFeedback(`Reservation ${target.bookingReference || target.id} has been successfully cancelled.`);
      if (selectedBooking && (selectedBooking.id === bookingId || selectedBooking.bookingReference === bookingId)) {
        setSelectedBooking(prev => prev ? { ...prev, status: 'Cancelled' } : null);
      }
      setTimeout(() => setCancelFeedback(''), 5000);
    } catch (err: any) {
      setCancelError(err?.message || 'Failed to cancel reservation.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCopyRef = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">My Reservations & Stay History</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified Supabase booking history linked to Customer ID <span className="font-mono font-bold text-blue-600">{customerProfile?.customer_code || 'CUS-NAIDU001'}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshCustomerBookings()}
            disabled={isDatabaseSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors border border-blue-200 disabled:opacity-50"
            title="Refresh bookings from Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isDatabaseSyncing ? 'animate-spin' : ''}`} />
            <span>{isDatabaseSyncing ? 'Syncing...' : 'Sync'}</span>
          </button>
          <div className="text-xs text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
            Total Folios: <span className="font-bold text-slate-900 font-mono">{customerBookings.length}</span>
          </div>
        </div>
      </div>

      {cancelFeedback && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{cancelFeedback}</span>
        </div>
      )}

      {cancelError && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{cancelError}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === 'ALL'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>All Bookings</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
            activeTab === 'ALL' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {customerBookings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('UPCOMING')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === 'UPCOMING'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>Upcoming</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
            activeTab === 'UPCOMING' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {categorizedBookings.upcoming.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('CURRENT')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === 'CURRENT'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>Current Stay</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
            activeTab === 'CURRENT' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {categorizedBookings.current.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('COMPLETED')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === 'COMPLETED'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>Completed</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
            activeTab === 'COMPLETED' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {categorizedBookings.completed.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('CANCELLED')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === 'CANCELLED'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>Cancelled</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
            activeTab === 'CANCELLED' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {categorizedBookings.cancelled.length}
          </span>
        </button>
      </div>

      {/* Bookings List Cards */}
      <div className="space-y-4">
        {filteredList.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-2">
            <BedDouble className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No {activeTab.toLowerCase()} reservations found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You do not have any {activeTab === 'ALL' ? '' : activeTab.toLowerCase()} stays registered under your Customer ID. Check other categories or reserve a suite.
            </p>
          </div>
        ) : (
          filteredList.map(b => {
            const isEligibleCancel = canCancel(b);
            const refCode = b.bookingReference || b.id;

            return (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 hover:border-blue-300 hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                {/* Left side details */}
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg inline-flex items-center gap-1">
                      <span>Ref:</span>
                      <span>{refCode}</span>
                    </span>
                    <StatusBadge status={b.status} size="sm" />
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Payment: {b.paymentStatus || 'Paid'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900">{b.roomTypeName}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <BedDouble className="w-3.5 h-3.5 text-slate-400" />
                      <span>{b.roomNumber ? `Physical Room: ${b.roomNumber}` : 'Room allocation: Assigned at Check-In'}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="font-mono font-medium text-slate-800 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      {b.checkIn} → {b.checkOut} ({b.nights} {b.nights === 1 ? 'night' : 'nights'})
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {b.guests} {b.guests === 1 ? 'Guest' : 'Guests'}
                    </span>
                    <span>·</span>
                    <span className="font-mono font-bold text-slate-900">
                      ${b.totalAmount} Total Folio
                    </span>
                    <span>·</span>
                    <span className="text-[11px] text-slate-400">
                      Booked {b.createdAt}
                    </span>
                  </div>
                </div>

                {/* Right side actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-center">
                  <button
                    onClick={() => setSelectedBooking(b)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Voucher</span>
                  </button>

                  {b.status === 'Confirmed' && isEligibleCancel && (
                    <button
                      disabled={isCancelling}
                      onClick={() => handleCancel(b.id)}
                      className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors disabled:opacity-50"
                    >
                      Cancel Booking
                    </button>
                  )}

                  {b.status === 'Confirmed' && !isEligibleCancel && (
                    <span
                      className="text-[10px] text-slate-400 italic max-w-[130px] leading-tight text-right hidden lg:block"
                      title="Cancellations are permitted up to 48 hours prior to check-in"
                    >
                      Cancellation deadline elapsed (&lt;48h)
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Booking Details Voucher Modal */}
      {selectedBooking && (
        <Modal
          isOpen={Boolean(selectedBooking)}
          onClose={() => setSelectedBooking(null)}
          title="Digital Stay Voucher & Folio"
          subtitle={`Official reservation confirmation for ${selectedBooking.bookingReference || selectedBooking.id}`}
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {selectedBooking.status === 'Confirmed' && canCancel(selectedBooking) && (
                  <button
                    type="button"
                    disabled={isCancelling}
                    onClick={() => handleCancel(selectedBooking.id)}
                    className="px-3.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors disabled:opacity-50"
                  >
                    Cancel Reservation
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Close Voucher
              </button>
            </div>
          }
        >
          <div className="space-y-6 text-xs text-slate-700">
            {/* Voucher Brand & Reference Banner */}
            <div className="bg-slate-900 text-white p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
                  Luxery Hotel & Residences
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {selectedBooking.roomTypeName}
                </h3>
                <p className="text-xs text-slate-300 font-mono">
                  Room: {selectedBooking.roomNumber || 'Assigned upon check-in arrival'}
                </p>
              </div>

              <div className="bg-white/10 p-3 rounded-lg border border-white/10 shrink-0 text-right">
                <span className="text-[10px] uppercase text-slate-400 block font-semibold">Booking Reference</span>
                <span className="text-base font-bold font-mono tracking-wider text-white">
                  {selectedBooking.bookingReference || selectedBooking.id}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyRef(selectedBooking.bookingReference || selectedBooking.id)}
                  className="mt-1 text-[10px] text-blue-300 hover:text-white flex items-center gap-1 justify-end"
                >
                  {copiedRef ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedRef ? 'Copied' : 'Copy Ref'}</span>
                </button>
              </div>
            </div>

            {/* Stay Dates & Guest Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Check-In Date</span>
                <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">{selectedBooking.checkIn}</span>
                <span className="text-[10px] text-slate-500">From 2:00 PM (14:00)</span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Check-Out Date</span>
                <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">{selectedBooking.checkOut}</span>
                <span className="text-[10px] text-slate-500">Until 11:00 AM (11:00)</span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Duration</span>
                <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">{selectedBooking.nights} Nights</span>
                <span className="text-[10px] text-slate-500">{selectedBooking.guests} Registered Guests</span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Booking Status</span>
                <div className="mt-1">
                  <StatusBadge status={selectedBooking.status} size="sm" />
                </div>
              </div>
            </div>

            {/* Guest & Customer Details */}
            <div className="p-4 rounded-xl border border-slate-200 space-y-2">
              <h5 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Customer Identity & Verification</span>
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px]">Guest Name:</span>{' '}
                  <span className="font-semibold text-slate-900">{selectedBooking.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Customer ID:</span>{' '}
                  <span className="font-mono font-bold text-blue-600">{selectedBooking.customerCode || customerProfile?.customer_code || 'CUS-GUEST'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Email:</span>{' '}
                  <span className="font-mono text-slate-700">{selectedBooking.customerEmail}</span>
                </div>
              </div>
            </div>

            {/* Financial Folio Breakdown */}
            <div className="p-4 rounded-xl border border-slate-200 space-y-3">
              <h5 className="font-bold text-slate-900 text-xs">Folio Charges & Settlement</h5>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Room Charge ({selectedBooking.nights} nights @ ${selectedBooking.adr}/night)</span>
                  <span className="font-mono">${selectedBooking.adr * selectedBooking.nights}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>City Tourism & Municipal Service Tax</span>
                  <span className="font-mono">${Math.max(0, selectedBooking.totalAmount - (selectedBooking.adr * selectedBooking.nights))}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
                  <span>Total Settled Amount</span>
                  <span className="font-mono text-blue-700">${selectedBooking.totalAmount}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Settlement Status:</span>
                  <span className="font-semibold text-emerald-600">Paid in Full ({selectedBooking.paymentStatus || 'Direct Credit'})</span>
                </div>
              </div>
            </div>

            {/* Special Requests */}
            {selectedBooking.specialRequests && (
              <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs">
                <span className="font-bold block mb-0.5">Special Guest Requests:</span>
                <p className="italic">{selectedBooking.specialRequests}</p>
              </div>
            )}

            {/* Cancellation Policy Notice */}
            <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="font-bold text-slate-700 block">Cancellation & Amendment Policy:</span>
              <p>
                Flexible cancellation is permitted up to 48 hours prior to 2:00 PM local hotel time on check-in day. In the event of timely cancellation, refundable deposits are returned directly to the originating payment instrument within 3–5 business days.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
