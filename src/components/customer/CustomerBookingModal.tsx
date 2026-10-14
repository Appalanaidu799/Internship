import React, { useState } from 'react';
import { RoomType } from '../../types/hotel';
import { Modal } from '../common/Modal';
import { useHotel } from '../../context/HotelContext';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Users, DollarSign, CheckCircle2, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

interface CustomerBookingModalProps {
  roomType: RoomType | null;
  isOpen: boolean;
  onClose: () => void;
  defaultCheckIn?: string;
  defaultCheckOut?: string;
  defaultGuests?: number;
}

export const CustomerBookingModal: React.FC<CustomerBookingModalProps> = ({
  roomType,
  isOpen,
  onClose,
  defaultCheckIn = '2026-10-18',
  defaultCheckOut = '2026-10-21',
  defaultGuests = 2
}) => {
  const { createCustomerBooking } = useHotel();
  const { user, customerProfile } = useAuth();

  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);
  const [guests, setGuests] = useState(defaultGuests);
  const [specialRequests, setSpecialRequests] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [confirmedBookingId, setConfirmedBookingId] = useState('');

  if (!roomType) return null;

  // Calculate nights
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  const diffTime = Math.max(d2.getTime() - d1.getTime(), 1000 * 3600 * 24);
  const nights = Math.max(Math.ceil(diffTime / (1000 * 3600 * 24)), 1);
  const totalAmount = roomType.basePrice * nights;
  const taxes = Math.round(totalAmount * 0.12);
  const finalTotal = totalAmount + taxes;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');

    if (new Date(checkOut) <= new Date(checkIn)) {
      setBookingError('Check-out date must be after check-in date.');
      return;
    }

    if (guests > roomType.capacity) {
      setBookingError(`Guest limit exceeded. This room accommodates up to ${roomType.capacity} guests.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const newBooking = await createCustomerBooking({
        roomTypeId: roomType.id,
        roomTypeName: roomType.name,
        checkIn,
        checkOut,
        guests,
        nights,
        adr: roomType.basePrice,
        specialRequests
      });
      setConfirmedBookingId(newBooking.bookingReference || newBooking.id);
      setIsSuccess(true);
    } catch (err: any) {
      setBookingError(err?.message || 'Failed to complete reservation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setBookingError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isSuccess ? 'Reservation Confirmed' : `Reserve ${roomType.name}`}
      subtitle={isSuccess ? 'Your stay at Luxery Hotel is secured.' : 'Confirm dates and guest details for your stay.'}
      maxWidth="md"
      footer={
        isSuccess ? (
          <button
            onClick={handleClose}
            className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
          >
            Done & View In My Bookings
          </button>
        ) : (
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirm}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Reservation...</span>
                </>
              ) : (
                <span>Confirm Reservation (${finalTotal})</span>
              )}
            </button>
          </div>
        )
      }
    >
      {isSuccess ? (
        <div className="text-center py-4 space-y-3">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-4 ring-emerald-50">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">Reservation Confirmed!</h4>
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs font-mono font-bold mt-1">
              <span>Reference:</span>
              <span>{confirmedBookingId}</span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono mt-1">
              Customer ID: {customerProfile?.customer_code || 'CUS-NAIDU001'}
            </p>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Suite:</span>
              <span className="font-semibold text-slate-800">{roomType.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Stay Duration:</span>
              <span className="font-mono text-slate-800">{checkIn} → {checkOut} ({nights} nights)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Registered Guests:</span>
              <span className="font-mono text-slate-800">{guests} Guests</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
              <span className="text-slate-700">Total Folio:</span>
              <span className="font-mono text-blue-700">${finalTotal}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Your booking is safely registered in Supabase and visible anytime under 'My Bookings'.
          </p>
        </div>
      ) : (
        <form onSubmit={handleConfirm} className="space-y-4 text-xs">
          {bookingError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{bookingError}</span>
            </div>
          )}

          {/* Room info snippet */}
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 flex items-center justify-between">
            <div>
              <p className="font-bold text-blue-950 text-sm">{roomType.name}</p>
              <p className="text-blue-700 text-[11px] font-mono">
                ${roomType.basePrice} / night · Max capacity: {roomType.capacity} Guests
              </p>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
              Available
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Check-In Date</label>
              <input
                type="date"
                required
                value={checkIn}
                onChange={e => setCheckIn(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Check-Out Date</label>
              <input
                type="date"
                required
                value={checkOut}
                onChange={e => setCheckOut(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Total Guests</label>
            <input
              type="number"
              min="1"
              max={roomType.capacity}
              value={guests}
              onChange={e => setGuests(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500/20"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Accommodates 1 to {roomType.capacity} guests.
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Special Concierge Requests (Optional)</label>
            <textarea
              rows={2}
              value={specialRequests}
              onChange={e => setSpecialRequests(e.target.value)}
              placeholder="e.g. Quiet floor, early check-in, honeymoon setup, foam pillows"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>

          {/* Pricing Folio Breakdown */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
            <div className="flex justify-between">
              <span>Base Rate ({nights} nights @ ${roomType.basePrice}):</span>
              <span className="font-mono">${totalAmount}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxes & Service Fees (12%):</span>
              <span className="font-mono">${taxes}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 text-xs pt-1 border-t border-slate-100">
              <span>Total Estimated Folio:</span>
              <span className="font-mono text-blue-700">${finalTotal}</span>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};
