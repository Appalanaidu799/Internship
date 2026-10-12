import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Send,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Percent,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { ChartCard, TrendLineChart, RiskDonutChart, HorizontalBarChart } from '../common/ChartCard';
import { RiskBadge } from '../common/RiskBadge';
import { ANALYTICS_DATA } from '../../data/mockData';

export const AdminCancellationPrediction: React.FC = () => {
  const { bookings } = useHotel();
  const [selectedMitigation, setSelectedMitigation] = useState<string | null>(null);
  const [dispatchedMessage, setDispatchedMessage] = useState('');

  const totalEvaluated = bookings.length;
  const highRisk = bookings.filter(b => b.cancellationRisk === 'HIGH');
  const mediumRisk = bookings.filter(b => b.cancellationRisk === 'MEDIUM');
  const lowRisk = bookings.filter(b => b.cancellationRisk === 'LOW');

  const predictedCancellations = highRisk.length + Math.round(mediumRisk.length * 0.4);
  const cancellationRate = ((predictedCancellations / (totalEvaluated || 1)) * 100).toFixed(1);

  const handleMitigate = (bookingId: string, customerName: string) => {
    setSelectedMitigation(bookingId);
    setDispatchedMessage(`Automated courtesy deposit inquiry & perks email queued for ${customerName} (${bookingId}).`);
    setTimeout(() => {
      setDispatchedMessage('');
      setSelectedMitigation(null);
    }, 4000);
  };

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
              Machine Learning Cancellation Intelligence
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Supervised XGBoost classification model evaluating lead-time, channel volatility, historical guest drop rates, and deposit commitments.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Model Accuracy: 93.4%
          </span>
        </div>
      </div>

      {dispatchedMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{dispatchedMessage}</span>
        </div>
      )}

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Bookings</p>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{totalEvaluated}</p>
          <span className="text-[10px] text-slate-400">100% evaluated</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Predicted Cancels</p>
          <p className="text-2xl font-bold font-mono text-rose-600 mt-1">{predictedCancellations}</p>
          <span className="text-[10px] text-rose-500 font-medium">Potential lost revenue</span>
        </div>

        <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200 shadow-xs">
          <p className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">High Risk (&gt;70%)</p>
          <p className="text-2xl font-bold font-mono text-rose-700 mt-1">{highRisk.length}</p>
          <span className="text-[10px] text-rose-600">Immediate follow-up</span>
        </div>

        <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 shadow-xs">
          <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Medium Risk</p>
          <p className="text-2xl font-bold font-mono text-amber-700 mt-1">{mediumRisk.length}</p>
          <span className="text-[10px] text-amber-600">30% – 70% confidence</span>
        </div>

        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 shadow-xs">
          <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Low Risk (&lt;30%)</p>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-1">{lowRisk.length}</p>
          <span className="text-[10px] text-emerald-600">Stable reservations</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Cancellation Rate</p>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{cancellationRate}%</p>
          <span className="text-[10px] text-emerald-600 font-medium">↓ 2.3% improvement</span>
        </div>
      </div>

      {/* Two-Column Deep Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Distribution Chart */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900">Cancellation Risk Distribution</h3>
            <span className="text-[11px] text-slate-400 font-mono">Current Cohort</span>
          </div>
          <RiskDonutChart
            high={highRisk.length}
            medium={mediumRisk.length}
            low={lowRisk.length}
            total={totalEvaluated}
          />
          <p className="mt-4 text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
            Reservations above 70% risk show a 4.1x higher probability of being cancelled within 7 days of scheduled arrival.
          </p>
        </div>

        {/* Cancellation Rate Trend */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Cancellation Rate Trend (Monthly)</h3>
              <p className="text-xs text-slate-500">Total bookings inflow vs confirmed cancellations</p>
            </div>
            <span className="text-xs font-mono text-blue-600 font-semibold">2026 Pacing</span>
          </div>
          <div className="h-56 w-full">
            <TrendLineChart
              data={ANALYTICS_DATA.monthlyTrends.map(m => ({
                label: m.month,
                primary: m.bookings,
                secondary: m.cancellations
              }))}
              primaryLabel="Total Bookings"
              secondaryLabel="Cancellations"
              height={190}
            />
          </div>
        </div>
      </div>

      {/* Breakdown Factors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lead-Time Correlation */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Cancellation by Lead-Time</h3>
          <HorizontalBarChart
            items={ANALYTICS_DATA.cancellationByLeadTime.map(l => ({
              label: l.leadTime,
              value: l.rate,
              color: l.risk === 'HIGH' ? 'bg-rose-500' : l.risk === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
            }))}
            valueSuffix="%"
          />
        </div>

        {/* Market Segment Correlation */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Cancellation by Market Segment</h3>
          <HorizontalBarChart
            items={ANALYTICS_DATA.cancellationByMarketSegment.map(s => ({
              label: s.segment,
              value: s.rate,
              color: s.rate > 35 ? 'bg-rose-500' : 'bg-blue-600'
            }))}
            valueSuffix="%"
          />
        </div>

        {/* Deposit Type Correlation */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Cancellation by Deposit Type</h3>
          <HorizontalBarChart
            items={ANALYTICS_DATA.cancellationByDepositType.map(d => ({
              label: d.depositType,
              value: d.rate,
              color: d.rate > 30 ? 'bg-rose-500' : 'bg-emerald-500'
            }))}
            valueSuffix="%"
          />
        </div>
      </div>

      {/* Recent High-Risk Bookings Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Active High-Risk Bookings Queue
            </h3>
            <p className="text-xs text-slate-500">
              Bookings requiring prompt guest engagement or deposit verification
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded border border-rose-200">
            {highRisk.length} Immediate Attention
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Booking ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Room Type</th>
                <th className="py-3 px-4">Lead Time</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Deposit Type</th>
                <th className="py-3 px-4 text-right">Probability</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4 text-right">Mitigation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {highRisk.map(b => (
                <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                    {b.id}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">{b.customerName}</div>
                    <div className="text-[11px] text-slate-500 font-mono truncate">{b.customerEmail}</div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">{b.roomTypeName}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{b.leadTimeDays} days</td>
                  <td className="py-3.5 px-4 text-slate-600">{b.marketSegment}</td>
                  <td className="py-3.5 px-4 text-slate-600">{b.depositType}</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600 text-sm">
                    {b.cancellationProbability}%
                  </td>
                  <td className="py-3.5 px-4">
                    <RiskBadge level={b.cancellationRisk} probability={b.cancellationProbability} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleMitigate(b.id, b.customerName)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition-colors"
                    >
                      <Send className="w-3 h-3" />
                      <span>Request Deposit</span>
                    </button>
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
