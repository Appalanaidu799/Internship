import React, { useMemo } from 'react';
import { DollarSign, TrendingUp, Percent, BarChart3, CreditCard, Sparkles, Calendar } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { KpiCard } from '../common/KpiCard';
import { ChartCard, TrendLineChart, HorizontalBarChart } from '../common/ChartCard';

export const ManagementRevenueAdr: React.FC = () => {
  const { bookings, rooms, roomTypes } = useHotel();

  const totalBookings = bookings.length;
  const actualCollectedRevenue = bookings
    .filter(b => b.paymentStatus === 'Paid' && b.status !== 'Cancelled')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const pendingRevenue = bookings
    .filter(b => b.paymentStatus === 'Pending' && b.status !== 'Cancelled')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const avgAdr = totalBookings > 0 ? Math.round(bookings.reduce((sum, b) => sum + (b.adr || 0), 0) / totalBookings) : 0;
  const totalRooms = rooms.length;
  const revPar = totalRooms > 0 ? Math.round(actualCollectedRevenue / totalRooms) : 0;

  const totalNights = bookings.filter(b => b.status !== 'Cancelled').reduce((sum, b) => sum + (b.nights || 1), 0);
  const activeBookingsCount = bookings.filter(b => b.status !== 'Cancelled').length;
  const alos = activeBookingsCount > 0 ? (totalNights / activeBookingsCount).toFixed(1) : '0.0';

  // Dynamic ADR pace trend from real data
  const monthlyAdrTrend = useMemo(() => {
    if (bookings.length === 0) return [];
    const map = new Map<string, { totalAdr: number; count: number }>();
    bookings.forEach(b => {
      const d = new Date(b.checkIn || b.createdAt);
      const label = !isNaN(d.getTime()) ? d.toLocaleString('en-US', { month: 'short' }) : 'Active';
      const curr = map.get(label) || { totalAdr: 0, count: 0 };
      curr.totalAdr += b.adr || 0;
      curr.count += 1;
      map.set(label, curr);
    });
    return Array.from(map.entries()).map(([label, val]) => ({
      label,
      primary: Math.round(val.totalAdr / (val.count || 1))
    }));
  }, [bookings]);

  // Dynamic room tier revenue contribution from real database
  const roomTierRevenue = useMemo(() => {
    const palette = ['bg-indigo-600', 'bg-emerald-600', 'bg-blue-600', 'bg-sky-600', 'bg-amber-600', 'bg-slate-600'];
    return roomTypes.map((rt, idx) => {
      const matched = bookings.filter(
        b => (b.roomTypeId === rt.id || b.roomTypeName === rt.name) && b.status !== 'Cancelled' && b.paymentStatus === 'Paid'
      );
      const rev = matched.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      return {
        label: rt.name,
        value: rev,
        rate: `₹${rt.basePrice.toLocaleString('en-IN')} Base`,
        color: palette[idx % palette.length]
      };
    });
  }, [roomTypes, bookings]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Revenue Management & ADR Optimization</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor verified collected yield per key, rate parity across room tiers, and ancillary guest folio generation.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold font-mono">
            Collected: ₹{actualCollectedRevenue.toLocaleString('en-IN')}
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-semibold font-mono">
            Pending: ₹{pendingRevenue.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KpiCard
          title="Average ADR"
          value={`₹${avgAdr.toLocaleString('en-IN')}`}
          subtext="rate per occupied room night"
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
        />
        <KpiCard
          title="RevPAR (Yield)"
          value={`₹${revPar.toLocaleString('en-IN')}`}
          subtext="collected revenue per room key"
          icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
        />
        <KpiCard
          title="Realized Collected Revenue"
          value={`₹${actualCollectedRevenue.toLocaleString('en-IN')}`}
          subtext={`Pending: ₹${pendingRevenue.toLocaleString('en-IN')}`}
          icon={<CreditCard className="w-5 h-5 text-indigo-600" />}
        />
        <KpiCard
          title="Average Stay (ALOS)"
          value={`${alos} nights`}
          subtext="length of stay"
          icon={<BarChart3 className="w-5 h-5 text-amber-600" />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="ADR Pace Trend (₹ / Room Night)"
          subtitle="Realized trajectory of Average Daily Rate from booking records"
        >
          {monthlyAdrTrend.length > 0 ? (
            <TrendLineChart
              data={monthlyAdrTrend}
              primaryLabel="Average ADR (₹)"
              valuePrefix="₹"
              height={200}
            />
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center p-4">
              <Calendar className="w-8 h-8 text-slate-300 mb-1" />
              <p className="text-xs font-semibold text-slate-600">No Rate Records in Database</p>
              <p className="text-[11px] text-slate-400">Monthly ADR trend will display here as bookings are placed.</p>
            </div>
          )}
        </ChartCard>

        {/* Room Tier Revenue Contribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Room Tier Revenue Contribution</h3>
            <p className="text-xs text-slate-500 mb-4">Total gross collected revenue distributed by category</p>
            {roomTierRevenue.length > 0 ? (
              <HorizontalBarChart
                items={roomTierRevenue}
                valueSuffix=""
              />
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No room categories configured.
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Verified Paid Total:</span>
            <span className="font-mono font-bold text-emerald-700">₹{actualCollectedRevenue.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
