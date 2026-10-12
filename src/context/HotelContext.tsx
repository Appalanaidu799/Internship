import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, syncUserToDatabase, saveLocalFallbackProfile, deleteLocalFallbackProfile, getRemoteTableStatus } from '../lib/supabase';
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
  INITIAL_BOOKINGS,
  INITIAL_CUSTOMERS,
  INITIAL_MANAGEMENT_USERS,
  AI_INSIGHTS,
  MOCK_NOTIFICATIONS,
  CUSTOMER_ACTIVE_BOOKING,
  CUSTOMER_PAST_BOOKINGS
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
  // Mutation methods for interactive frontend:
  addManagementUser: (user: { fullName: string; email: string; temporaryPassword?: string }) => void;
  deleteManagementUser: (id: string) => void;
  updateRoomStatus: (roomId: string, status: RoomStatus) => void;
  addRoomType: (roomType: Omit<RoomType, 'id'>) => void;
  updateRoomType: (id: string, updated: Partial<RoomType>) => void;
  deleteRoomType: (id: string) => void;
  addRoom: (room: Omit<Room, 'id'>) => void;
  cancelBooking: (bookingId: string) => void;
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
  }) => Booking;
  markNotificationAsRead: (id: string) => void;
  dismissNotification: (id: string) => void;
}

const HotelContext = createContext<HotelContextType | undefined>(undefined);

export const HotelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>(INITIAL_ROOM_TYPES);
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [managementUsers, setManagementUsers] = useState<ManagementUser[]>(INITIAL_MANAGEMENT_USERS);
  const [insights] = useState<AiInsight[]>(AI_INSIGHTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [customerBookings, setCustomerBookings] = useState<Booking[]>([
    CUSTOMER_ACTIVE_BOOKING,
    ...CUSTOMER_PAST_BOOKINGS
  ]);

  const activeCustomerBooking = customerBookings.find(b => b.status === 'Confirmed') || null;

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

    // Insert into users table (local + remote if active)
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
    setRooms(prev =>
      prev.map(r => (r.id === roomId ? { ...r, status } : r))
    );
  };

  const addRoomType = (roomTypeData: Omit<RoomType, 'id'>) => {
    const newRt: RoomType = {
      id: `rt-${Date.now()}`,
      ...roomTypeData
    };
    setRoomTypes(prev => [...prev, newRt]);
  };

  const updateRoomType = (id: string, updated: Partial<RoomType>) => {
    setRoomTypes(prev =>
      prev.map(rt => (rt.id === id ? { ...rt, ...updated } : rt))
    );
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

  const cancelBooking = (bookingId: string) => {
    setBookings(prev =>
      prev.map(b => (b.id === bookingId ? { ...b, status: 'Cancelled' } : b))
    );
    setCustomerBookings(prev =>
      prev.map(b => (b.id === bookingId ? { ...b, status: 'Cancelled' } : b))
    );
  };

  const updateBookingStatus = (bookingId: string, status: BookingStatus) => {
    setBookings(prev =>
      prev.map(b => (b.id === bookingId ? { ...b, status } : b))
    );
  };

  const createCustomerBooking = (data: {
    roomTypeId: string;
    roomTypeName: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    nights: number;
    adr: number;
    specialRequests?: string;
  }): Booking => {
    const newId = `BKG-NDU-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalAmount = data.adr * data.nights;
    const newBooking: Booking = {
      id: newId,
      customerName: 'Rajesh Naidu',
      customerEmail: 'customer@gmail.com',
      roomTypeId: data.roomTypeId,
      roomTypeName: data.roomTypeName,
      roomNumber: 'Assigned at Check-In',
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      nights: data.nights,
      guests: data.guests,
      adr: data.adr,
      totalAmount,
      status: 'Confirmed',
      cancellationProbability: 12,
      cancellationRisk: 'LOW',
      leadTimeDays: 14,
      marketSegment: 'Direct',
      depositType: 'Refundable',
      createdAt: new Date().toISOString().split('T')[0],
      specialRequests: data.specialRequests
    };

    setBookings(prev => [newBooking, ...prev]);
    setCustomerBookings(prev => [newBooking, ...prev]);

    // Push notification to management/admin
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'New Direct Customer Reservation',
      message: `${newBooking.customerName} confirmed ${newBooking.roomTypeName} (${data.nights} nights, $${totalAmount}).`,
      time: 'Just now',
      type: 'booking',
      read: false
    };
    setNotifications(prev => [notif, ...prev]);

    return newBooking;
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
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
