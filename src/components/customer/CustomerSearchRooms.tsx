import React, { useState } from 'react';
import { Search, Filter, Users, BedDouble, Check, DollarSign } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { RoomType } from '../../types/hotel';
import { CustomerBookingModal } from './CustomerBookingModal';

export const CustomerSearchRooms: React.FC = () => {
  const { roomTypes } = useHotel();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCapacity, setSelectedCapacity] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [selectedAmenity, setSelectedAmenity] = useState<string>('ALL');

  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const allAmenities = Array.from(
    new Set(roomTypes.flatMap(rt => rt.amenities))
  ).slice(0, 6);

  const filteredRooms = roomTypes.filter(rt => {
    if (rt.status !== 'Active') return false;
    if (rt.basePrice > maxPrice) return false;
    if (selectedCapacity > 0 && rt.capacity < selectedCapacity) return false;
    if (selectedAmenity !== 'ALL' && !rt.amenities.includes(selectedAmenity)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!rt.name.toLowerCase().includes(q) && !rt.description.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Explore Hotel Suites & Villas</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Filter by occupancy, budget parameters, and luxury amenities.
          </p>
        </div>
        <span className="text-xs font-mono font-medium text-slate-500">
          Showing {filteredRooms.length} available suite types
        </span>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Search by Keyword
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="e.g. Ocean, Villa, Executive..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Minimum Guests
            </label>
            <select
              value={selectedCapacity}
              onChange={e => setSelectedCapacity(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value={0}>Any Occupancy</option>
              <option value={1}>1+ Guest</option>
              <option value={2}>2+ Guests</option>
              <option value={3}>3+ Guests</option>
              <option value={4}>4+ Guests</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Max Nightly Budget
              </label>
              <span className="text-xs font-mono font-bold text-slate-900">₹{maxPrice.toLocaleString('en-IN')}/night</span>
            </div>
            <input
              type="range"
              min="900"
              max="10000"
              step="500"
              value={maxPrice}
              onChange={e => setMaxPrice(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2"
            />
          </div>
        </div>

        {/* Amenity Pills */}
        <div className="pt-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[11px] text-slate-400 font-medium shrink-0">Featured Amenity:</span>
          <button
            onClick={() => setSelectedAmenity('ALL')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              selectedAmenity === 'ALL'
                ? 'bg-slate-900 text-white font-medium'
                : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            All Amenities
          </button>
          {allAmenities.map(am => (
            <button
              key={am}
              onClick={() => setSelectedAmenity(am)}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${
                selectedAmenity === am
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              {am}
            </button>
          ))}
        </div>
      </div>

      {/* Room Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-slate-400 text-xs">
            No rooms match your filter criteria. Try adjusting the budget slider or guest count.
          </div>
        ) : (
          filteredRooms.map(rt => (
            <div
              key={rt.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div
                  className={`h-40 bg-gradient-to-br ${getVisualHeaderBg(
                    rt.imageTheme
                  )} p-4 flex flex-col justify-between text-white`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded">
                      {rt.bedType}
                    </span>
                    <span className="text-[10px] bg-emerald-500 font-semibold px-2 py-0.5 rounded">
                      Available
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-white/80 font-mono">{rt.sizeSqFt} sq ft</span>
                    <h3 className="text-lg font-bold text-white tracking-tight">{rt.name}</h3>
                  </div>
                </div>

                <div className="p-4 space-y-3 text-xs">
                  <p className="text-slate-600 line-clamp-2 leading-relaxed">{rt.description}</p>
                  <div className="flex items-center gap-3 text-slate-500 border-y border-slate-100 py-2">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{rt.capacity} Guests</span>
                    </div>
                    <span>·</span>
                    <span>Inventory: {rt.totalInventory} units</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {rt.amenities.map((am, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 bg-slate-50 border border-slate-100 text-slate-600 rounded"
                      >
                        {am}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-base font-bold font-mono text-slate-900">₹{rt.basePrice.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-slate-400 block">/ night</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedRoom(rt);
                    setIsBookingModalOpen(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                >
                  Book Now
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <CustomerBookingModal
        roomType={selectedRoom}
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setSelectedRoom(null);
        }}
      />
    </div>
  );
};
