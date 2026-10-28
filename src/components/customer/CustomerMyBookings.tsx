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
  RefreshCw,
  CreditCard,
  FileCheck,
  RotateCcw,
  XCircle,
  AlertCircle,
  Receipt,
  ArrowRight
} from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { useAuth } from '../../context/AuthContext';
import { Booking } from '../../types/hotel';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { calculateRefundSchedule } from '../../lib/supabase';

type BookingFilterTab = 'ALL' | 'UPCOMING' | 'CURRENT' | 'COMPLETED' | 'CANCELLED';

export const CustomerMyBookings: React.FC = () => {
  const {
    customerBookings,
    cancelBooking,
    refreshCustomerBookings,
    refreshAllData,
    syncBookingsToRemote,
    isDatabaseSyncing
  } = useHotel();
  const { user, customerProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<BookingFilterTab>('ALL');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [cancellationReason, setCancellationReason] = useState('Change of travel plans / scheduling conflict');

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

  // Handle open cancellation modal (either from card or inside View Voucher)
  const handleInitiateCancel = (b: Booking) => {
    setBookingToCancel(b);
    setCancellationReason('Change of travel plans / scheduling conflict');
    setCancelError('');
  };

  // Submit cancellation with day-based refund calculation
  const handleConfirmCancellation = async () => {
    if (!bookingToCancel) return;

    const schedule = calculateRefundSchedule(bookingToCancel.checkIn, bookingToCancel.totalAmount);

    setIsCancelling(true);
    setCancelError('');

    try {
      await cancelBooking(bookingToCancel.id, {
        refundAmount: schedule.refundAmount,
        cancellationFee: schedule.cancellationFee,
        cancellationReason: cancellationReason,
        refundPercentage: schedule.refundPercentage
      });

      const refLabel = bookingToCancel.bookingReference || bookingToCancel.id;
      setCancelFeedback(
        `Reservation ${refLabel} cancelled. Refund of ₹${schedule.refundAmount.toLocaleString('en-IN')} (${schedule.refundPercentage}%) credited back to your Razorpay payment method.`
      );

      // Close both modals
      setBookingToCancel(null);
      setSelectedBooking(null);

      // Automatically switch to Cancelled tab so customer sees the verified status
      setActiveTab('CANCELLED');

      setTimeout(() => setCancelFeedback(''), 7000);
    } catch (err: any) {
      setCancelError(err?.message || 'Failed to cancel reservation. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCopyRef = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  // Active cancellation schedule if modal is open
  const cancelSchedule = useMemo(() => {
    if (!bookingToCancel) return null;
    return calculateRefundSchedule(bookingToCancel.checkIn, bookingToCancel.totalAmount);
  }, [bookingToCancel]);

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
            onClick={async () => {
              await syncBookingsToRemote();
              await refreshCustomerBookings();
              await refreshAllData();
            }}
            disabled={isDatabaseSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors border border-blue-200 disabled:opacity-50"
            title="Synchronize and push any pending bookings to Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isDatabaseSyncing ? 'animate-spin' : ''}`} />
            <span>{isDatabaseSyncing ? 'Syncing...' : 'Sync with Supabase'}</span>
          </button>
          <div className="text-xs text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
            Total Folios: <span className="font-bold text-slate-900 font-mono">{customerBookings.length}</span>
          </div>
        </div>
      </div>

      {cancelFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{cancelFeedback}</span>
        </div>
      )}

      {cancelError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-medium">{cancelError}</span>
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
            const refCode = b.bookingReference || b.id;
            const isConfirmed = b.status === 'Confirmed';
            const isCancelled = b.status === 'Cancelled';

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

                    {isCancelled ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                        <Receipt className="w-3 h-3 text-amber-600" />
                        <span>
                          Refund: ₹{(b.refundAmount ?? b.totalAmount).toLocaleString('en-IN')}
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Payment: {b.paymentStatus || 'Paid'}
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      <CreditCard className="w-3 h-3 text-blue-600" />
                      <span>{b.paymentMethod || 'Razorpay'}</span>
                      {b.razorpayPaymentId && (
                        <span className="font-mono text-[9px] text-blue-800">({b.razorpayPaymentId})</span>
                      )}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900">{b.roomTypeName}</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <BedDouble className="w-3.5 h-3.5 text-slate-400" />
                        <span>{b.roomNumber ? `Physical Room: ${b.roomNumber}` : 'Room: Assigned at Check-In'}</span>
                      </span>
                      <span>·</span>
                      <span className="font-semibold text-slate-800">
                        Guest: {b.customerName || 'Registered Customer'}
                      </span>
                      {b.customerPhone && (
                        <>
                          <span>·</span>
                          <span className="font-mono text-slate-600">{b.customerPhone}</span>
                        </>
                      )}
                      {(b.aadharNumber || b.idProofNumber) && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-slate-700 border border-slate-200">
                          {b.idProofType || 'Aadhar'}: {b.aadharNumber || b.idProofNumber}
                        </span>
                      )}
                    </div>
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
                      ₹{b.totalAmount.toLocaleString('en-IN')} Total Folio
                    </span>
                    <span>·</span>
                    <span className="text-[11px] text-slate-400">
                      Booked {b.createdAt}
                    </span>
                  </div>

                  {/* Cancelled notes if available */}
                  {isCancelled && b.cancellationReason && (
                    <div className="text-[11px] text-rose-700 bg-rose-50/60 p-2 rounded-lg border border-rose-100 inline-block font-mono">
                      Reason: {b.cancellationReason}
                    </div>
                  )}
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

                  {/* Cancel Booking Button directly accessible on confirmed reservations */}
                  {isConfirmed && (
                    <button
                      onClick={() => handleInitiateCancel(b)}
                      className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                      title="Cancel reservation and calculate refund"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                      <span>Cancel Booking</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* =========================================================================
          DIGITAL STAY VOUCHER & FOLIO MODAL
          ========================================================================= */}
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
                {selectedBooking.status === 'Confirmed' && (
                  <button
                    type="button"
                    onClick={() => {
                      const b = selectedBooking;
                      handleInitiateCancel(b);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                    <span>Cancel Reservation & Claim Refund</span>
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

            {/* If Confirmed: Cancellation Action Banner inside Voucher */}
            {selectedBooking.status === 'Confirmed' && (
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <RotateCcw className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-rose-950 text-xs">Flexible Booking Cancellation & Refund</h5>
                    <p className="text-[11px] text-rose-800/90 mt-0.5">
                      Need to reschedule or cancel? You are eligible for an automated day-based refund credited directly to your Razorpay account.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const b = selectedBooking;
                    handleInitiateCancel(b);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors shadow-xs shrink-0 self-start sm:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Cancel Reservation</span>
                </button>
              </div>
            )}

            {/* If already Cancelled: Refund Receipt Banner */}
            {selectedBooking.status === 'Cancelled' && (
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  <span>Reservation Cancelled & Refund Credited</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Refund Amount</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm">
                      ₹{(selectedBooking.refundAmount ?? selectedBooking.totalAmount).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Refund Destination</span>
                    <span className="font-semibold text-slate-800">
                      {selectedBooking.paymentMethod || 'Razorpay Gateway'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Cancellation Reason</span>
                    <span className="text-slate-700">
                      {selectedBooking.cancellationReason || 'Voluntary Customer Cancellation'}
                    </span>
                  </div>
                </div>
              </div>
            )}

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
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <h5 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Guest Stay Identity & Verification (KYC)</span>
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Primary Guest Name:</span>
                  <span className="font-semibold text-slate-900">{selectedBooking.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Mobile / Phone:</span>
                  <span className="font-mono text-slate-800">{selectedBooking.customerPhone || 'Not recorded'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Email Address:</span>
                  <span className="font-mono text-slate-700">{selectedBooking.customerEmail}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Age & Gender:</span>
                  <span className="text-slate-800">
                    {selectedBooking.customerAge ? `${selectedBooking.customerAge} Years` : '18+'} · {selectedBooking.customerGender || 'Verified'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">{selectedBooking.idProofType || 'Aadhar Card'}:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedBooking.aadharNumber || selectedBooking.idProofNumber || 'Verified on Check-In'}
                  </span>
                </div>
                {selectedBooking.aadharDocumentName && (
                  <div>
                    <span className="text-slate-400 text-[11px] block">Aadhar Document:</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-0.5 truncate max-w-[200px]" title={selectedBooking.aadharDocumentName}>
                      <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{selectedBooking.aadharDocumentName}</span>
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 text-[11px] block">Purpose of Visit:</span>
                  <span className="text-slate-800">{selectedBooking.purposeOfVisit || 'Leisure / Vacation'}</span>
                </div>
                {(selectedBooking.customerAddress || selectedBooking.customerCity) && (
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 text-[11px] block">Residential Address:</span>
                    <span className="text-slate-800">
                      {[selectedBooking.customerAddress, selectedBooking.customerCity, selectedBooking.customerState, selectedBooking.customerCountry]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Folio Breakdown */}
            <div className="p-4 rounded-xl border border-slate-200 space-y-3">
              <h5 className="font-bold text-slate-900 text-xs">Folio Charges & Settlement</h5>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Room Charge ({selectedBooking.nights} nights @ ₹{selectedBooking.adr.toLocaleString('en-IN')}/night)</span>
                  <span className="font-mono">₹{(selectedBooking.adr * selectedBooking.nights).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>City Tourism & Municipal Service Tax</span>
                  <span className="font-mono">₹{Math.max(0, selectedBooking.totalAmount - (selectedBooking.adr * selectedBooking.nights)).toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
                  <span>Total Settled Amount</span>
                  <div className="text-right">
                    <span className="font-mono text-blue-700 font-bold">₹{selectedBooking.totalAmount.toLocaleString('en-IN')}</span>
                    <span className="text-xs font-mono text-emerald-700 ml-1.5 font-semibold">
                      ({selectedBooking.status === 'Cancelled' ? 'Refund Processed' : 'Paid in Full'})
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Settlement Gateway:</span>
                  <span className="font-semibold text-blue-700 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{selectedBooking.paymentMethod || 'Razorpay Gateway'}</span>
                    {selectedBooking.razorpayPaymentId && (
                      <span className="font-mono text-[10px] text-slate-700">({selectedBooking.razorpayPaymentId})</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Cancellation Policy Reference */}
            <div className="text-[11px] text-slate-500 bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5">
              <span className="font-bold text-slate-700 block">Automated Cancellation Refund Schedule:</span>
              <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                <li>7+ days before check-in: <strong>100% full refund</strong> (no fee)</li>
                <li>3 to 6 days before check-in: <strong>75% refund</strong> (25% hotel fee)</li>
                <li>1 to 2 days before check-in: <strong>50% refund</strong> (50% hotel fee)</li>
                <li>Under 24 hours / same-day: <strong>25% courtesy refund</strong> (75% fee)</li>
              </ul>
              <p className="text-[10px] text-slate-400 mt-1">
                Refunds are credited directly to the originating payment card or UPI account within 3–5 working days.
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
          CANCELLATION & REFUND BREAKDOWN CONFIRMATION MODAL
          ========================================================================= */}
      {bookingToCancel && cancelSchedule && (
        <Modal
          isOpen={Boolean(bookingToCancel)}
          onClose={() => setBookingToCancel(null)}
          title="Cancel Reservation & Refund Settlement"
          subtitle={`Reference: ${bookingToCancel.bookingReference || bookingToCancel.id} · ${bookingToCancel.roomTypeName}`}
          maxWidth="md"
          footer={
            <>
              <button
                type="button"
                onClick={() => setBookingToCancel(null)}
                disabled={isCancelling}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Keep Reservation
              </button>
              <button
                type="button"
                onClick={handleConfirmCancellation}
                disabled={isCancelling}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs disabled:opacity-50"
              >
                {isCancelling && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isCancelling ? 'Processing Refund...' : 'Confirm Cancellation & Refund'}</span>
              </button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Arrival Notice & Applied Refund Tier Card */}
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  Scheduled Check-In
                </span>
                <span className="font-mono text-xs font-bold text-blue-400">
                  {bookingToCancel.checkIn}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                <span className="text-xs text-slate-300">Days to Arrival:</span>
                <span className="font-mono font-bold text-white text-sm">
                  {cancelSchedule.daysRemaining} {cancelSchedule.daysRemaining === 1 ? 'Day' : 'Days'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-300">Applied Refund Tier:</span>
                <span className="font-bold text-emerald-400">{cancelSchedule.tierLabel}</span>
              </div>
            </div>

            {/* Financial Refund Breakdown Table */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
              <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-slate-500" />
                <span>Financial Folio Settlement</span>
              </h5>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Total Amount Paid (via Razorpay):</span>
                  <span className="font-mono font-semibold text-slate-900">
                    ₹{bookingToCancel.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>Hotel Cancellation / Retention Fee ({100 - cancelSchedule.refundPercentage}%):</span>
                  <span className="font-mono font-semibold">
                    -₹{cancelSchedule.cancellationFee.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-900">Net Refund Payable to You:</span>
                  <span className="font-mono text-emerald-700 text-base">
                    ₹{cancelSchedule.refundAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Refund Crediting Notice */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs flex items-start gap-2.5">
              <CreditCard className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-950">Refund Processing via Razorpay Gateway</p>
                <p className="text-[11px] text-blue-800/90 mt-0.5 leading-relaxed">
                  Upon confirmation, the refund of <strong>₹{cancelSchedule.refundAmount.toLocaleString('en-IN')}</strong> will be credited directly back to your original payment instrument (UPI / Card) within 3–5 banking business days.
                </p>
              </div>
            </div>

            {/* Reason for Cancellation */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Cancellation *
              </label>
              <select
                value={cancellationReason}
                onChange={e => setCancellationReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800"
              >
                <option value="Change of travel plans / scheduling conflict">
                  Change of travel plans / scheduling conflict
                </option>
                <option value="Flight or transit delay / cancellation">
                  Flight or transit delay / cancellation
                </option>
                <option value="Medical or personal emergency">
                  Medical or personal emergency
                </option>
                <option value="Found alternative accommodation">
                  Found alternative accommodation
                </option>
                <option value="Personal budget / financial reasons">
                  Personal budget / financial reasons
                </option>
                <option value="Other reason">
                  Other reason
                </option>
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
