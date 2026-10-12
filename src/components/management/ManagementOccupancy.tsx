import React from 'react';
import { Building, CheckCircle2, AlertTriangle, Wrench, Users, ArrowUpRight } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { KpiCard } from '../common/KpiCard';
import { StatusBadge } from '../common/StatusBadge';

export const ManagementOccupancy: React.FC = () => {
  const { rooms } = useHotel();

  const total = rooms.length;
  const occupied = rooms.filter(r => r.status === 'Occupied').length;
  const available = rooms.filter(r => r.status === 'Available').length;
  const maintenance = rooms.filter(r => r.status === 'Maintenance').length;
  const rate = ((occupied / (total || 1)) * 100).toFixed(1);

  // Group rooms by floor
  const floors = [1, 2, 3, 4, 5, 6];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Real-Time Occupancy Dispatch</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Physical room keycard states, housekeeping turnover, and floor-by-floor allocation.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KpiCard
          title="Occupancy Rate"
          value={`${rate}%`}
          change="+4.2%"
          trend="up"
          subtext="target capacity: 80%"
          icon={<Building className="w-5 h-5 text-blue-600" />}
        />
        <KpiCard
          title="Occupied Rooms"
          value={occupied}
          subtext={`of ${total} total rooms`}
          icon={<Users className="w-5 h-5 text-indigo-600" />}
        />
        <KpiCard
          title="Available Ready"
          value={available}
          subtext="ready for check-in"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
        <KpiCard
          title="Out of Order"
          value={maintenance}
          subtext="preventative maintenance"
          icon={<Wrench className="w-5 h-5 text-amber-600" />}
        />
      </div>

      {/* Visual Floor Grid */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900">Floor-by-Floor Keycard Matrix</h3>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-600" /> Occupied</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500" /> Available</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500" /> Maintenance</span>
          </div>
        </div>

        <div className="space-y-4">
          {floors.map(floor => {
            const floorRooms = rooms.filter(r => r.floor === floor);
            return (
              <div key={floor} className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="w-24 shrink-0 font-bold text-slate-700 text-xs font-mono">
                  Floor {floor}
                </div>
                <div className="flex-1 flex flex-wrap gap-2">
                  {floorRooms.map(rm => (
                    <div
                      key={rm.id}
                      className={`p-2 rounded-lg border text-xs font-mono flex items-center gap-2 min-w-[120px] ${
                        rm.status === 'Occupied'
                          ? 'bg-blue-50 border-blue-200 text-blue-900'
                          : rm.status === 'Available'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-amber-50 border-amber-200 text-amber-900'
                      }`}
                    >
                      <span className="font-bold">{rm.roomNumber}</span>
                      <span className="text-[10px] opacity-75 truncate">{rm.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
