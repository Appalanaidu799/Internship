import React from 'react';
import {
  LayoutDashboard,
  Users,
  BedDouble,
  CalendarCheck,
  Building,
  AlertOctagon,
  LineChart,
  Sparkles,
  UserCheck,
  Settings,
  Hotel,
  Percent,
  Search,
  MessageSquareCode,
  User,
  X,
  Shield,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useHotel } from '../../context/HotelContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile
}) => {
  const { user } = useAuth();
  const { bookings } = useHotel();

  const highRiskCount = bookings.filter(b => b.cancellationRisk === 'HIGH' && b.status === 'Confirmed').length;

  const getNavItems = () => {
    if (user?.role === 'admin') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'room-types', label: 'Room Types', icon: BedDouble },
        { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
        { id: 'rooms', label: 'Manage Rooms', icon: Building },
        {
          id: 'cancellation-prediction',
          label: 'Cancellation Prediction',
          icon: AlertOctagon,
          badge: highRiskCount > 0 ? `${highRiskCount} Risk` : undefined,
          badgeColor: 'bg-rose-500'
        },
        { id: 'analytics', label: 'Analytics', icon: LineChart },
        { id: 'ai-insights', label: 'AI Insights', icon: Sparkles, badge: 'New', badgeColor: 'bg-blue-500' },
        { id: 'management-users', label: 'User Directory & Access', icon: UserCheck },
        { id: 'settings', label: 'Settings', icon: Settings }
      ];
    }

    if (user?.role === 'management') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
        { id: 'rooms', label: 'Manage Rooms', icon: Building },
        {
          id: 'cancellation-prediction',
          label: 'Cancellation Prediction',
          icon: AlertOctagon,
          badge: highRiskCount > 0 ? `${highRiskCount} Risk` : undefined,
          badgeColor: 'bg-rose-500'
        },
        { id: 'occupancy', label: 'Occupancy', icon: BedDouble },
        { id: 'revenue-adr', label: 'Revenue & ADR', icon: Percent },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'ai-insights', label: 'AI Insights', icon: Sparkles, badge: 'New', badgeColor: 'bg-blue-500' }
      ];
    }

    // Customer
    return [
      { id: 'home', label: 'Home', icon: Hotel },
      { id: 'search-rooms', label: 'Search Rooms', icon: Search },
      { id: 'my-bookings', label: 'My Bookings', icon: CalendarCheck },
      { id: 'ai-assistant', label: 'Aura Concierge', icon: Sparkles, badge: 'Voice', badgeColor: 'bg-emerald-500' },
      { id: 'profile', label: 'Profile', icon: User }
    ];
  };

  const navItems = getNavItems();

  const handleTabClick = (tabId: string) => {
    onSelectTab(tabId);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-bold text-base tracking-wider">
              L
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-tight block">
                Luxery Hotel
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                Hotel Intelligence
              </span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded text-slate-400 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Account Banner */}
        <div className="px-4 py-3 mx-3 my-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-center gap-2.5 text-xs">
          <div className="w-8 h-8 rounded-full bg-blue-600/30 text-blue-300 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-100 truncate">{user?.fullName || 'Active User'}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-slate-400">
            Menu Navigation
          </p>

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold text-white ${
                      item.badgeColor || 'bg-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Info */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-300">
          <div className="flex items-center justify-between font-mono text-[10px]">
            <span className="text-slate-400">Luxery OS</span>
            <span className="text-blue-400">v2.4 Enterprise</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Predictive AI & Booking Engine
          </p>
        </div>
      </aside>
    </>
  );
};
