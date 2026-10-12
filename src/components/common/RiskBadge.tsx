import React from 'react';
import { RiskLevel } from '../../types/hotel';

interface RiskBadgeProps {
  level: RiskLevel;
  probability?: number;
  size?: 'sm' | 'md';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, probability, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  if (level === 'HIGH') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/80 ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" aria-hidden="true" />
        <span>HIGH RISK</span>
        {probability !== undefined && (
          <span className="font-mono tabular-nums opacity-80">({probability}%)</span>
        )}
      </span>
    );
  }

  if (level === 'MEDIUM') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80 ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true" />
        <span>MEDIUM</span>
        {probability !== undefined && (
          <span className="font-mono tabular-nums opacity-80">({probability}%)</span>
        )}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${sizeClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
      <span>LOW RISK</span>
      {probability !== undefined && (
        <span className="font-mono tabular-nums opacity-80">({probability}%)</span>
      )}
    </span>
  );
};
