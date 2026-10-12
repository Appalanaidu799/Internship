import React, { useState } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle2, ArrowRight, ShieldCheck, Filter } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { AiInsight } from '../../types/hotel';

export const AdminAiInsights: React.FC = () => {
  const { insights } = useHotel();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [appliedInsightId, setAppliedInsightId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string>('');

  const categories = [
    'ALL',
    'Cancellation Risk',
    'Revenue Opportunity',
    'Occupancy Trend',
    'Room Demand',
    'Customer Behavior'
  ];

  const filteredInsights = insights.filter(ins => {
    if (selectedCategory === 'ALL') return true;
    return ins.category === selectedCategory;
  });

  const handleApplyRecommendation = (ins: AiInsight) => {
    setAppliedInsightId(ins.id);
    setActionFeedback(`Recommendation applied for: "${ins.title}". Dynamic hotel policy updated.`);
    setTimeout(() => {
      setActionFeedback('');
      setAppliedInsightId(null);
    }, 4500);
  };

  const getImpactBadge = (impact: 'HIGH' | 'MEDIUM' | 'INFO') => {
    switch (impact) {
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            High Impact
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Medium Impact
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Informational
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              AI Business Intelligence Engine
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated predictive heuristics analyzing booking velocity, price elasticity, lead times, and room tier demand.
          </p>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Insight Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredInsights.map(ins => (
          <div
            key={ins.id}
            className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-700 font-mono tracking-wide">
                    {ins.category}
                  </span>
                  {getImpactBadge(ins.impact)}
                </div>
                <span className="text-[11px] text-slate-400 font-mono">{ins.date}</span>
              </div>

              <h3 className="text-base font-bold text-slate-900 mt-2 mb-1.5">{ins.title}</h3>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 mb-3">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Observed Telemetry Metric
                </span>
                <span className="font-mono font-bold text-slate-900 text-xs">{ins.metric}</span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                {ins.description}
              </p>

              <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200/80 text-xs text-blue-900">
                <div className="flex items-center gap-1.5 font-bold mb-1 text-blue-950">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Strategic Recommendation</span>
                </div>
                <p className="text-blue-800 leading-relaxed">{ins.recommendation}</p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono">Action Confidence: 94%</span>
              <button
                onClick={() => handleApplyRecommendation(ins)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
              >
                <span>Apply Strategy</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
