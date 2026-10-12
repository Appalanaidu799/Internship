import React, { useState } from 'react';
import { Calendar, Download, Eye, AlertTriangle, CheckCircle2, Clock, MapPin, BedDouble } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { Booking } from '../../types/hotel';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';

export const CustomerMyBookings: React.FC = () => {
  const { customerBookings, cancelBooking } = useHotel();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancelFeedback, setCancelFeedback] = useState('');

  const activeBookings = customerBookings.filter(b => b.status === 'Confirmed' || b.status === 'Checked-In');
  const pastBookings = customerBookings.filter(b => b.status === 'Checked-Out' || b.status === 'Cancelled');

  const handleCancel = (bookingId: string) => {
    if (confirm('Are you sure you want to cancel this booking? Refund will be credited within 3–5 business days.')) {
      cancelBooking(bookingId);
      setCancelFeedback(`Booking ${bookingId} successfully cancelled.`);
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking(null);
      }
      setTimeout(() => setCancelFeedback(''), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">My Reservations & Stay History</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage upcoming arrivals, retrieve digital vouchers, and review past check-out folios.
          </p>
        </div>
      </div>

      {cancelFeedback && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{cancelFeedback}</span>
        </div>
      )}

      {/* Active Upcoming Reservations */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500 text-xs">
          Active & Upcoming Stays ({activeBookings.length})
        </h3>

        {activeBookings.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
            You have no upcoming reservations scheduled. Browse our available suites to reserve.
          </div>
        ) : (
          activeBookings.map(b => (
            <div
              key={b.id}
              className="bg-white rounded-xl border-2 border-blue-200 shadow-xs p-5 hover:border-blue-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {b.id}
                  </span>
                  <StatusBadge status={b.status} size="sm" />
                </div>
                <h4 className="text-base font-bold text-slate-900">{b.roomTypeName}</h4>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  <span className="font-mono">{b.checkIn} → {b.checkOut} ({b.nights} nights)</span>
                  <span>·</span>
                  <span>{b.guests} Guests</span>
                  <span>·</span>
                  <span className="font-mono font-bold text-slate-900">${b.totalAmount} Total</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setSelectedBooking(b)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> View Voucher
                </button>
                {b.status === 'Confirmed' && (
                  <button
                    onClick={() => handleCancel(b.id)}
                    className="px-3.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Past Completed History */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500 text-xs">
          Completed & Cancelled Stays ({pastBookings.length})
        </h3>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Booking ID</th>
                  <th className="py-3 px-4">Room Type</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4">Guests</th>
                  <th className="py-3 px-4">Folio Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pastBookings.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">{b.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{b.roomTypeName}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{b.checkIn} → {b.checkOut}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{b.guests}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">${b.totalAmount}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={b.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => alert(`Folio receipt downloaded for ${b.id}`)}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <Modal
          isOpen={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          title={`Booking Voucher: ${selectedBooking.id}`}
          subtitle="Luxery Hotel Official Confirmation Voucher"
          maxWidth="md"
          footer={
            <div className="flex items-center justify-between w-full">
              <button
                onClick={() => alert(`Voucher ${selectedBooking.id} printed.`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Download className="w-3.5 h-3.5" /> Print Voucher
              </button>
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-500 uppercase text-[10px]">Reservation Status</span>
                <StatusBadge status={selectedBooking.status} />
              </div>
              <h4 className="text-base font-bold text-slate-900">{selectedBooking.roomTypeName}</h4>
              <p className="font-mono text-slate-600">Assigned Unit: {selectedBooking.roomNumber || 'Confirmed at arrival'}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-lg border border-slate-200 font-mono">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-sans">Check-In</span>
                <p className="font-bold text-slate-900">{selectedBooking.checkIn}</p>
                <span className="text-[10px] text-slate-500 font-sans">From 2:00 PM</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-sans">Check-Out</span>
                <p className="font-bold text-slate-900">{selectedBooking.checkOut}</p>
                <span className="text-[10px] text-slate-500 font-sans">Until 11:00 AM</span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Nightly Rate:</span>
                <span className="font-mono font-semibold">${selectedBooking.adr} / nt</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Duration:</span>
                <span className="font-mono">{selectedBooking.nights} nights</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-slate-900 text-sm">
                <span>Total Payment:</span>
                <span className="font-mono text-emerald-700">${selectedBooking.totalAmount}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
