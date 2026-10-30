import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HotelProvider, useHotel } from './context/HotelContext';
import { RoomType } from './types/hotel';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { AdminSetupPage } from './components/auth/AdminSetupPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { SupabaseDbBanner } from './components/common/SupabaseDbBanner';
import { RoleBasedAiChatbot } from './components/common/RoleBasedAiChatbot';
import { LuxuryHotelLandingPage } from './components/landing/LuxuryHotelLandingPage';

// Admin Views
import { AdminDashboardOverview } from './components/admin/AdminDashboardOverview';
import { AdminCustomers } from './components/admin/AdminCustomers';
import { AdminRoomTypes } from './components/admin/AdminRoomTypes';
import { AdminRooms } from './components/admin/AdminRooms';
import { AdminBookings } from './components/admin/AdminBookings';
import { AdminCancellationPrediction } from './components/admin/AdminCancellationPrediction';
import { AdminAnalytics } from './components/admin/AdminAnalytics';
import { AdminAiInsights } from './components/admin/AdminAiInsights';
import { AdminManagementUsers } from './components/admin/AdminManagementUsers';
import { AdminSettings } from './components/admin/AdminSettings';

// Management Views
import { ManagementDashboardOverview } from './components/management/ManagementDashboardOverview';
import { ManagementCancellationPrediction } from './components/management/ManagementCancellationPrediction';
import { ManagementOccupancy } from './components/management/ManagementOccupancy';
import { ManagementRevenueAdr } from './components/management/ManagementRevenueAdr';
import { ManagementBookings } from './components/management/ManagementBookings';
import { ManagementRooms } from './components/management/ManagementRooms';
import { ManagementCustomers } from './components/management/ManagementCustomers';

// Customer Views
import { CustomerHome } from './components/customer/CustomerHome';
import { CustomerSearchRooms, BookingPrefillData } from './components/customer/CustomerSearchRooms';
import { CustomerMyBookings } from './components/customer/CustomerMyBookings';
import { CustomerAiAssistant } from './components/customer/CustomerAiAssistant';
import { CustomerProfile } from './components/customer/CustomerProfile';

const AppContent: React.FC = () => {
  const { user, role, isAuthenticated, isLoading, isAdminConfigured, setIsAdminConfigured } = useAuth();
  const { roomTypes } = useHotel();
  const [viewMode, setViewMode] = useState<'landing' | 'login' | 'register' | 'app'>(() => {
    const path = window.location.pathname.toLowerCase();
    if (path === '/login') return 'login';
    if (path === '/register') return 'register';
    if (path.startsWith('/admin') || path.startsWith('/management') || path.startsWith('/customer')) {
      return 'app';
    }
    return 'landing';
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Tab state per role
  const [adminTab, setAdminTab] = useState('dashboard');
  const [mgmtTab, setMgmtTab] = useState('dashboard');
  const [custTab, setCustTab] = useState('home');

  // Automated voice-booking prefill state
  const [bookingPrefill, setBookingPrefill] = useState<BookingPrefillData | null>(null);

  // Navigation handlers
  const navigateToLogin = useCallback(() => {
    window.history.pushState(null, '', '/login');
    setViewMode('login');
  }, []);

  const navigateToRegister = useCallback(() => {
    window.history.pushState(null, '', '/register');
    setViewMode('register');
  }, []);

  const navigateToLanding = useCallback(() => {
    window.history.pushState(null, '', '/');
    setViewMode('landing');
  }, []);

  const navigateToDashboard = useCallback(() => {
    setViewMode('app');
    if (role === 'admin') {
      window.history.pushState(null, '', `/admin/dashboard${adminTab !== 'dashboard' ? `/${adminTab}` : ''}`);
    } else if (role === 'management') {
      window.history.pushState(null, '', `/management/dashboard${mgmtTab !== 'dashboard' ? `/${mgmtTab}` : ''}`);
    } else if (role === 'customer') {
      window.history.pushState(null, '', `/customer/dashboard${custTab !== 'home' ? `/${custTab}` : ''}`);
    }
  }, [role, adminTab, mgmtTab, custTab]);

  // Enforce route protection and redirect unauthorized attempts to the appropriate page
  const enforceRouteProtection = useCallback(() => {
    if (isLoading) return;

    const path = window.location.pathname.toLowerCase();

    // 1. Unauthenticated Visitor Handling
    if (!isAuthenticated || !role) {
      if (path === '/login') {
        setViewMode('login');
      } else if (path === '/register') {
        setViewMode('register');
      } else if (path === '/' || path === '/landing' || path === '/home') {
        setViewMode('landing');
        if (path !== '/' && path !== '/landing') {
          window.history.replaceState(null, '', '/');
        }
      } else if (path.startsWith('/admin') || path.startsWith('/management') || path.startsWith('/customer')) {
        // Attempting to access protected dashboard while logged out
        window.history.replaceState(null, '', '/login');
        setViewMode('login');
      } else {
        // Default landing page
        window.history.replaceState(null, '', '/');
        setViewMode('landing');
      }
      return;
    }

    // 2. Authenticated User Handling
    if (path === '/landing') {
      setViewMode('landing');
      return;
    }

    // Role-based route redirection & protection
    setViewMode('app');
    if (role === 'admin') {
      if (path.startsWith('/management') || path.startsWith('/customer') || path === '/login' || path === '/' || path === '/register') {
        window.history.replaceState(null, '', `/admin/dashboard${adminTab !== 'dashboard' ? `/${adminTab}` : ''}`);
      }
    } else if (role === 'management') {
      if (path.startsWith('/admin') || path.startsWith('/customer') || path === '/login' || path === '/' || path === '/register') {
        window.history.replaceState(null, '', `/management/dashboard${mgmtTab !== 'dashboard' ? `/${mgmtTab}` : ''}`);
      }
    } else if (role === 'customer') {
      if (path.startsWith('/admin') || path.startsWith('/management') || path === '/login' || path === '/' || path === '/register') {
        window.history.replaceState(null, '', `/customer/dashboard${custTab !== 'home' ? `/${custTab}` : ''}`);
      }
    }
  }, [isLoading, isAuthenticated, role, adminTab, mgmtTab, custTab]);

  useEffect(() => {
    enforceRouteProtection();
  }, [enforceRouteProtection]);

  // Listen to popstate (e.g. user clicks browser back/forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      enforceRouteProtection();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [enforceRouteProtection]);

  // Loading Screen while Supabase verifies session and queries public.users
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20 mb-4 flex items-center justify-center font-bold text-xl">
          L
        </div>
        <div className="flex items-center gap-2.5 text-white">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-300 font-mono tracking-wide">
            Verifying Supabase user profile & permissions...
          </p>
        </div>
      </div>
    );
  }

  // 1. Landing Page View (accessible unauthenticated and authenticated via /landing or navigation)
  if (viewMode === 'landing') {
    return (
      <>
        <LuxuryHotelLandingPage
          onNavigateToLogin={navigateToLogin}
          onNavigateToRegister={navigateToRegister}
          onGoToDashboard={isAuthenticated ? navigateToDashboard : undefined}
        />
        {isAuthenticated && (
          <RoleBasedAiChatbot
            onNavigateTab={tab => {
              if (role === 'customer') setCustTab(tab);
              else if (role === 'management') setMgmtTab(tab);
              else if (role === 'admin') setAdminTab(tab);
              navigateToDashboard();
            }}
            onSelectRoomForBooking={roomTypeId => {
              const targetRoom = roomTypes.find(r => r.id === roomTypeId) || roomTypes[0];
              setBookingPrefill({
                roomType: targetRoom,
                checkIn: new Date().toISOString().split('T')[0],
                checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                guests: 2
              });
              setCustTab('search-rooms');
              navigateToDashboard();
            }}
            onTriggerBookingPrefill={data => {
              const targetRoom = roomTypes.find(
                r => r.id === data.roomTypeId ||
                     r.name.toLowerCase() === data.roomTypeId.toLowerCase() ||
                     r.name.toLowerCase().includes(data.roomTypeId.toLowerCase()) ||
                     r.code.toLowerCase() === data.roomTypeId.toLowerCase()
              ) || roomTypes[0];
              setBookingPrefill({
                roomType: targetRoom,
                checkIn: data.checkIn,
                checkOut: data.checkOut,
                guests: data.guests
              });
              setCustTab('search-rooms');
              navigateToDashboard();
            }}
          />
        )}
      </>
    );
  }

  // 2. Unauthenticated Login or Register Pages
  if (!isAuthenticated || !role) {
    if (viewMode === 'register') {
      return (
        <RegisterPage
          onNavigateToLogin={navigateToLogin}
          onNavigateToLanding={navigateToLanding}
          onSuccess={() => {
            setViewMode('login');
            window.history.replaceState(null, '', '/login');
          }}
        />
      );
    }

    return (
      <LoginPage
        onNavigateToRegister={navigateToRegister}
        onNavigateToLanding={navigateToLanding}
        onSuccess={() => enforceRouteProtection()}
      />
    );
  }

  // Determine current active tab & title based on role
  const currentTab =
    role === 'admin'
      ? adminTab
      : role === 'management'
      ? mgmtTab
      : custTab;

  const handleSelectTab = (tabId: string) => {
    if (role === 'admin') setAdminTab(tabId);
    else if (role === 'management') setMgmtTab(tabId);
    else setCustTab(tabId);
  };

  const getPageTitle = () => {
    if (role === 'admin') {
      const titles: Record<string, string> = {
        dashboard: 'Admin Dashboard',
        customers: 'Customer Directory',
        'room-types': 'Room Types & Blueprints',
        bookings: 'Master Bookings Ledger',
        rooms: 'Manage Physical Rooms',
        'cancellation-prediction': 'Cancellation Prediction Hub',
        analytics: 'Performance Analytics',
        'ai-insights': 'AI Business Insights',
        'management-users': 'User Directory & Access Control',
        settings: 'System & Hotel Settings'
      };
      return titles[adminTab] || 'Admin Dashboard';
    }

    if (role === 'management') {
      const titles: Record<string, string> = {
        dashboard: 'Management Operations',
        bookings: 'Operations Bookings',
        rooms: 'Manage Physical Rooms',
        'cancellation-prediction': 'Cancellation Forecasting',
        occupancy: 'Occupancy Dispatch',
        'revenue-adr': 'Revenue & ADR Optimization',
        customers: 'Guest Stay Records',
        'ai-insights': 'AI Operational Insights'
      };
      return titles[mgmtTab] || 'Management Dashboard';
    }

    const titles: Record<string, string> = {
      home: 'Welcome to Luxery Hotel',
      'search-rooms': 'Search Rooms & Suites',
      'my-bookings': 'My Stays & Reservations',
      'ai-assistant': 'AI Hotel Assistant',
      profile: 'Guest Profile'
    };
    return titles[custTab] || 'Customer Dashboard';
  };

  // Render role specific active tab content
  const renderContent = () => {
    // 1. ADMIN ROLE
    if (role === 'admin') {
      return (
        <ProtectedRoute allowedRole="admin">
          {(() => {
            switch (adminTab) {
              case 'dashboard':
                return <AdminDashboardOverview onNavigateTab={setAdminTab} />;
              case 'customers':
                return <AdminCustomers />;
              case 'room-types':
                return <AdminRoomTypes />;
              case 'bookings':
                return <AdminBookings />;
              case 'rooms':
                return <AdminRooms />;
              case 'cancellation-prediction':
                return <AdminCancellationPrediction />;
              case 'analytics':
                return <AdminAnalytics />;
              case 'ai-insights':
                return <AdminAiInsights />;
              case 'management-users':
                return <AdminManagementUsers />;
              case 'settings':
                return <AdminSettings />;
              default:
                return <AdminDashboardOverview onNavigateTab={setAdminTab} />;
            }
          })()}
        </ProtectedRoute>
      );
    }

    // 2. MANAGEMENT ROLE
    if (role === 'management') {
      return (
        <ProtectedRoute allowedRole="management">
          {(() => {
            switch (mgmtTab) {
              case 'dashboard':
                return <ManagementDashboardOverview onNavigateTab={setMgmtTab} />;
              case 'bookings':
                return <ManagementBookings />;
              case 'rooms':
                return <ManagementRooms />;
              case 'cancellation-prediction':
                return <ManagementCancellationPrediction />;
              case 'occupancy':
                return <ManagementOccupancy />;
              case 'revenue-adr':
                return <ManagementRevenueAdr />;
              case 'customers':
                return <ManagementCustomers />;
              case 'ai-insights':
                return <AdminAiInsights />;
              default:
                return <ManagementDashboardOverview onNavigateTab={setMgmtTab} />;
            }
          })()}
        </ProtectedRoute>
      );
    }

    // 3. CUSTOMER ROLE
    return (
      <ProtectedRoute allowedRole="customer">
        {(() => {
          switch (custTab) {
            case 'home':
              return <CustomerHome onNavigateTab={setCustTab} />;
            case 'search-rooms':
              return (
                <CustomerSearchRooms
                  initialBookingPrefill={bookingPrefill}
                  onClearBookingPrefill={() => setBookingPrefill(null)}
                />
              );
            case 'my-bookings':
              return <CustomerMyBookings />;
            case 'ai-assistant':
              return (
                <CustomerAiAssistant
                  onNavigateTab={setCustTab}
                  onTriggerBookingPrefill={(data) => {
                    const targetRoom = roomTypes.find(r => r.id === data.roomTypeId) || roomTypes[0];
                    setBookingPrefill({
                      roomType: targetRoom,
                      checkIn: data.checkIn,
                      checkOut: data.checkOut,
                      guests: data.guests
                    });
                    setCustTab('search-rooms');
                  }}
                />
              );
            case 'profile':
              return <CustomerProfile />;
            default:
              return <CustomerHome onNavigateTab={setCustTab} />;
          }
        })()}
      </ProtectedRoute>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar (Desktop fixed & Mobile drawer) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onNavigateToLanding={navigateToLanding}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header */}
        <Header
          onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          currentPageTitle={getPageTitle()}
        />

        {/* Database setup notice banner if table missing */}
        <SupabaseDbBanner />

        {/* Page Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderContent()}
        </main>

        {/* Role-Based Floating AI Chatbot with Supabase RAG Knowledge & Voice Booking Automation */}
        {isAuthenticated && (
          <RoleBasedAiChatbot
            onNavigateTab={tab => {
              if (role === 'customer') setCustTab(tab);
              else if (role === 'management') setMgmtTab(tab);
              else if (role === 'admin') setAdminTab(tab);
            }}
            onSelectRoomForBooking={roomTypeId => {
              const targetRoom = roomTypes.find(r => r.id === roomTypeId) || roomTypes[0];
              setBookingPrefill({
                roomType: targetRoom,
                checkIn: new Date().toISOString().split('T')[0],
                checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                guests: 2
              });
              setCustTab('search-rooms');
            }}
            onTriggerBookingPrefill={data => {
              const targetRoom = roomTypes.find(
                r => r.id === data.roomTypeId ||
                     r.name.toLowerCase() === data.roomTypeId.toLowerCase() ||
                     r.name.toLowerCase().includes(data.roomTypeId.toLowerCase()) ||
                     r.code.toLowerCase() === data.roomTypeId.toLowerCase()
              ) || roomTypes[0];
              setBookingPrefill({
                roomType: targetRoom,
                checkIn: data.checkIn,
                checkOut: data.checkOut,
                guests: data.guests
              });
              setCustTab('search-rooms');
            }}
          />
        )}

        {/* Quiet Clean Footer */}
        <footer className="px-6 py-4 border-t border-slate-200/80 bg-white text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Luxery Hotel & Residences. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>AI-Powered Hotel Intelligence</span>
            <span>·</span>
            <span>Secure System</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <HotelProvider>
        <AppContent />
      </HotelProvider>
    </AuthProvider>
  );
}
