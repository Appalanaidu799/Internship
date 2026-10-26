import React from 'react';
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
  BedDouble
} from 'lucide-react';
import { KpiCard } from '../common/KpiCard';
import { ChartCard, TrendLineChart, RiskDonutChart, HorizontalBarChart } from '../common/ChartCard';
import { RiskBadge } from '../common/RiskBadge';
import { StatusBadge } from '../common/StatusBadge';
import { useHotel } from '../../context/HotelContext';
import { ANALYTICS_DATA } from '../../data/mockData';

interface ManagementDashboardOverviewProps {
  onNavigateTab: (tabId: string) => void;
}

export const ManagementDashboardOverview: React.FC<ManagementDashboardOverviewProps> = ({
  onNavigateTab
}) => {
  const { bookings, rooms, insights } = useHotel();

  // Management calculations
  const totalBookings = bookings.length;
  const cancelledBookings = bookings.filter(b => b.status === 'Cancelled').length;
  const occupiedRooms = rooms.filter(r => r.status === 'Occupied').length;
  const totalRooms = rooms.length;
  const occupancyRate = ((occupiedRooms / (totalRooms || 1)) * 100).toFixed(1);
  const cancellationRate = ((cancelledBookings / (totalBookings || 1)) * 100).toFixed(1);
  const avgAdr = Math.round(bookings.reduce((sum, b) => sum + b.adr, 0) / (totalBookings || 1));

  const highRiskBookings = bookings.filter(b => b.cancellationRisk === 'HIGH');
  const mediumRiskBookings = bookings.filter(b => b.cancellationRisk === 'MEDIUM');
  const lowRiskBookings = bookings.filter(b => b.cancellationRisk === 'LOW');
  const predictedCancellations = highRiskBookings.length + Math.round(mediumRiskBookings.length * 0.4);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Hotel Operations & Revenue Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational cockpit: Daily occupancy pacing, yield per key, and machine-learning risk intelligence.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('ai-insights')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Revenue Suggestions</span>
          </button>
        </div>
      </div>

      {/* Management KPI Cards (Exact requested set):
          - Occupancy Rate
          - Total Bookings
          - Cancellation Rate
          - Cancelled Bookings
          - Average ADR
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Occupancy Rate"
          value={`${occupancyRate}%`}
          change="+4.2%"
          trend="up"
          subtext={`${occupiedRooms} of ${totalRooms} rooms occupied`}
          icon={<Building className="w-5 h-5 text-blue-600" />}
        />
        <KpiCard
          title="Total Bookings"
          value={totalBookings.toLocaleString()}
          change="+12.4%"
          trend="up"
          subtext="total folio volume"
          icon={<CalendarCheck className="w-5 h-5 text-indigo-600" />}
        />
        <KpiCard
          title="Cancellation Rate"
          value={`${cancellationRate}%`}
          change="-2.3%"
          trend="down"
          subtext="vs 21.5% target"
          icon={<Percent className="w-5 h-5 text-amber-600" />}
        />
        <KpiCard
          title="Cancelled Bookings"
          value={cancelledBookings}
          change="-4.2%"
          trend="down"
          subtext="released inventory"
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
        />
        <KpiCard
          title="Average ADR"
          value={`₹${avgAdr.toLocaleString('en-IN')}`}
          change="+6.8%"
          trend="up"
          subtext="average daily rate"
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
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
              <TrendLineChart
                data={ANALYTICS_DATA.monthlyTrends.map(m => ({
                  label: m.month,
                  primary: m.bookings,
                  secondary: m.cancellations
                }))}
                primaryLabel="Bookings"
                secondaryLabel="Cancellations"
                height={160}
              />
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Cancellation by Room Type
            </h4>
            <HorizontalBarChart
              items={ANALYTICS_DATA.cancellationByRoomType.slice(0, 4).map(r => ({
                label: r.roomType,
                value: r.cancelled,
                rate: r.rate,
                color: 'bg-rose-500'
              }))}
              valueSuffix=" cxl"
            />
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
