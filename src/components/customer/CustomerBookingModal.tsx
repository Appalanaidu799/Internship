import React, { useState } from 'react';
import { RoomType } from '../../types/hotel';
import { Modal } from '../common/Modal';
import { useHotel } from '../../context/HotelContext';
import { Calendar, Users, DollarSign, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

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

  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);
  const [guests, setGuests] = useState(defaultGuests);
  const [specialRequests, setSpecialRequests] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
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

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const newBooking = createCustomerBooking({
      roomTypeId: roomType.id,
      roomTypeName: roomType.name,
      checkIn,
      checkOut,
      guests,
      nights,
      adr: roomType.basePrice,
      specialRequests
    });
    setConfirmedBookingId(newBooking.id);
    setIsSuccess(true);
  };

  const handleClose = () => {
    setIsSuccess(false);
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
            className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Done & View My Bookings
          </button>
        ) : (
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
            >
              Confirm Reservation (${finalTotal})
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
            <h4 className="text-base font-bold text-slate-900">Booking Confirmed!</h4>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Booking Reference: {confirmedBookingId}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Suite:</span>
              <span className="font-semibold text-slate-800">{roomType.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Stay Duration:</span>
              <span className="font-mono text-slate-800">{checkIn} → {checkOut} ({nights} nights)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Billed:</span>
              <span className="font-mono font-bold text-slate-900">${finalTotal}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            A confirmation voucher with check-in instructions has been dispatched to your email.
          </p>
        </div>
      ) : (
        <form onSubmit={handleConfirm} className="space-y-4 text-xs">
          {/* Room info snippet */}
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 flex items-center justify-between">
            <div>
              <p className="font-bold text-blue-950 text-sm">{roomType.name}</p>
              <p className="text-blue-700 text-[11px] font-mono">${roomType.basePrice} / night · Max {roomType.capacity} Guests</p>
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
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Special Requests (Optional)</label>
            <textarea
              rows={2}
              value={specialRequests}
              onChange={e => setSpecialRequests(e.target.value)}
              placeholder="e.g. High floor preference, airport transfer timing..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Pricing summary breakdown */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 font-mono">
            <div className="flex justify-between text-slate-600">
              <span>${roomType.basePrice} × {nights} nights</span>
              <span>${totalAmount}</span>
            </div>
            <div className="flex justify-between text-slate-600 text-[11px]">
              <span>Hospitality Tax & Resort Fee (12%)</span>
              <span>${taxes}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
              <span>Total Estimated Folio:</span>
              <span>${finalTotal}</span>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};
