import React, { useState, useMemo } from 'react';
import {
  Search,
  Calendar,
  Users,
  Star,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Wifi,
  Coffee,
  Waves,
  Shield,
  Eye,
  Building,
  BedDouble
} from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { RoomType, Booking } from '../../types/hotel';
import { StatusBadge } from '../common/StatusBadge';
import { CustomerBookingModal } from './CustomerBookingModal';

interface CustomerHomeProps {
  onNavigateTab: (tabId: string) => void;
  onSelectBooking?: (bookingId: string) => void;
}

export const CustomerHome: React.FC<CustomerHomeProps> = ({
  onNavigateTab,
  onSelectBooking
}) => {
  const { roomTypes, customerBookings, activeCustomerBooking, cancelBooking } = useHotel();

  // Search Bar State
  const defaultCheckIn = useMemo(() => new Date().toISOString().split('T')[0], []);
  const defaultCheckOut = useMemo(() => new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0], []);

  const [searchCheckIn, setSearchCheckIn] = useState(defaultCheckIn);
  const [searchCheckOut, setSearchCheckOut] = useState(defaultCheckOut);
  const [searchGuests, setSearchGuests] = useState(2);
  const [hasSearched, setHasSearched] = useState(false);

  // Booking Modal
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<RoomType | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Filter available rooms based on search
  const availableRoomTypes = roomTypes.filter(rt => {
    if (hasSearched && rt.capacity < searchGuests) return false;
    return rt.status === 'Active';
  });

  const recommendedRoomTypes = roomTypes.filter(
    rt => rt.name.includes('Presidential') || rt.name.includes('Ocean') || rt.name.includes('Garden')
  );

  const pastBookings = customerBookings.filter(b => b.status === 'Checked-Out');

  const handleBookNow = (rt: RoomType) => {
    setSelectedRoomForBooking(rt);
    setIsBookingModalOpen(true);
  };

  const getVisualHeaderBg = (theme: string) => {
    switch (theme) {
      case 'ocean':
        return 'from-sky-700 via-blue-800 to-indigo-900';
      case 'executive':
        return 'from-slate-800 via-slate-900 to-blue-950';
      case 'presidential':
        return 'from-amber-900 via-stone-900 to-slate-950';
      case 'garden':
        return 'from-emerald-800 via-teal-900 to-slate-900';
      default:
        return 'from-blue-800 via-slate-800 to-slate-900';
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Welcome Hero Banner & Hospitality Atmosphere */}
      <div className="relative rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 p-6 sm:p-8 text-white shadow-lg overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Luxery Hotel Hospitality & Residences</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome to Luxery Hotel
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
            Experience bespoke seaside suites, intelligent round-the-clock guest concierges, and privileged direct-booking rates.
          </p>
        </div>
      </div>

      {/* 2. Hotel Booking Search Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 -mt-4 relative z-20">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Check Availability & Reserve</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Check-In Date
            </label>
            <input
              type="date"
              value={searchCheckIn}
              onChange={e => setSearchCheckIn(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Check-Out Date
            </label>
            <input
              type="date"
              value={searchCheckOut}
              onChange={e => setSearchCheckOut(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Guests
            </label>
            <select
              value={searchGuests}
              onChange={e => setSearchGuests(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value={1}>1 Guest (Single)</option>
              <option value={2}>2 Guests (Couple)</option>
              <option value={3}>3 Guests</option>
              <option value={4}>4 Guests</option>
              <option value={5}>5+ Guests (Family)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setHasSearched(true)}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Search className="w-4 h-4" />
              <span>Search Rooms</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. My Upcoming Booking Card (Prominently featured) */}
      {activeCustomerBooking && (
        <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white rounded-2xl border-2 border-blue-200 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-blue-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                My Upcoming Stay
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1">
                {activeCustomerBooking.roomTypeName}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={activeCustomerBooking.status} />
              <button
                onClick={() => onNavigateTab('my-bookings')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline ml-2"
              >
                View Full Voucher
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 py-4 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-medium">Booking ID</span>
              <p className="font-mono font-bold text-blue-700 text-sm mt-0.5">{activeCustomerBooking.id}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-medium">Check-In</span>
              <p className="font-mono font-semibold text-slate-800 text-sm mt-0.5">{activeCustomerBooking.checkIn}</p>
              <span className="text-[10px] text-slate-500">From 2:00 PM</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-medium">Check-Out</span>
              <p className="font-mono font-semibold text-slate-800 text-sm mt-0.5">{activeCustomerBooking.checkOut}</p>
              <span className="text-[10px] text-slate-500">Until 11:00 AM</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-medium">Guests</span>
              <p className="font-mono font-semibold text-slate-800 text-sm mt-0.5">{activeCustomerBooking.guests} Guests</p>
              <span className="text-[10px] text-slate-500">{activeCustomerBooking.nights} nights</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-medium">Total Billed</span>
              <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">₹{activeCustomerBooking.totalAmount.toLocaleString('en-IN')}</p>
              <span className="text-[10px] text-emerald-600 font-medium">Guaranteed</span>
            </div>
          </div>

          <div className="pt-3 border-t border-blue-100/80 flex flex-wrap items-center justify-between gap-2 text-xs text-blue-900">
            <div>
              <span className="font-semibold text-slate-700">Primary Guest: </span>
              <span className="font-bold text-slate-900">{activeCustomerBooking.customerName}</span>
              {activeCustomerBooking.customerPhone && (
                <span className="font-mono text-slate-600 ml-2">({activeCustomerBooking.customerPhone})</span>
              )}
              {(activeCustomerBooking.aadharNumber || activeCustomerBooking.idProofNumber) && (
                <span className="ml-2 font-mono text-[11px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                  {activeCustomerBooking.idProofType || 'Aadhar'}: {activeCustomerBooking.aadharNumber || activeCustomerBooking.idProofNumber}
                </span>
              )}
            </div>
            {activeCustomerBooking.specialRequests && (
              <div className="text-slate-500 italic">
                <span>Notes: </span>
                <span>{activeCustomerBooking.specialRequests}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Available Rooms Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Available Rooms & Suites</h2>
            <p className="text-xs text-slate-500">
              Handcrafted comfort with panoramic vistas and bespoke guest privileges.
            </p>
          </div>
          {hasSearched && (
            <button
              onClick={() => setHasSearched(false)}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              Reset filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableRoomTypes.map(rt => (
            <div
              key={rt.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Styled Architectural Room Header Placeholder */}
                <div
                  className={`h-44 bg-gradient-to-br ${getVisualHeaderBg(
                    rt.imageTheme
                  )} p-4 flex flex-col justify-between relative text-white`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded text-white">
                      {rt.bedType}
                    </span>
                    <span className="text-[10px] font-semibold bg-emerald-500 text-white px-2 py-0.5 rounded shadow-xs">
                      Available
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-white/80 font-mono">{rt.sizeSqFt} sq ft</span>
                    <h3 className="text-lg font-bold text-white tracking-tight drop-shadow-xs">
                      {rt.name}
                    </h3>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {rt.description}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-500 border-y border-slate-100 py-2">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Up to {rt.capacity} Guests</span>
                    </div>
                    <span>·</span>
                    <div className="flex items-center gap-1 font-mono">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>{rt.totalInventory} Available</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Included Amenities
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {rt.amenities.slice(0, 4).map((amenity, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 bg-slate-50 text-slate-600 rounded border border-slate-100"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer with Price and Book Now button */}
              <div className="p-5 pt-0 flex items-center justify-between border-t border-slate-100 mt-2">
                <div>
                  <div className="text-lg font-bold font-mono text-slate-900">₹{rt.basePrice.toLocaleString('en-IN')}</div>
                  <span className="text-[10px] text-slate-400">per night + tax</span>
                </div>
                <button
                  onClick={() => handleBookNow(rt)}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs"
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Recommended Rooms Section */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <h2 className="text-base font-bold text-slate-900">Recommended Signature Suites</h2>
          </div>
          <span className="text-xs text-slate-500">Highest rated by previous guests</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendedRoomTypes.map(rt => (
            <div
              key={rt.id}
              className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-700 uppercase">{rt.code}</span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">{rt.name}</h4>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1">{rt.description}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900 text-sm">₹{rt.basePrice.toLocaleString('en-IN')}/nt</span>
                <button
                  onClick={() => handleBookNow(rt)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800"
                >
                  Reserve Suite →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Booking History */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900">Previous Completed Stays</h3>
          <span className="text-xs text-slate-400">Past stay history</span>
        </div>

        <div className="divide-y divide-slate-100">
          {pastBookings.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No previous stays on file.</p>
          ) : (
            pastBookings.map(b => (
              <div key={b.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-xs">{b.roomTypeName}</span>
                    <StatusBadge status={b.status} size="sm" />
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {b.checkIn} → {b.checkOut} ({b.nights} nights) · ID: {b.id}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900">₹{b.totalAmount.toLocaleString('en-IN')}</span>
                    <span className="block text-[10px] text-slate-400">Total Folio</span>
                  </div>
                  <button
                    onClick={() => alert(`Receipt downloaded for ${b.id}`)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium"
                  >
                    Receipt
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Booking Modal */}
      <CustomerBookingModal
        roomType={selectedRoomForBooking}
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setSelectedRoomForBooking(null);
        }}
        defaultCheckIn={searchCheckIn}
        defaultCheckOut={searchCheckOut}
        defaultGuests={searchGuests}
      />
    </div>
  );
};
