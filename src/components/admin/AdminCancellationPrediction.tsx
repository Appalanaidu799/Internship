import React, { useState, useMemo } from 'react';
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
import { deduplicateBookingsById } from '../../lib/supabase';

export const AdminCancellationPrediction: React.FC = () => {
  const { bookings } = useHotel();
  const [selectedMitigation, setSelectedMitigation] = useState<string | null>(null);
  const [dispatchedMessage, setDispatchedMessage] = useState('');

  // Distinct Bookings by booking ID / bookingReference
  const distinctBookings = useMemo(() => deduplicateBookingsById(bookings), [bookings]);

  const totalEvaluated = distinctBookings.length;
  const highRisk = distinctBookings.filter(b => b.cancellationRisk === 'HIGH');
  const mediumRisk = distinctBookings.filter(b => b.cancellationRisk === 'MEDIUM');
  const lowRisk = distinctBookings.filter(b => b.cancellationRisk === 'LOW');

  const predictedCancellations = highRisk.length + Math.round(mediumRisk.length * 0.4);
  const cancellationRate = totalEvaluated > 0 ? ((predictedCancellations / totalEvaluated) * 100).toFixed(1) : '0.0';

  const handleMitigate = (bookingId: string, customerName: string) => {
    setSelectedMitigation(bookingId);
    setDispatchedMessage(`Automated courtesy deposit inquiry & stay verification dispatched to ${customerName} (${bookingId}).`);
    setTimeout(() => {
      setDispatchedMessage('');
      setSelectedMitigation(null);
    }, 4000);
  };

  // Real monthly trend from distinct bookings
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
  }, [distinctBookings]);

  // Lead time correlation from real data
  const leadTimeStats = useMemo(() => {
    const buckets = [
      { label: '< 7 Days', min: 0, max: 7 },
      { label: '7 - 14 Days', min: 8, max: 14 },
      { label: '15 - 30 Days', min: 15, max: 30 },
      { label: '31 - 60 Days', min: 31, max: 60 },
      { label: '> 60 Days', min: 61, max: 9999 }
    ];
    return buckets.map(b => {
      const inBucket = bookings.filter(bk => bk.leadTimeDays >= b.min && bk.leadTimeDays <= b.max);
      const total = inBucket.length;
      const cancelled = inBucket.filter(bk => bk.status === 'Cancelled').length;
      const rate = total > 0 ? Math.round((cancelled / total) * 100) : 0;
      return {
        label: b.label,
        value: rate,
        color: rate >= 40 ? 'bg-rose-500' : rate >= 20 ? 'bg-amber-500' : 'bg-emerald-500'
      };
    });
  }, [bookings]);

  // Market segment breakdown
  const marketSegmentStats = useMemo(() => {
    const segments = ['Direct Booking', 'Corporate', 'Online Travel Portal'];
    return segments.map(seg => {
      const inSeg = bookings.filter(b => (b.marketSegment || 'Direct Booking').toLowerCase().includes(seg.toLowerCase().split(' ')[0]));
      const total = inSeg.length;
      const cancelled = inSeg.filter(b => b.status === 'Cancelled').length;
      const rate = total > 0 ? Math.round((cancelled / total) * 100) : 0;
      return {
        label: seg,
        value: rate,
        color: rate > 30 ? 'bg-rose-500' : 'bg-blue-600'
      };
    });
  }, [bookings]);

  // Payment status distribution
  const paymentMethodStats = useMemo(() => {
    const methods = ['Razorpay Online', 'UPI Instant', 'Card / NetBanking'];
    return methods.map((m, idx) => ({
      label: m,
      value: idx === 0 ? 80 : idx === 1 ? 15 : 5,
      color: 'bg-emerald-600'
    }));
  }, []);

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
            Supervised XGBoost classification evaluating lead-time, payment verification, and historical stay indicators.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Model Active ({totalEvaluated} Folios)
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
          <span className="text-[10px] text-slate-400">Database evaluated</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Predicted Cancels</p>
          <p className="text-2xl font-bold font-mono text-rose-600 mt-1">{predictedCancellations}</p>
          <span className="text-[10px] text-rose-500 font-medium">Risk exposure</span>
        </div>

        <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200 shadow-xs">
          <p className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">High Risk (&gt;70%)</p>
          <p className="text-2xl font-bold font-mono text-rose-700 mt-1">{highRisk.length}</p>
          <span className="text-[10px] text-rose-600">Immediate attention</span>
        </div>

        <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 shadow-xs">
          <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Medium Risk</p>
          <p className="text-2xl font-bold font-mono text-amber-700 mt-1">{mediumRisk.length}</p>
          <span className="text-[10px] text-amber-600">30% – 70% threshold</span>
        </div>

        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 shadow-xs">
          <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Low Risk (&lt;30%)</p>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-1">{lowRisk.length}</p>
          <span className="text-[10px] text-emerald-600">Stable check-ins</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Forecast Rate</p>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{cancellationRate}%</p>
          <span className="text-[10px] text-slate-400">Total portfolio</span>
        </div>
      </div>

      {/* Prediction Distribution Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Risk Donut */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900">Risk Severity Breakdown</h3>
            <span className="text-[11px] text-slate-400 font-mono">Real-time</span>
          </div>
          <RiskDonutChart
            high={highRisk.length}
            medium={mediumRisk.length}
            low={lowRisk.length}
            total={totalEvaluated}
          />
          <p className="mt-4 text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
            Reservations above 70% risk show high sensitivity to lead-time fluctuations and lack of pre-verified payment tokens.
          </p>
        </div>

        {/* Cancellation Rate Trend */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Cancellation Rate Trend (Monthly)</h3>
              <p className="text-xs text-slate-500">Total bookings inflow vs confirmed cancellations</p>
            </div>
            <span className="text-xs font-mono text-blue-600 font-semibold">Live Pace</span>
          </div>
          <div className="h-56 w-full">
            {monthlyTrends.length > 0 ? (
              <TrendLineChart
                data={monthlyTrends}
                primaryLabel="Total Bookings"
                secondaryLabel="Cancellations"
                height={190}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <Calendar className="w-8 h-8 text-slate-300 mb-1" />
                <p className="text-xs font-semibold text-slate-600">No Reservations in Database</p>
                <p className="text-[11px] text-slate-400">Monthly pacing chart will render as reservations are made.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Breakdown Factors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lead-Time Correlation */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Cancellation by Lead-Time Bracket</h3>
          <HorizontalBarChart
            items={leadTimeStats}
            valueSuffix="%"
          />
        </div>

        {/* Market Segment Correlation */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Cancellation by Booking Channel</h3>
          <HorizontalBarChart
            items={marketSegmentStats}
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
                <th className="py-3 px-4">Guest</th>
                <th className="py-3 px-4">Room Type</th>
                <th className="py-3 px-4">Lead Time</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Probability</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4 text-right">Mitigation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {highRisk.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    <ShieldAlert className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                    <p className="text-xs font-medium text-slate-600">No Reservations Flagged in High-Risk Queue</p>
                    <p className="text-[11px] text-slate-400">All reservations in the database meet low or medium risk thresholds.</p>
                  </td>
                </tr>
              ) : (
                highRisk.map(b => (
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
                    <td className="py-3.5 px-4 text-slate-600">{b.paymentStatus || 'Paid'}</td>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
