import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Percent,
  Calendar,
  Building,
  Users,
  PieChart,
  BarChart3
} from 'lucide-react';
import { KpiCard } from '../common/KpiCard';
import { ChartCard, TrendLineChart, HorizontalBarChart } from '../common/ChartCard';
import { ANALYTICS_DATA } from '../../data/mockData';

export const AdminAnalytics: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Hotel Performance & Yield Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Holistic metrics across revenue per available room (RevPAR), average daily rate (ADR), occupancy velocity, and channel distribution.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Average ADR"
          value="₹2,450"
          change="+6.8%"
          trend="up"
          subtext="vs ₹2,280 prior cycle"
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
        />
        <KpiCard
          title="Occupancy Rate"
          value="78.4%"
          change="+4.2%"
          trend="up"
          subtext="hotel capacity target 80%"
          icon={<Building className="w-5 h-5 text-blue-600" />}
        />
        <KpiCard
          title="RevPAR (Yield)"
          value="₹1,920"
          change="+11.3%"
          trend="up"
          subtext="revenue per available room"
          icon={<TrendingUp className="w-5 h-5 text-indigo-600" />}
        />
        <KpiCard
          title="Cancellation Rate"
          value="19.2%"
          change="-2.3%"
          trend="down"
          subtext="downward risk trajectory"
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
          <TrendLineChart
            data={ANALYTICS_DATA.monthlyTrends.map(m => ({
              label: m.month,
              primary: m.bookings,
              secondary: m.cancellations
            }))}
            primaryLabel="Total Bookings"
            secondaryLabel="Cancellations"
            height={200}
          />
        </ChartCard>

        {/* Occupancy and ADR Trend */}
        <ChartCard
          title="Occupancy Pace (%) & ADR (₹)"
          subtitle="Simultaneous ADR optimization without dampening physical occupancy"
        >
          <TrendLineChart
            data={ANALYTICS_DATA.monthlyTrends.map(m => ({
              label: m.month,
              primary: m.occupancy,
              secondary: m.adr
            }))}
            primaryLabel="Occupancy Rate (%)"
            secondaryLabel="Average ADR (₹)"
            valuePrefix=""
            height={200}
          />
        </ChartCard>
      </div>

      {/* Secondary Distribution Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Room Type Performance */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Room Type Performance</h3>
            <span className="text-[11px] font-mono text-slate-400">Total Volume</span>
          </div>
          <HorizontalBarChart
            items={ANALYTICS_DATA.cancellationByRoomType.map(r => ({
              label: r.roomType,
              value: r.total,
              rate: `${r.rate} cxl`,
              color: 'bg-blue-600'
            }))}
            valueSuffix=" stays"
          />
        </div>

        {/* Market Segment Analysis */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Market Channel Segment</h3>
            <span className="text-[11px] font-mono text-slate-400">Cxl Volatility</span>
          </div>
          <HorizontalBarChart
            items={ANALYTICS_DATA.cancellationByMarketSegment.map(s => ({
              label: s.segment,
              value: s.rate,
              color: s.rate > 40 ? 'bg-rose-500' : s.rate > 20 ? 'bg-amber-500' : 'bg-emerald-500'
            }))}
            valueSuffix="%"
          />
        </div>

        {/* Customer Type Segmentation */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Customer Segmentation</h3>
            <span className="text-[11px] font-mono text-slate-400">Share %</span>
          </div>
          <div className="space-y-3.5">
            {ANALYTICS_DATA.customerSegments.map((seg, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{seg.type}</span>
                  <div className="flex items-center gap-1.5 font-mono text-slate-600">
                    <span className="font-bold text-slate-900">{seg.share}%</span>
                    <span className="text-[10px] text-slate-400">(₹{(seg.avgSpend * 6).toLocaleString('en-IN')} avg)</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${seg.share * 2}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
