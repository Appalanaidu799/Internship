import React, { useState } from 'react';
import { BedDouble, Plus, Edit2, Trash2, Users, DollarSign, Check, X } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { RoomType } from '../../types/hotel';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/StatusBadge';

export const AdminRoomTypes: React.FC = () => {
  const { roomTypes, addRoomType, updateRoomType, deleteRoomType } = useHotel();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<RoomType | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState(2);
  const [basePrice, setBasePrice] = useState(250);
  const [amenitiesInput, setAmenitiesInput] = useState('King Bed, High-Speed Wi-Fi, Ocean View, Mini Bar');
  const [totalInventory, setTotalInventory] = useState(10);
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  const handleOpenAdd = () => {
    setEditingType(null);
    setName('');
    setCode('');
    setDescription('');
    setCapacity(2);
    setBasePrice(250);
    setAmenitiesInput('King Bed, High-Speed Wi-Fi, Ocean View, Mini Bar');
    setTotalInventory(10);
    setStatus('Active');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rt: RoomType) => {
    setEditingType(rt);
    setName(rt.name);
    setCode(rt.code);
    setDescription(rt.description);
    setCapacity(rt.capacity);
    setBasePrice(rt.basePrice);
    setAmenitiesInput(rt.amenities.join(', '));
    setTotalInventory(rt.totalInventory);
    setStatus(rt.status);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const amenities = amenitiesInput.split(',').map(s => s.trim()).filter(Boolean);

    if (editingType) {
      updateRoomType(editingType.id, {
        name,
        code,
        description,
        capacity: Number(capacity),
        basePrice: Number(basePrice),
        amenities,
        totalInventory: Number(totalInventory),
        status
      });
    } else {
      addRoomType({
        name,
        code: code || name.slice(0, 3).toUpperCase(),
        description,
        capacity: Number(capacity),
        basePrice: Number(basePrice),
        amenities,
        status,
        totalInventory: Number(totalInventory),
        sizeSqFt: 500,
        bedType: 'King Bed',
        imageTheme: 'deluxe'
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Room Types & Tier Configuration</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure hotel suite blueprints, occupancy limits, baseline pricing, and curated amenity packages.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Room Type</span>
        </button>
      </div>

      {/* Room Types Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {roomTypes.map(rt => (
          <div
            key={rt.id}
            className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {rt.code}
                    </span>
                    <StatusBadge status={rt.status} size="sm" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-2">{rt.name}</h3>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold font-mono text-slate-900">${rt.basePrice}</div>
                  <span className="text-[10px] text-slate-400">/ night</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                {rt.description}
              </p>

              <div className="flex items-center gap-4 py-2.5 border-y border-slate-100 text-xs text-slate-600 mb-4">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Max {rt.capacity} Guests</span>
                </div>
                <span className="text-slate-300">·</span>
                <div className="flex items-center gap-1.5 font-mono">
                  <BedDouble className="w-3.5 h-3.5 text-slate-400" />
                  <span>{rt.totalInventory} Units</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Amenities
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {rt.amenities.map((amenity, i) => (
                    <span
                      key={i}
                      className="text-[11px] px-2 py-0.5 bg-slate-50 text-slate-600 rounded border border-slate-200/80"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => handleOpenEdit(rt)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg inline-flex items-center gap-1.5 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete room category "${rt.name}"?`)) {
                    deleteRoomType(rt.id);
                  }
                }}
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg inline-flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingType ? `Edit ${editingType.name}` : 'Add New Room Type'}
        subtitle="Manage suite configuration, base pricing, and guest capacity."
        maxWidth="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Save Room Type
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Room Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Deluxe Ocean View"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Code *</label>
              <input
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="e.g. DLX-OCN"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe room features, vistas, and comforts"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Capacity</label>
              <input
                type="number"
                min="1"
                max="8"
                value={capacity}
                onChange={e => setCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Base Price ($/night)</label>
              <input
                type="number"
                min="50"
                value={basePrice}
                onChange={e => setBasePrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Inventory</label>
              <input
                type="number"
                min="1"
                value={totalInventory}
                onChange={e => setTotalInventory(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Amenities (comma separated)
            </label>
            <input
              type="text"
              value={amenitiesInput}
              onChange={e => setAmenitiesInput(e.target.value)}
              placeholder="King Bed, High-Speed Wi-Fi, Ocean View"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as 'Active' | 'Inactive')}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};
