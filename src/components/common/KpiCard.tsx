import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  subtext?: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  change,
  trend,
  subtext,
  icon,
  highlight = false
}) => {
  return (
    <div
      className={`relative p-5 rounded-xl bg-white border transition-all ${
        highlight
          ? 'border-blue-300 ring-2 ring-blue-100 shadow-sm'
          : 'border-slate-200 shadow-xs hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              {value}
            </span>
          </div>
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-slate-50 text-slate-600 border border-slate-100">
            {icon}
          </div>
        )}
      </div>

      {(change || subtext) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {change && (
            <span
              className={`inline-flex items-center gap-0.5 font-semibold font-mono tabular-nums ${
                trend === 'up'
                  ? 'text-emerald-700'
                  : trend === 'down'
                  ? 'text-rose-700'
                  : 'text-slate-600'
              }`}
            >
              {trend === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
              {trend === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
              {trend === 'neutral' && <Minus className="w-3.5 h-3.5" />}
              {change}
            </span>
          )}
          {subtext && <span className="text-slate-500 truncate">{subtext}</span>}
        </div>
      )}
    </div>
  );
};
