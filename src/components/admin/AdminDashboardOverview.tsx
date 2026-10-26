import React, { useState } from 'react';
import {
  CalendarCheck,
  Users,
  AlertTriangle,
  Percent,
  DollarSign,
  ArrowRight,
  Sparkles,
  TrendingUp,
  ShieldAlert,
  ChevronRight,
  Filter
} from 'lucide-react';
import { KpiCard } from '../common/KpiCard';
import { ChartCard, TrendLineChart, RiskDonutChart, HorizontalBarChart } from '../common/ChartCard';
import { RiskBadge } from '../common/RiskBadge';
import { StatusBadge } from '../common/StatusBadge';
import { useHotel } from '../../context/HotelContext';
import { ANALYTICS_DATA } from '../../data/mockData';

interface AdminDashboardOverviewProps {
  onNavigateTab: (tabId: string) => void;
  onSelectBooking?: (bookingId: string) => void;
}

export const AdminDashboardOverview: React.FC<AdminDashboardOverviewProps> = ({
  onNavigateTab,
  onSelectBooking
}) => {
  const { bookings, customers, rooms, insights } = useHotel();
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM'>('ALL');

  // KPI Calculations from active data
  const totalBookingsCount = bookings.length;
  const cancelledCount = bookings.filter(b => b.status === 'Cancelled').length;
  const cancellationRate = ((cancelledCount / (totalBookingsCount || 1)) * 100).toFixed(1);
  const avgAdr = Math.round(bookings.reduce((sum, b) => sum + b.adr, 0) / (totalBookingsCount || 1));

  // High risk bookings specifically for the prediction section
  const highRiskBookings = bookings.filter(b => b.cancellationRisk === 'HIGH');
  const mediumRiskBookings = bookings.filter(b => b.cancellationRisk === 'MEDIUM');
  const lowRiskBookings = bookings.filter(b => b.cancellationRisk === 'LOW');

  const filteredRiskList = bookings.filter(b => {
    if (selectedRiskFilter === 'HIGH') return b.cancellationRisk === 'HIGH';
    if (selectedRiskFilter === 'MEDIUM') return b.cancellationRisk === 'MEDIUM';
    return b.cancellationRisk === 'HIGH' || b.cancellationRisk === 'MEDIUM';
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Welcome & Summary Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Administrator Control Center
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time hotel occupancy, machine-learning cancellation forecasts, and operational health.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('ai-insights')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{insights.length} AI Business Insights</span>
          </button>
          <button
            onClick={() => onNavigateTab('cancellation-prediction')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold transition-colors shadow-xs"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Prediction Hub</span>
          </button>
        </div>
      </div>

      {/* 2. Admin KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Total Bookings"
          value={totalBookingsCount.toLocaleString()}
          change="+12.4%"
          trend="up"
          subtext="vs previous cycle"
          icon={<CalendarCheck className="w-5 h-5 text-blue-600" />}
        />
        <KpiCard
          title="Total Customers"
          value={customers.length.toLocaleString()}
          change="+8.1%"
          trend="up"
          subtext="registered profiles"
          icon={<Users className="w-5 h-5 text-indigo-600" />}
        />
        <KpiCard
          title="Cancelled Bookings"
          value={cancelledCount}
          change="-4.2%"
          trend="down"
          subtext="flagged & refunded"
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
        />
        <KpiCard
          title="Cancellation Rate"
          value={`${cancellationRate}%`}
          change="-2.3%"
          trend="down"
          subtext="model baseline: 21.5%"
          icon={<Percent className="w-5 h-5 text-amber-600" />}
        />
        <KpiCard
          title="Average ADR"
          value={`₹${avgAdr.toLocaleString('en-IN')}`}
          change="+6.8%"
          trend="up"
          subtext="daily room rate"
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
        />
      </div>

      {/* 3. PROMINENT CANCELLATION PREDICTION SECTION */}
      <div className="bg-white rounded-2xl border-2 border-rose-200/90 shadow-sm p-6 overflow-hidden relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-rose-100 text-rose-700">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                AI Cancellation Prediction & Risk Intelligence
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Machine learning probability scores identify reservations with high cancellation likelihood before check-in, enabling targeted outreach and inventory protection.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('cancellation-prediction')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 rounded-lg border border-rose-200 transition-colors shrink-0"
          >
            <span>Open Deep Risk Analytics</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Prediction Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 py-4 border-b border-slate-100 bg-slate-50/50 -mx-6 px-6">
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Evaluated</span>
            <p className="text-xl font-bold font-mono text-slate-900">{totalBookingsCount}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Predicted Cancels</span>
            <p className="text-xl font-bold font-mono text-rose-600">{highRiskBookings.length + Math.round(mediumRiskBookings.length * 0.4)}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-rose-700 uppercase tracking-wider">High Risk</span>
            <p className="text-xl font-bold font-mono text-rose-600">{highRiskBookings.length}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-amber-700 uppercase tracking-wider">Medium Risk</span>
            <p className="text-xl font-bold font-mono text-amber-600">{mediumRiskBookings.length}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider">Low Risk</span>
            <p className="text-xl font-bold font-mono text-emerald-600">{lowRiskBookings.length}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Risk Ratio</span>
            <p className="text-xl font-bold font-mono text-slate-800">
              {((highRiskBookings.length / (totalBookingsCount || 1)) * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Prediction Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5">
          {/* Risk Distribution Chart */}
          <div className="lg:col-span-5 bg-slate-50/80 rounded-xl p-4 border border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Cancellation Risk Distribution
            </h4>
            <RiskDonutChart
              high={highRiskBookings.length}
              medium={mediumRiskBookings.length}
              low={lowRiskBookings.length}
              total={totalBookingsCount}
            />
          </div>

          {/* Cancellation Rate Trend Chart */}
          <div className="lg:col-span-7 bg-slate-50/80 rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Cancellation Rate Trend vs Booking Inflow
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">Monthly Rate %</span>
            </div>
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
        </div>

        {/* Recent High-Risk Bookings Table */}
        <div className="mt-6 pt-5 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Flagged High-Risk & Sensitive Reservations
              </h4>
              <p className="text-xs text-slate-500">
                Sorted by highest machine learning cancellation probability.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <button
                onClick={() => setSelectedRiskFilter('ALL')}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  selectedRiskFilter === 'ALL'
                    ? 'bg-slate-900 text-white font-medium'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Flagged
              </button>
              <button
                onClick={() => setSelectedRiskFilter('HIGH')}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  selectedRiskFilter === 'HIGH'
                    ? 'bg-rose-600 text-white font-medium'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                High Risk Only
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Booking ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Room Type</th>
                  <th className="py-3 px-4">Check-In</th>
                  <th className="py-3 px-4">Lead Time</th>
                  <th className="py-3 px-4 text-right">Probability</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRiskList.slice(0, 5).map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-blue-700">
                      {b.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{b.customerName}</div>
                      <div className="text-[11px] text-slate-500 font-mono truncate">{b.customerEmail}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{b.roomTypeName}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{b.checkIn}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{b.leadTimeDays} days</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {b.cancellationProbability}%
                    </td>
                    <td className="py-3 px-4">
                      <RiskBadge level={b.cancellationRisk} probability={b.cancellationProbability} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          if (onSelectBooking) onSelectBooking(b.id);
                          onNavigateTab('bookings');
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. OTHER ADMIN ANALYTICS & INSIGHTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Room Type Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Room Type Distribution</h3>
            <button
              onClick={() => onNavigateTab('room-types')}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Manage Types
            </button>
          </div>
          <HorizontalBarChart
            items={ANALYTICS_DATA.cancellationByRoomType.map(r => ({
              label: r.roomType,
              value: r.total,
              rate: `${r.rate} cxl`,
              color: 'bg-indigo-600'
            }))}
            valueSuffix=" rooms"
          />
        </div>

        {/* Lead Time vs Cancellation Correlation */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Cancellation by Lead Time</h3>
            <span className="text-[11px] text-slate-400 font-mono">Historical ML</span>
          </div>
          <div className="space-y-3.5">
            {ANALYTICS_DATA.cancellationByLeadTime.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{item.leadTime}</span>
                  <span className="font-mono font-bold tabular-nums text-slate-900">
                    {item.rate}%
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      item.risk === 'HIGH'
                        ? 'bg-rose-500'
                        : item.risk === 'MEDIUM'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${item.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-slate-500 leading-relaxed">
            Lead times &gt;60 days represent the highest cancellation vulnerability due to flexible OTA cancellation policies.
          </p>
        </div>

        {/* AI Business Insights Highlights */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">AI Business Insights</h3>
              </div>
              <button
                onClick={() => onNavigateTab('ai-insights')}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                View all ({insights.length})
              </button>
            </div>
            <div className="space-y-3">
              {insights.slice(0, 2).map(ins => (
                <div
                  key={ins.id}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                      {ins.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{ins.date}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1">{ins.title}</h4>
                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                    {ins.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('ai-insights')}
            className="mt-4 w-full py-2 px-3 text-xs font-semibold text-center text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Explore All Intelligence Recommendations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 5. RECENT GENERAL BOOKINGS TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Master Bookings</h3>
            <p className="text-xs text-slate-500">Live feed of all customer reservations</p>
          </div>
          <button
            onClick={() => onNavigateTab('bookings')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
          >
            <span>View Full Booking Manager</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Booking ID</th>
                <th className="py-2.5 px-3">Guest</th>
                <th className="py-2.5 px-3">Room Type</th>
                <th className="py-2.5 px-3">Check-In</th>
                <th className="py-2.5 px-3">Nights</th>
                <th className="py-2.5 px-3">ADR</th>
                <th className="py-2.5 px-3">Total</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.slice(0, 6).map(b => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-900">{b.id}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">{b.customerName}</td>
                  <td className="py-2.5 px-3 text-slate-600">{b.roomTypeName}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{b.checkIn}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{b.nights}</td>
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-900">₹{b.adr.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">₹{b.totalAmount.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-3">
                    <StatusBadge status={b.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
