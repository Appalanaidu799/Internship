import React, { useState } from 'react';
import { Building, Plus, Filter, CheckCircle2, AlertTriangle, Wrench, Search, RefreshCw } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { RoomStatus, Room } from '../../types/hotel';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';

export const AdminRooms: React.FC = () => {
  const { rooms, roomTypes, updateRoomStatus, addRoom } = useHotel();
  const [statusFilter, setStatusFilter] = useState<'ALL' | RoomStatus>('ALL');
  const [floorFilter, setFloorFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Room Form state
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomTypeId, setNewRoomTypeId] = useState(roomTypes[0]?.id || '');
  const [newFloor, setNewFloor] = useState(1);
  const [newPrice, setNewPrice] = useState(1499);

  // Filtered rooms
  const filteredRooms = rooms.filter(room => {
    if (statusFilter !== 'ALL' && room.status !== statusFilter) return false;
    if (floorFilter !== 'ALL' && room.floor !== Number(floorFilter)) return false;
    if (searchQuery && !room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) && !room.roomTypeName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Summary counts
  const availableCount = rooms.filter(r => r.status === 'Available').length;
  const occupiedCount = rooms.filter(r => r.status === 'Occupied').length;
  const maintenanceCount = rooms.filter(r => r.status === 'Maintenance').length;

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const rt = roomTypes.find(t => t.id === newRoomTypeId);
    addRoom({
      roomNumber: newRoomNumber,
      roomTypeId: newRoomTypeId,
      roomTypeName: rt ? rt.name : 'Deluxe Room',
      floor: Number(newFloor),
      price: Number(newPrice),
      status: 'Available',
      lastCleaned: 'Just Added'
    });
    setNewRoomNumber('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Physical Room Inventory & Housekeeping</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor room availability across all hotel floors, assign maintenance holds, and update housekeeping statuses.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Room Unit</span>
        </button>
      </div>

      {/* Quick Status Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Units</p>
            <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{rooms.length}</p>
          </div>
          <Building className="w-5 h-5 text-slate-400" />
        </div>

        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-800 font-medium uppercase tracking-wider">Available Ready</p>
            <p className="text-2xl font-bold font-mono text-emerald-700 mt-1">{availableCount}</p>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        </div>

        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-800 font-medium uppercase tracking-wider">Currently Occupied</p>
            <p className="text-2xl font-bold font-mono text-blue-700 mt-1">{occupiedCount}</p>
          </div>
          <Building className="w-5 h-5 text-blue-600" />
        </div>

        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-800 font-medium uppercase tracking-wider">Maintenance Hold</p>
            <p className="text-2xl font-bold font-mono text-amber-700 mt-1">{maintenanceCount}</p>
          </div>
          <Wrench className="w-5 h-5 text-amber-600" />
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search room number or type..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1">
            <span className="text-[11px] text-slate-500 px-2 font-medium">Status:</span>
            {(['ALL', 'Available', 'Occupied', 'Maintenance'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <select
            value={floorFilter}
            onChange={e => setFloorFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="ALL">All Floors</option>
            <option value="1">Floor 1 (Classic)</option>
            <option value="2">Floor 2 (Deluxe)</option>
            <option value="3">Floor 3 (Executive)</option>
            <option value="4">Floor 4 (Garden)</option>
            <option value="5">Floor 5 (Family)</option>
            <option value="6">Floor 6 (Penthouse)</option>
          </select>
        </div>
      </div>

      {/* Rooms Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Room #</th>
                <th className="py-3 px-4">Room Type</th>
                <th className="py-3 px-4">Floor</th>
                <th className="py-3 px-4">Rate / Night</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4">Current Resident / Log</th>
                <th className="py-3 px-4 text-right">Quick Status Shift</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRooms.map(room => (
                <tr key={room.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm">
                    {room.roomNumber}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">
                    {room.roomTypeName}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">Floor {room.floor}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">₹{room.price.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={room.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {room.currentGuest ? (
                      <span className="font-semibold text-slate-800">{room.currentGuest}</span>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-400">Cleaned: {room.lastCleaned}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => updateRoomStatus(room.id, 'Available')}
                        title="Mark Available"
                        className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                          room.status === 'Available'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
                        }`}
                      >
                        Available
                      </button>
                      <button
                        onClick={() => updateRoomStatus(room.id, 'Occupied')}
                        title="Mark Occupied"
                        className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                          room.status === 'Occupied'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700'
                        }`}
                      >
                        Occupied
                      </button>
                      <button
                        onClick={() => updateRoomStatus(room.id, 'Maintenance')}
                        title="Mark Maintenance"
                        className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                          room.status === 'Maintenance'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-700'
                        }`}
                      >
                        Service
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Room Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Physical Room Unit"
        subtitle="Register a new keycard unit into the property management system."
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddRoom}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Add Room
            </button>
          </>
        }
      >
        <form onSubmit={handleAddRoom} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Room Number *</label>
            <input
              type="text"
              required
              value={newRoomNumber}
              onChange={e => setNewRoomNumber(e.target.value)}
              placeholder="e.g. 206, 305"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Room Type *</label>
            <select
              value={newRoomTypeId}
              onChange={e => {
                setNewRoomTypeId(e.target.value);
                const rt = roomTypes.find(t => t.id === e.target.value);
                if (rt) setNewPrice(rt.basePrice);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {roomTypes.map(rt => (
                <option key={rt.id} value={rt.id}>
                  {rt.name} (₹{rt.basePrice.toLocaleString('en-IN')}/night)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Floor Level</label>
              <input
                type="number"
                min="1"
                max="10"
                value={newFloor}
                onChange={e => setNewFloor(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nightly Rate (₹)</label>
              <input
                type="number"
                min="500"
                value={newPrice}
                onChange={e => setNewPrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
