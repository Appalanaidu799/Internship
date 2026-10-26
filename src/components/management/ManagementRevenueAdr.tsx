import React from 'react';
import { DollarSign, TrendingUp, Percent, BarChart3, CreditCard, Sparkles } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { KpiCard } from '../common/KpiCard';
import { ChartCard, TrendLineChart, HorizontalBarChart } from '../common/ChartCard';
import { ANALYTICS_DATA } from '../../data/mockData';

export const ManagementRevenueAdr: React.FC = () => {
  const { bookings } = useHotel();

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.status !== 'Cancelled' ? b.totalAmount : 0), 0);
  const avgAdr = Math.round(bookings.reduce((sum, b) => sum + b.adr, 0) / (bookings.length || 1));
  const revPar = Math.round(avgAdr * 0.784); // 78.4% occupancy

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Revenue Management & ADR Optimization</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor yield per key, rate parity across booking channels, and ancillary guest folio generation.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KpiCard
          title="Average ADR"
          value={`₹${avgAdr.toLocaleString('en-IN')}`}
          change="+6.8%"
          trend="up"
          subtext="rate per occupied room"
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
        />
        <KpiCard
          title="RevPAR (Yield)"
          value={`₹${revPar.toLocaleString('en-IN')}`}
          change="+11.3%"
          trend="up"
          subtext="revenue per available room"
          icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
        />
        <KpiCard
          title="Gross Realized Revenue"
          value={`₹${totalRevenue.toLocaleString('en-IN')}`}
          change="+14.2%"
          trend="up"
          subtext="folio payments secured"
          icon={<CreditCard className="w-5 h-5 text-indigo-600" />}
        />
        <KpiCard
          title="Average Stay (ALOS)"
          value="3.6 nights"
          change="+0.4"
          trend="up"
          subtext="length of stay"
          icon={<BarChart3 className="w-5 h-5 text-amber-600" />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="ADR Pace Trend (₹ / Room Night)"
          subtitle="Historic trajectory of Average Daily Rate"
        >
          <TrendLineChart
            data={ANALYTICS_DATA.monthlyTrends.map(m => ({
              label: m.month,
              primary: m.adr
            }))}
            primaryLabel="Average ADR (₹)"
            valuePrefix="₹"
            height={200}
          />
        </ChartCard>

        {/* Room Tier Revenue Contribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Room Tier Revenue Contribution</h3>
            <p className="text-xs text-slate-500 mb-4">Total gross revenue distributed by category</p>
            <HorizontalBarChart
              items={[
                { label: 'Luxury Presidential Penthouse', value: 342000, rate: '₹8,999 ADR', color: 'bg-indigo-600' },
                { label: 'Premier Garden Villa', value: 284000, rate: '₹5,499 ADR', color: 'bg-emerald-600' },
                { label: 'Executive Business Suite', value: 389000, rate: '₹3,999 ADR', color: 'bg-blue-600' },
                { label: 'Deluxe Ocean View', value: 521000, rate: '₹2,799 ADR', color: 'bg-sky-600' },
                { label: 'Double Sharing Room', value: 248000, rate: '₹1,499 ADR', color: 'bg-slate-600' }
              ]}
              valueSuffix=""
            />
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Peak RevPAR category: Deluxe Ocean</span>
            <span className="font-mono font-bold text-slate-900">₹17,84,000 Total YTD</span>
          </div>
        </div>
      </div>
    </div>
  );
};
