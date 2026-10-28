import React, { useState } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  timeframeOptions?: string[];
  actionSlot?: React.ReactNode;
  children: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  timeframeOptions = ['Last 30 Days', 'Last 90 Days', 'Year to Date'],
  actionSlot,
  children
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframeOptions[0]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {actionSlot}
          {timeframeOptions.length > 0 && (
            <select
              value={selectedTimeframe}
              onChange={e => setSelectedTimeframe(e.target.value)}
              className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            >
              {timeframeOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
      <div className="w-full flex-1 min-h-[220px] flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

// Reusable SVG Line/Area Trend Chart
export const TrendLineChart: React.FC<{
  data: { label: string; primary: number; secondary?: number }[];
  primaryLabel: string;
  secondaryLabel?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  height?: number;
}> = ({ data, primaryLabel, secondaryLabel, valuePrefix = '', valueSuffix = '', height = 200 }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const width = 600;
  const paddingX = 40;
  const paddingY = 30;

  const maxVal = Math.max(
    ...data.flatMap(d => [Number(d.primary) || 0, Number(d.secondary) || 0]),
    10
  ) * 1.15;

  const pointsPrimary = data.map((d, i) => {
    const rawX = data.length > 1
      ? paddingX + (i / (data.length - 1)) * (width - paddingX * 2)
      : width / 2;
    const rawY = height - paddingY - ((Number(d.primary) || 0) / maxVal) * (height - paddingY * 2);
    const x = Number.isFinite(rawX) ? Math.round(rawX * 10) / 10 : width / 2;
    const y = Number.isFinite(rawY) ? Math.round(rawY * 10) / 10 : height / 2;
    return { x, y, ...d };
  });

  const pathPrimary = pointsPrimary.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaPrimary = pointsPrimary.length > 1
    ? `${pathPrimary} L ${pointsPrimary[pointsPrimary.length - 1].x} ${height - paddingY} L ${pointsPrimary[0].x} ${height - paddingY} Z`
    : `M ${pointsPrimary[0]?.x - 20} ${pointsPrimary[0]?.y} L ${pointsPrimary[0]?.x + 20} ${pointsPrimary[0]?.y} L ${pointsPrimary[0]?.x + 20} ${height - paddingY} L ${pointsPrimary[0]?.x - 20} ${height - paddingY} Z`;

  // Secondary path if exists
  let pathSecondary = '';
  if (secondaryLabel) {
    const pointsSec = data.map((d, i) => {
      const rawX = data.length > 1
        ? paddingX + (i / (data.length - 1)) * (width - paddingX * 2)
        : width / 2;
      const val = Number(d.secondary) || 0;
      const rawY = height - paddingY - (val / maxVal) * (height - paddingY * 2);
      const x = Number.isFinite(rawX) ? Math.round(rawX * 10) / 10 : width / 2;
      const y = Number.isFinite(rawY) ? Math.round(rawY * 10) / 10 : height / 2;
      return { x, y, val };
    });
    pathSecondary = pointsSec.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');
  }

  return (
    <div className="w-full h-full flex flex-col justify-between">
      <div className="flex items-center gap-4 text-xs text-slate-600 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-blue-600 rounded" />
          <span className="font-medium text-slate-700">{primaryLabel}</span>
        </div>
        {secondaryLabel && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-rose-500 rounded border-t border-dashed" />
            <span className="font-medium text-slate-700">{secondaryLabel}</span>
          </div>
        )}
      </div>

      <div className="relative w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id="primaryAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = height - paddingY - pct * (height - paddingY * 2);
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-mono tabular-nums"
                >
                  {valuePrefix}
                  {Math.round(pct * maxVal)}
                  {valueSuffix}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaPrimary} fill="url(#primaryAreaGrad)" />

          {/* Primary Line */}
          <path d={pathPrimary} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Secondary Line */}
          {pathSecondary && (
            <path
              d={pathSecondary}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="2"
              strokeDasharray="4 4"
              strokeLinecap="round"
            />
          )}

          {/* Interactive circles and x-axis labels */}
          {pointsPrimary.map((p, i) => (
            <g key={i} onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIdx === i ? 5 : 3.5}
                className="fill-white stroke-blue-600 cursor-pointer transition-all"
                strokeWidth={hoveredIdx === i ? '2.5' : '2'}
              />
              <text
                x={p.x}
                y={height - 8}
                textAnchor="middle"
                className={`text-[11px] ${hoveredIdx === i ? 'fill-slate-900 font-semibold' : 'fill-slate-500'}`}
              >
                {p.label}
              </text>
            </g>
          ))}
        </svg>

        {hoveredIdx !== null && (
          <div
            className="absolute -top-1 bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded shadow-lg pointer-events-none transform -translate-x-1/2 z-10 font-mono tabular-nums"
            style={{
              left: `${Number.isFinite(pointsPrimary[hoveredIdx]?.x) ? (pointsPrimary[hoveredIdx].x / width) * 100 : 50}%`
            }}
          >
            <div className="font-sans font-semibold text-slate-200 text-[10px] mb-0.5">
              {data[hoveredIdx].label}
            </div>
            <div>
              {primaryLabel}: {valuePrefix}{data[hoveredIdx].primary}{valueSuffix}
            </div>
            {secondaryLabel && (
              <div className="text-rose-300">
                {secondaryLabel}: {valuePrefix}{data[hoveredIdx].secondary}{valueSuffix}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Reusable Horizontal Distribution Bar Chart
export const HorizontalBarChart: React.FC<{
  items: { label: string; value: number; total?: number; rate?: string; color?: string }[];
  valueSuffix?: string;
}> = ({ items, valueSuffix = '' }) => {
  const maxVal = Math.max(...items.map(i => i.value), 1);

  return (
    <div className="w-full space-y-3.5">
      {items.map((item, idx) => {
        const pct = Math.round((item.value / maxVal) * 100);
        return (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">{item.label}</span>
              <div className="flex items-center gap-2 font-mono tabular-nums text-slate-600">
                <span>{item.value}{valueSuffix}</span>
                {item.rate && (
                  <span className="text-[11px] font-semibold text-slate-500">
                    ({item.rate})
                  </span>
                )}
              </div>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  item.color || 'bg-blue-600'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Reusable Circular / Donut Risk Distribution
export const RiskDonutChart: React.FC<{
  high: number;
  medium: number;
  low: number;
  total: number;
}> = ({ high, medium, low, total }) => {
  const highPct = total > 0 ? Math.round((high / total) * 100) : 0;
  const medPct = total > 0 ? Math.round((medium / total) * 100) : 0;
  const lowPct = total > 0 ? Math.max(0, 100 - highPct - medPct) : 0;

  return (
    <div className="w-full flex flex-col sm:flex-row items-center justify-around gap-6">
      {/* Visual Progress Arc stack */}
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
          
          {/* Low Risk arc */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="#10b981"
            strokeWidth="12"
            strokeDasharray={`${lowPct * 2.51} 251.2`}
            strokeDashoffset="0"
          />

          {/* Medium Risk arc */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="#f59e0b"
            strokeWidth="12"
            strokeDasharray={`${medPct * 2.51} 251.2`}
            strokeDashoffset={`${-lowPct * 2.51}`}
          />

          {/* High Risk arc */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="#f43f5e"
            strokeWidth="12"
            strokeDasharray={`${highPct * 2.51} 251.2`}
            strokeDashoffset={`${-(lowPct + medPct) * 2.51}`}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Total</span>
          <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">{total}</span>
        </div>
      </div>

      {/* Legend & Count list */}
      <div className="space-y-2.5 w-full sm:w-auto">
        <div className="flex items-center justify-between gap-6 p-2 rounded-lg bg-rose-50/50 border border-rose-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="font-semibold text-rose-900">High Risk (&gt;70%)</span>
          </div>
          <div className="flex items-center gap-2 font-mono tabular-nums">
            <span className="font-bold text-rose-700">{high}</span>
            <span className="text-slate-400">· {highPct}%</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-6 p-2 rounded-lg bg-amber-50/50 border border-amber-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="font-semibold text-amber-900">Medium Risk (30–70%)</span>
          </div>
          <div className="flex items-center gap-2 font-mono tabular-nums">
            <span className="font-bold text-amber-700">{medium}</span>
            <span className="text-slate-400">· {medPct}%</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-6 p-2 rounded-lg bg-emerald-50/50 border border-emerald-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="font-semibold text-emerald-900">Low Risk (&lt;30%)</span>
          </div>
          <div className="flex items-center gap-2 font-mono tabular-nums">
            <span className="font-bold text-emerald-700">{low}</span>
            <span className="text-slate-400">· {lowPct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
