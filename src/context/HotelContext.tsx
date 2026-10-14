import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  supabase,
  syncUserToDatabase,
  saveLocalFallbackProfile,
  deleteLocalFallbackProfile,
  getRemoteTableStatus,
  getStoredCustomers,
  getStoredBookings,
  getStoredRoomTypes,
  getStoredRooms,
  getStoredUsers,
  fetchCustomerBookingsFromDatabase,
  createBookingInDatabase,
  cancelBookingInDatabase,
  isSupabaseConfigured
} from '../lib/supabase';
import { useAuth } from './AuthContext';
import {
  RoomType,
  Room,
  Booking,
  Customer,
  ManagementUser,
  AiInsight,
  NotificationItem,
  RoomStatus,
  BookingStatus
} from '../types/hotel';
import {
  INITIAL_ROOM_TYPES,
  INITIAL_ROOMS,
  INITIAL_MANAGEMENT_USERS,
  AI_INSIGHTS,
  MOCK_NOTIFICATIONS
} from '../data/mockData';

interface HotelContextType {
  roomTypes: RoomType[];
  rooms: Room[];
  bookings: Booking[];
  customers: Customer[];
  managementUsers: ManagementUser[];
  insights: AiInsight[];
  notifications: NotificationItem[];
  customerBookings: Booking[];
  activeCustomerBooking: Booking | null;
  // Mutation methods:
  addManagementUser: (user: { fullName: string; email: string; temporaryPassword?: string }) => void;
  deleteManagementUser: (id: string) => void;
  updateRoomStatus: (roomId: string, status: RoomStatus) => void;
  addRoomType: (roomType: Omit<RoomType, 'id'>) => void;
  updateRoomType: (id: string, updated: Partial<RoomType>) => void;
  deleteRoomType: (id: string) => void;
  addRoom: (room: Omit<Room, 'id'>) => void;
  cancelBooking: (bookingId: string) => Promise<void>;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => void;
  createCustomerBooking: (bookingData: {
    roomTypeId: string;
    roomTypeName: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    nights: number;
    adr: number;
    specialRequests?: string;
  }) => Promise<Booking>;
  refreshCustomerBookings: () => Promise<void>;
  markNotificationAsRead: (id: string) => void;
  dismissNotification: (id: string) => void;
}

const HotelContext = createContext<HotelContextType | undefined>(undefined);

export const HotelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, customerProfile } = useAuth();

  const [roomTypes, setRoomTypes] = useState<RoomType[]>(() => getStoredRoomTypes());
  const [rooms, setRooms] = useState<Room[]>(() => getStoredRooms());
  const [bookings, setBookings] = useState<Booking[]>(() => getStoredBookings());
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [managementUsers, setManagementUsers] = useState<ManagementUser[]>(INITIAL_MANAGEMENT_USERS);
  const [insights] = useState<AiInsight[]>(AI_INSIGHTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [customerBookings, setCustomerBookings] = useState<Booking[]>([]);

  // Synchronize customer-specific bookings based on currently authenticated customer
  const refreshCustomerBookings = useCallback(async () => {
    if (!user || user.role !== 'customer') {
      setCustomerBookings([]);
      return;
    }

    try {
      const bList = await fetchCustomerBookingsFromDatabase(user.id);
      setCustomerBookings(bList);
    } catch (e) {
      console.warn('Notice fetching customer bookings:', e);
      const all = getStoredBookings();
      setCustomerBookings(all.filter(b => b.customerId === user.id));
    }
  }, [user]);

  useEffect(() => {
    refreshCustomerBookings();
  }, [refreshCustomerBookings]);

  // Synchronize customer directory with registered customer profiles and real live booking data
  useEffect(() => {
    const storedCustomers = getStoredCustomers();
    const storedBookings = getStoredBookings();

    const mappedCustomers: Customer[] = storedCustomers.map(sc => {
      const custBookings = storedBookings.filter(
        b => b.customerId === sc.id || (b.customerEmail && b.customerEmail.toLowerCase() === sc.email?.toLowerCase())
      );
      const totalBookings = custBookings.length;
      const cancelledBookings = custBookings.filter(b => b.status === 'Cancelled').length;
      const totalSpend = custBookings
        .filter(b => b.status !== 'Cancelled')
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      const lastBooking = custBookings[0]?.createdAt || sc.created_at?.split('T')[0] || '2026-10-01';

      return {
        id: sc.id,
        customerCode: sc.customer_code,
        fullName: sc.full_name,
        email: sc.email,
        phone: sc.phone || '',
        dateOfBirth: sc.date_of_birth,
        gender: sc.gender,
        address: sc.address_line,
        city: sc.city,
        state: sc.state,
        country: sc.country,
        emergencyContactName: sc.emergency_contact_name,
        emergencyContactPhone: sc.emergency_contact_phone,
        totalBookings,
        cancelledBookings,
        totalSpend,
        vipStatus: totalSpend > 2000 || totalBookings >= 3,
        memberSince: sc.created_at ? sc.created_at.split('T')[0] : '2025-01-10',
        lastBookingDate: lastBooking
      };
    });

    setCustomers(mappedCustomers);
  }, [customerBookings, bookings]);

  // Active customer booking for customer overview
  const activeCustomerBooking =
    customerBookings.find(b => b.status === 'Confirmed' || b.status === 'Checked-In') || null;

  const addManagementUser = async (userData: { fullName: string; email: string }) => {
    const newUser: ManagementUser = {
      id: `m-${Date.now()}`,
      fullName: userData.fullName,
      email: userData.email,
      status: 'Active',
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: 'Never logged in',
      department: 'Operations & Management'
    };
    setManagementUsers(prev => [newUser, ...prev]);

    syncUserToDatabase({
      id: newUser.id,
      full_name: userData.fullName,
      email: userData.email.toLowerCase(),
      phone: '',
      role: 'management',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).catch(() => {});
  };

  const deleteManagementUser = async (id: string) => {
    const target = managementUsers.find(u => u.id === id);
    setManagementUsers(prev => prev.filter(u => u.id !== id));
    if (target?.email) {
      deleteLocalFallbackProfile(target.email.toLowerCase());
      if (getRemoteTableStatus() === 'ready') {
        try {
          await supabase.from('users').delete().eq('email', target.email.toLowerCase());
        } catch (e) {
          console.warn('Notice deleting from Supabase users table:', e);
        }
      }
    }
  };

  const updateRoomStatus = (roomId: string, status: RoomStatus) => {
    setRooms(prev => prev.map(r => (r.id === roomId ? { ...r, status } : r)));
  };

  const addRoomType = (roomTypeData: Omit<RoomType, 'id'>) => {
    const newRt: RoomType = {
      id: `rt-${Date.now()}`,
      ...roomTypeData
    };
    setRoomTypes(prev => [...prev, newRt]);
  };

  const updateRoomType = (id: string, updated: Partial<RoomType>) => {
    setRoomTypes(prev => prev.map(rt => (rt.id === id ? { ...rt, ...updated } : rt)));
  };

  const deleteRoomType = (id: string) => {
    setRoomTypes(prev => prev.filter(rt => rt.id !== id));
  };

  const addRoom = (roomData: Omit<Room, 'id'>) => {
    const newRoom: Room = {
      id: `rm-${Date.now()}`,
      ...roomData
    };
    setRooms(prev => [...prev, newRoom]);
  };

  const cancelBooking = async (bookingId: string) => {
    await cancelBookingInDatabase(bookingId, user?.id);
    setBookings(prev =>
      prev.map(b => (b.id === bookingId || b.bookingReference === bookingId ? { ...b, status: 'Cancelled' } : b))
    );
    setCustomerBookings(prev =>
      prev.map(b => (b.id === bookingId || b.bookingReference === bookingId ? { ...b, status: 'Cancelled' } : b))
    );
  };

  const updateBookingStatus = (bookingId: string, status: BookingStatus) => {
    setBookings(prev =>
      prev.map(b => (b.id === bookingId || b.bookingReference === bookingId ? { ...b, status } : b))
    );
    setCustomerBookings(prev =>
      prev.map(b => (b.id === bookingId || b.bookingReference === bookingId ? { ...b, status } : b))
    );
  };

  const createCustomerBooking = async (data: {
    roomTypeId: string;
    roomTypeName: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    nights: number;
    adr: number;
    specialRequests?: string;
  }): Promise<Booking> => {
    const customerId = user?.id || 'c0000000-0000-0000-0000-000000000003';
    const customerCode = customerProfile?.customer_code || 'CUS-NAIDU001';
    const customerName = user?.fullName || 'Guest Customer';
    const customerEmail = user?.email || 'customer@gmail.com';
    const customerPhone = user?.phone || '';

    const res = await createBookingInDatabase({
      customerId,
      customerCode,
      customerName,
      customerEmail,
      customerPhone,
      roomTypeId: data.roomTypeId,
      roomTypeName: data.roomTypeName,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      guests: data.guests,
      nights: data.nights,
      adr: data.adr,
      specialRequests: data.specialRequests
    });

    if (!res.success || !res.booking) {
      throw new Error(res.error || 'Failed to create reservation.');
    }

    const newBooking = res.booking;
    setBookings(prev => [newBooking, ...prev]);
    setCustomerBookings(prev => [newBooking, ...prev]);

    // Push notification to management & admin
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'New Direct Customer Reservation',
      message: `${newBooking.customerName} (${customerCode}) confirmed ${newBooking.roomTypeName} (${data.nights} nights, $${newBooking.totalAmount}). Ref: ${newBooking.bookingReference}`,
      time: 'Just now',
      type: 'booking',
      read: false
    };
    setNotifications(prev => [notif, ...prev]);

    return newBooking;
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <HotelContext.Provider
      value={{
        roomTypes,
        rooms,
        bookings,
        customers,
        managementUsers,
        insights,
        notifications,
        customerBookings,
        activeCustomerBooking,
        addManagementUser,
        deleteManagementUser,
        updateRoomStatus,
        addRoomType,
        updateRoomType,
        deleteRoomType,
        addRoom,
        cancelBooking,
        updateBookingStatus,
        createCustomerBooking,
        refreshCustomerBookings,
        markNotificationAsRead,
        dismissNotification
      }}
    >
      {children}
    </HotelContext.Provider>
  );
};

export const useHotel = () => {
  const context = useContext(HotelContext);
  if (!context) {
    throw new Error('useHotel must be used within a HotelProvider');
  }
  return context;
};
