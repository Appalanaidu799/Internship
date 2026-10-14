import React, { useState } from 'react';
import { Users, Search, Star, Mail, Phone, Calendar, DollarSign, ShieldCheck } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { Customer } from '../../types/hotel';
import { Modal } from '../common/Modal';

export const AdminCustomers: React.FC = () => {
  const { customers, bookings } = useHotel();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filteredCustomers = customers.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.customerCode && c.customerCode.toLowerCase().includes(q)) ||
      c.phone.includes(q)
    );
  });

  const customerBookings = selectedCustomer
    ? bookings.filter(b => b.customerEmail === selectedCustomer.email || (selectedCustomer.id && b.customerId === selectedCustomer.id))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Customer Directory & Guest Profiles</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Profiles, unique Customer IDs, stay frequencies, aggregate folio expenditures, and loyalty recognition.
          </p>
        </div>
        <div className="text-xs text-slate-500">
          Total Registered: <span className="font-bold text-slate-900 font-mono">{customers.length}</span>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search guest by Customer ID (CUS-...), name, email, or telephone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Customer ID</th>
                <th className="py-3 px-4">Guest Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-center">Total Stays</th>
                <th className="py-3 px-4 text-center">Cancellations</th>
                <th className="py-3 px-4 text-right">Lifetime Spend</th>
                <th className="py-3 px-4 text-center">VIP Tier</th>
                <th className="py-3 px-4 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                    <span className="bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[11px]">
                      {c.customerCode || 'CUS-NAIDU001'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {c.fullName.charAt(0)}
                    </div>
                    <span>{c.fullName}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{c.email}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{c.phone || '—'}</td>
                  <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-900">
                    {c.totalBookings}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                    {c.cancelledBookings}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                    ${c.totalSpend.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {c.vipStatus ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> VIP
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Standard</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedCustomer(c)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      View Folio
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guest Details Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          title={selectedCustomer.fullName}
          subtitle={`Member since ${selectedCustomer.memberSince}`}
          maxWidth="md"
          footer={
            <button
              onClick={() => setSelectedCustomer(null)}
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Close
            </button>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400">Total Bookings</span>
                <p className="text-lg font-bold font-mono text-slate-900">{selectedCustomer.totalBookings}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400">Lifetime Spend</span>
                <p className="text-lg font-bold font-mono text-emerald-700">${selectedCustomer.totalSpend.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400">Email</span>
                <p className="font-mono text-slate-800 truncate">{selectedCustomer.email}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400">Phone</span>
                <p className="font-mono text-slate-800">{selectedCustomer.phone}</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Recent On-File Reservations
              </h4>
              <div className="space-y-2">
                {customerBookings.length === 0 ? (
                  <p className="text-slate-400 text-xs">No active bookings recorded this term.</p>
                ) : (
                  customerBookings.map(b => (
                    <div key={b.id} className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{b.roomTypeName}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{b.checkIn} → {b.checkOut} ({b.nights} nights)</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-slate-900">${b.totalAmount}</p>
                        <span className="text-[10px] text-slate-500 uppercase">{b.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
