import React, { useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Percent,
  Calendar,
  Building,
  Users,
  CreditCard,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { KpiCard } from '../common/KpiCard';
import { ChartCard, TrendLineChart, HorizontalBarChart } from '../common/ChartCard';
import { useHotel } from '../../context/HotelContext';

export const AdminAnalytics: React.FC = () => {
  const { bookings, rooms, roomTypes, customers } = useHotel();

  const totalBookings = bookings.length;
  const cancelledCount = bookings.filter(b => b.status === 'Cancelled').length;
  const cancellationRate = totalBookings > 0 ? ((cancelledCount / totalBookings) * 100).toFixed(1) : '0.0';
  const avgAdr = totalBookings > 0 ? Math.round(bookings.reduce((sum, b) => sum + (b.adr || 0), 0) / totalBookings) : 0;

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.status === 'Occupied').length;
  const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : '0.0';

  // Actual collected revenue: strictly paid and not cancelled
  const actualCollectedRevenue = bookings
    .filter(b => b.paymentStatus === 'Paid' && b.status !== 'Cancelled')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const pendingRevenue = bookings
    .filter(b => b.paymentStatus === 'Pending' && b.status !== 'Cancelled')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  // RevPAR: actual collected revenue divided by total inventory
  const revPar = totalRooms > 0 ? Math.round(actualCollectedRevenue / totalRooms) : 0;

  // Real dynamic monthly trends
  const monthlyTrends = useMemo(() => {
    if (bookings.length === 0) return [];
    const map = new Map<string, { bookings: number; cancellations: number; totalAdr: number }>();
    bookings.forEach(b => {
      const d = new Date(b.checkIn || b.createdAt);
      const label = !isNaN(d.getTime()) ? d.toLocaleString('en-US', { month: 'short' }) : 'Active';
      const curr = map.get(label) || { bookings: 0, cancellations: 0, totalAdr: 0 };
      curr.bookings += 1;
      curr.totalAdr += b.adr || 0;
      if (b.status === 'Cancelled') curr.cancellations += 1;
      map.set(label, curr);
    });
    return Array.from(map.entries()).map(([label, val]) => ({
      label,
      primary: val.bookings,
      secondary: val.cancellations,
      adr: Math.round(val.totalAdr / (val.bookings || 1))
    }));
  }, [bookings]);

  // Real room type performance from database
  const roomTypeStats = useMemo(() => {
    return roomTypes.map(rt => {
      const matched = bookings.filter(b => b.roomTypeId === rt.id || b.roomTypeName === rt.name);
      const total = matched.length;
      const cancelled = matched.filter(b => b.status === 'Cancelled').length;
      return {
        label: rt.name,
        value: total,
        rate: `${cancelled} cxl`,
        color: 'bg-blue-600'
      };
    });
  }, [roomTypes, bookings]);

  // Real payment status distribution
  const paymentStats = useMemo(() => {
    const paid = bookings.filter(b => b.paymentStatus === 'Paid').length;
    const pending = bookings.filter(b => b.paymentStatus === 'Pending').length;
    const refunded = bookings.filter(b => b.paymentStatus === 'Refunded').length;
    return [
      { label: 'Paid (Settled)', value: paid, color: 'bg-emerald-600' },
      { label: 'Pending Payment', value: pending, color: 'bg-amber-500' },
      { label: 'Refunded / Cancelled', value: refunded, color: 'bg-rose-500' }
    ];
  }, [bookings]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Hotel Performance & Yield Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Holistic metrics across actual collected revenue, RevPAR, average daily rate (ADR), and physical room occupancy.
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Average ADR"
          value={`₹${avgAdr.toLocaleString('en-IN')}`}
          subtext="based on real booking rates"
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
        />
        <KpiCard
          title="Occupancy Rate"
          value={`${occupancyRate}%`}
          subtext={`${occupiedRooms} of ${totalRooms} rooms occupied`}
          icon={<Building className="w-5 h-5 text-blue-600" />}
        />
        <KpiCard
          title="RevPAR (Yield)"
          value={`₹${revPar.toLocaleString('en-IN')}`}
          subtext="collected revenue per room key"
          icon={<TrendingUp className="w-5 h-5 text-indigo-600" />}
        />
        <KpiCard
          title="Cancellation Rate"
          value={`${cancellationRate}%`}
          subtext={`${cancelledCount} of ${totalBookings} cancelled`}
          icon={<Percent className="w-5 h-5 text-amber-600" />}
        />
      </div>

      {/* Primary Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking vs Cancellation Inflow */}
        <ChartCard
          title="Booking Volume vs. Cancellations (Monthly)"
          subtitle="Correlation between reservation intake and cancellation drop-offs"
        >
          {monthlyTrends.length > 0 ? (
            <TrendLineChart
              data={monthlyTrends}
              primaryLabel="Total Bookings"
              secondaryLabel="Cancellations"
              height={200}
            />
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center p-4">
              <Calendar className="w-8 h-8 text-slate-300 mb-1" />
              <p className="text-xs font-semibold text-slate-600">No Historical Records in Database</p>
              <p className="text-[11px] text-slate-400">Monthly booking volume will automatically chart here as guests book.</p>
            </div>
          )}
        </ChartCard>

        {/* Occupancy and ADR Trend */}
        <ChartCard
          title="ADR Pace (₹ per Room Night)"
          subtitle="Realized average daily rates across monthly stay periods"
        >
          {monthlyTrends.length > 0 ? (
            <TrendLineChart
              data={monthlyTrends.map(m => ({
                label: m.label,
                primary: m.adr
              }))}
              primaryLabel="Average ADR (₹)"
              valuePrefix="₹"
              height={200}
            />
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center p-4">
              <DollarSign className="w-8 h-8 text-slate-300 mb-1" />
              <p className="text-xs font-semibold text-slate-600">No Rate Records in Database</p>
              <p className="text-[11px] text-slate-400">ADR trajectory will render automatically once reservations are booked.</p>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Secondary Distribution Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Room Type Performance */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Room Type Booking Volume</h3>
            <span className="text-[11px] font-mono text-slate-400">Database Records</span>
          </div>
          {roomTypeStats.length > 0 ? (
            <HorizontalBarChart
              items={roomTypeStats}
              valueSuffix=" stays"
            />
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              No room types configured in database.
            </div>
          )}
        </div>

        {/* Payment Settlement Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Payment Settlement Distribution</h3>
            <span className="text-[11px] font-mono text-slate-400">Verified Gateway Status</span>
          </div>
          <HorizontalBarChart
            items={paymentStats}
            valueSuffix=" folios"
          />
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Verified Collected:</span>
            <span className="font-bold text-emerald-700 font-mono">₹{actualCollectedRevenue.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
