import React, { useState } from 'react';
import { Search, Users, Star, Mail, Phone } from 'lucide-react';
import { useHotel } from '../../context/HotelContext';

export const ManagementCustomers: React.FC = () => {
  const { customers } = useHotel();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = customers.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.fullName.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Guest Stay Records & History</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational customer log for front desk reception, VIP preferences, and room allocations.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs max-w-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search guest by name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Guest</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-center">Completed Stays</th>
                <th className="py-3 px-4 text-right">Lifetime Value</th>
                <th className="py-3 px-4 text-center">VIP Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                      {c.fullName.charAt(0)}
                    </div>
                    <span>{c.fullName}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{c.email}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{c.phone}</td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">{c.totalBookings}</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">${c.totalSpend.toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-center">
                    {c.vipStatus ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> VIP
                      </span>
                    ) : (
                      <span className="text-slate-400">Standard</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
