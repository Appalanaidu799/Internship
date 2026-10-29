import React, { useMemo } from 'react';
import {
  Building,
  CalendarCheck,
  Percent,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  BedDouble,
  CreditCard
} from 'lucide-react';
import { KpiCard } from '../common/KpiCard';
import { ChartCard, TrendLineChart, RiskDonutChart, HorizontalBarChart } from '../common/ChartCard';
import { RiskBadge } from '../common/RiskBadge';
import { StatusBadge } from '../common/StatusBadge';
import { useHotel } from '../../context/HotelContext';
import { deduplicateBookingsById } from '../../lib/supabase';

interface ManagementDashboardOverviewProps {
  onNavigateTab: (tabId: string) => void;
}

export const ManagementDashboardOverview: React.FC<ManagementDashboardOverviewProps> = ({
  onNavigateTab
}) => {
  const { bookings, rooms, roomTypes, insights } = useHotel();

  // Distinct Bookings Calculation (deduplicated strictly by booking ID / bookingReference)
  const distinctBookings = useMemo(() => deduplicateBookingsById(bookings), [bookings]);

  // Management calculations from distinct bookings
  const totalBookings = distinctBookings.length;
  const cancelledBookings = distinctBookings.filter(b => b.status === 'Cancelled').length;
  const occupiedRooms = rooms.filter(r => r.status === 'Occupied').length;
  const totalRooms = rooms.length;
  const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : '0.0';
  const cancellationRate = totalBookings > 0 ? ((cancelledBookings / totalBookings) * 100).toFixed(1) : '0.0';
  const avgAdr = totalBookings > 0 ? Math.round(distinctBookings.reduce((sum, b) => sum + (b.adr || 0), 0) / totalBookings) : 0;

  const actualCollectedRevenue = distinctBookings
    .filter(b => b.paymentStatus === 'Paid' && b.status !== 'Cancelled')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const pendingRevenue = distinctBookings
    .filter(b => b.paymentStatus === 'Pending' && b.status !== 'Cancelled')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const highRiskBookings = distinctBookings.filter(b => b.cancellationRisk === 'HIGH');
  const mediumRiskBookings = distinctBookings.filter(b => b.cancellationRisk === 'MEDIUM');
  const lowRiskBookings = distinctBookings.filter(b => b.cancellationRisk === 'LOW');
  const predictedCancellations = highRiskBookings.length + Math.round(mediumRiskBookings.length * 0.4);

  // Dynamic monthly trend from distinct bookings
  const monthlyTrends = useMemo(() => {
    if (distinctBookings.length === 0) return [];
    const map = new Map<string, { bookings: number; cancellations: number }>();
    distinctBookings.forEach(b => {
      const d = new Date(b.checkIn || b.createdAt);
      const label = !isNaN(d.getTime()) ? d.toLocaleString('en-US', { month: 'short' }) : 'Active';
      const curr = map.get(label) || { bookings: 0, cancellations: 0 };
      curr.bookings += 1;
      if (b.status === 'Cancelled') curr.cancellations += 1;
      map.set(label, curr);
    });
    return Array.from(map.entries()).map(([label, val]) => ({
      label,
      primary: val.bookings,
      secondary: val.cancellations
    }));
  }, [bookings]);

  // Dynamic room type cancellation stats
  const roomTypeCxlStats = useMemo(() => {
    return roomTypes.slice(0, 4).map(rt => {
      const matched = bookings.filter(b => b.roomTypeId === rt.id || b.roomTypeName === rt.name);
      const cancelled = matched.filter(b => b.status === 'Cancelled').length;
      const rate = matched.length > 0 ? `${Math.round((cancelled / matched.length) * 100)}%` : '0%';
      return {
        label: rt.name,
        value: cancelled,
        rate: `${cancelled} cxl (${rate})`,
        color: 'bg-rose-500'
      };
    });
  }, [roomTypes, bookings]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Hotel Operations & Revenue Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational cockpit: Daily occupancy pacing, physical key dispatch, and machine-learning risk monitoring.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('ai-insights')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Operational Suggestions</span>
          </button>
        </div>
      </div>

      {/* Management KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Occupancy Rate"
          value={`${occupancyRate}%`}
          subtext={`${occupiedRooms} of ${totalRooms} rooms occupied`}
          icon={<Building className="w-5 h-5 text-blue-600" />}
        />
        <KpiCard
          title="Total Bookings"
          value={totalBookings.toLocaleString()}
          subtext="total active folios"
          icon={<CalendarCheck className="w-5 h-5 text-indigo-600" />}
        />
        <KpiCard
          title="Collected Revenue"
          value={`₹${actualCollectedRevenue.toLocaleString('en-IN')}`}
          subtext={`Pending: ₹${pendingRevenue.toLocaleString('en-IN')}`}
          icon={<CreditCard className="w-5 h-5 text-emerald-600" />}
        />
        <KpiCard
          title="Cancelled Bookings"
          value={cancelledBookings}
          subtext={`Cancellation rate: ${cancellationRate}%`}
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
        />
        <KpiCard
          title="Average ADR"
          value={`₹${avgAdr.toLocaleString('en-IN')}`}
          subtext="average daily room rate"
          icon={<DollarSign className="w-5 h-5 text-amber-600" />}
        />
      </div>

      {/* Prominent Cancellation Prediction Highlights */}
      <div className="bg-white rounded-2xl border-2 border-rose-200/80 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Predictive Cancellation Monitoring
              </h3>
              <p className="text-xs text-slate-500">
                Identify volatile reservations to protect room revenue and manage overbooking safety.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('cancellation-prediction')}
            className="text-xs font-semibold text-rose-700 hover:text-rose-900 inline-flex items-center gap-1 shrink-0"
          >
            <span>View Full Analytics Breakdown</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Summary Stat Boxes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-slate-100">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">Predicted Cancels</span>
            <p className="text-xl font-bold font-mono text-rose-600 mt-0.5">{predictedCancellations}</p>
          </div>
          <div className="bg-rose-50/70 p-3 rounded-lg border border-rose-200">
            <span className="text-[10px] font-semibold text-rose-800 uppercase">High Risk (&gt;70%)</span>
            <p className="text-xl font-bold font-mono text-rose-700 mt-0.5">{highRiskBookings.length}</p>
          </div>
          <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200">
            <span className="text-[10px] font-semibold text-amber-800 uppercase">Medium Risk (30-70%)</span>
            <p className="text-xl font-bold font-mono text-amber-700 mt-0.5">{mediumRiskBookings.length}</p>
          </div>
          <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200">
            <span className="text-[10px] font-semibold text-emerald-800 uppercase">Low Risk (&lt;30%)</span>
            <p className="text-xl font-bold font-mono text-emerald-700 mt-0.5">{lowRiskBookings.length}</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-5">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Cancellation Rate Trend (Monthly)
            </h4>
            <div className="h-44 w-full">
              {monthlyTrends.length > 0 ? (
                <TrendLineChart
                  data={monthlyTrends}
                  primaryLabel="Bookings"
                  secondaryLabel="Cancellations"
                  height={160}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 rounded-lg">
                  <CalendarCheck className="w-6 h-6 text-slate-300 mb-1" />
                  <p className="text-xs font-medium text-slate-600">No Booking History in Database</p>
                  <p className="text-[11px] text-slate-400">Monthly operational trends will plot here as reservations arrive.</p>
                </div>
              )}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Cancellation by Room Type
            </h4>
            {roomTypeCxlStats.length > 0 ? (
              <HorizontalBarChart
                items={roomTypeCxlStats}
                valueSuffix=" cxl"
              />
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No room types in database.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Business Insights Section for Management */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              AI Operational & Revenue Insights
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('ai-insights')}
            className="text-xs text-blue-600 hover:underline font-semibold"
          >
            Explore all ({insights.length})
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.slice(0, 2).map(ins => (
            <div key={ins.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase text-blue-700">{ins.category}</span>
                <span className="text-[10px] text-slate-400 font-mono">{ins.date}</span>
              </div>
              <h4 className="text-xs font-bold text-slate-900">{ins.title}</h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{ins.recommendation}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
