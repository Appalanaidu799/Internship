import React from 'react';
import {
  ShieldAlert,
  Percent,
  TrendingDown,
  Sparkles,
  AlertTriangle,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { ChartCard, TrendLineChart, HorizontalBarChart } from '../common/ChartCard';
import { ANALYTICS_DATA } from '../../data/mockData';

export const ManagementCancellationPrediction: React.FC = () => {
  const { bookings, insights } = useHotel();

  const totalBookings = bookings.length;
  const highRisk = bookings.filter(b => b.cancellationRisk === 'HIGH');
  const mediumRisk = bookings.filter(b => b.cancellationRisk === 'MEDIUM');
  const lowRisk = bookings.filter(b => b.cancellationRisk === 'LOW');
  const predictedCancellations = highRisk.length + Math.round(mediumRisk.length * 0.4);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-rose-100 text-rose-700">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Operational Cancellation Forecasting
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-segment cancellation analysis to adjust overbooking ratios and safeguard revenue integrity.
          </p>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Predicted Cancellations</p>
          <p className="text-2xl font-bold font-mono text-rose-600 mt-1">{predictedCancellations}</p>
          <span className="text-[11px] text-slate-400">Total estimated drop-off</span>
        </div>

        <div className="bg-rose-50/70 p-4.5 rounded-xl border border-rose-200 shadow-xs">
          <p className="text-xs font-semibold text-rose-800 uppercase tracking-wider">High Risk (&gt;70%)</p>
          <p className="text-2xl font-bold font-mono text-rose-700 mt-1">{highRisk.length}</p>
          <span className="text-[11px] text-rose-600 font-medium">Volatile holds</span>
        </div>

        <div className="bg-amber-50/70 p-4.5 rounded-xl border border-amber-200 shadow-xs">
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Medium Risk</p>
          <p className="text-2xl font-bold font-mono text-amber-700 mt-1">{mediumRisk.length}</p>
          <span className="text-[11px] text-amber-600 font-medium">30% – 70% probability</span>
        </div>

        <div className="bg-emerald-50/70 p-4.5 rounded-xl border border-emerald-200 shadow-xs">
          <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Low Risk (&lt;30%)</p>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-1">{lowRisk.length}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Reliable check-ins</span>
        </div>
      </div>

      {/* Monthly Cancellation Trend Chart */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Cancellation Trend (Monthly Pacing)</h3>
            <p className="text-xs text-slate-500">Longitudinal monitoring of cancellations against gross bookings</p>
          </div>
          <span className="text-xs font-mono text-slate-500">2026 Historical Curve</span>
        </div>
        <div className="h-48 w-full">
          <TrendLineChart
            data={ANALYTICS_DATA.monthlyTrends.map(m => ({
              label: m.month,
              primary: m.bookings,
              secondary: m.cancellations
            }))}
            primaryLabel="Gross Bookings"
            secondaryLabel="Cancellations"
            height={160}
          />
        </div>
      </div>

      {/* 4 Crucial Management Charts:
          1. Cancellation by Room Type
          2. Cancellation by Market Segment
          3. Cancellation by Deposit Type
          4. Cancellation by Lead-Time Range
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Cancellation by Room Type */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Cancellation by Room Type</h3>
          <p className="text-xs text-slate-500 mb-3">Cancellation ratios across room tiers</p>
          <HorizontalBarChart
            items={ANALYTICS_DATA.cancellationByRoomType.map(r => ({
              label: r.roomType,
              value: r.cancelled,
              rate: r.rate,
              color: 'bg-rose-500'
            }))}
            valueSuffix=" cxl"
          />
        </div>

        {/* 2. Cancellation by Market Segment */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Cancellation by Market Segment</h3>
          <p className="text-xs text-slate-500 mb-3">Online travel agents vs corporate and direct channels</p>
          <HorizontalBarChart
            items={ANALYTICS_DATA.cancellationByMarketSegment.map(s => ({
              label: s.segment,
              value: s.rate,
              color: s.rate > 40 ? 'bg-rose-500' : 'bg-blue-600'
            }))}
            valueSuffix="%"
          />
        </div>

        {/* 3. Cancellation by Deposit Type */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Cancellation by Deposit Type</h3>
          <p className="text-xs text-slate-500 mb-3">Financial commitment impact on check-in arrival rate</p>
          <HorizontalBarChart
            items={ANALYTICS_DATA.cancellationByDepositType.map(d => ({
              label: d.depositType,
              value: d.rate,
              color: d.rate > 30 ? 'bg-rose-500' : 'bg-emerald-500'
            }))}
            valueSuffix="%"
          />
        </div>

        {/* 4. Cancellation by Lead-Time Range */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Cancellation by Lead-Time Range</h3>
          <p className="text-xs text-slate-500 mb-3">Advance booking window correlation with cancellation volatility</p>
          <HorizontalBarChart
            items={ANALYTICS_DATA.cancellationByLeadTime.map(l => ({
              label: l.leadTime,
              value: l.rate,
              color: l.risk === 'HIGH' ? 'bg-rose-500' : l.risk === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
            }))}
            valueSuffix="%"
          />
        </div>
      </div>

      {/* AI Business Insights Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">
            AI Operations & Risk Recommendations
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.filter(i => i.category === 'Cancellation Risk' || i.category === 'Revenue Opportunity').map(ins => (
            <div key={ins.id} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <span className="font-bold text-blue-700 uppercase tracking-wider text-[10px] block">
                {ins.category} · {ins.impact} IMPACT
              </span>
              <p className="font-bold text-slate-900 mt-1">{ins.title}</p>
              <p className="text-slate-600 mt-1">{ins.recommendation}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
