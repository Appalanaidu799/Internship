import React from 'react';
import { BookingStatus, RoomStatus } from '../../types/hotel';

type GeneralStatus = BookingStatus | RoomStatus | 'Active' | 'Inactive' | 'Suspended';

interface StatusBadgeProps {
  status: GeneralStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs font-medium';

  const getStyle = () => {
    switch (status) {
      case 'Confirmed':
      case 'Available':
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      case 'Checked-In':
      case 'Occupied':
        return 'bg-blue-50 text-blue-700 border-blue-200/80';
      case 'Checked-Out':
      case 'Inactive':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Cancelled':
      case 'Suspended':
        return 'bg-rose-50 text-rose-700 border-rose-200/80';
      case 'Maintenance':
        return 'bg-amber-50 text-amber-700 border-amber-200/80';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border font-medium ${getStyle()} ${sizeClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
};
