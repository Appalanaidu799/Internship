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
  fetchAllBookingsFromDatabase,
  fetchRoomTypesFromDatabase,
  fetchRoomsFromDatabase,
  fetchCustomersFromDatabase,
  createBookingInDatabase,
  cancelBookingInDatabase,
  syncLocalBookingsToSupabase,
  isSupabaseConfigured
} from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Role, UserProfile } from '../types/auth';
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
  allUsers: UserProfile[];
  insights: AiInsight[];
  notifications: NotificationItem[];
  customerBookings: Booking[];
  activeCustomerBooking: Booking | null;
  isDatabaseSyncing: boolean;
  // Mutation methods:
  addManagementUser: (user: { fullName: string; email: string; temporaryPassword?: string }) => void;
  deleteManagementUser: (id: string) => void;
  updateUserRole: (userId: string, newRole: Role) => Promise<{ success: boolean; error?: string }>;
  deleteUserAccount: (userId: string) => Promise<{ success: boolean; error?: string }>;
  updateRoomStatus: (roomId: string, status: RoomStatus) => void;
  addRoomType: (roomType: Omit<RoomType, 'id'>) => void;
  updateRoomType: (id: string, updated: Partial<RoomType>) => void;
  deleteRoomType: (id: string) => void;
  addRoom: (room: Omit<Room, 'id'>) => void;
  cancelBooking: (
    bookingId: string,
    refundDetails?: {
      refundAmount?: number;
      cancellationFee?: number;
      cancellationReason?: string;
      refundPercentage?: number;
    }
  ) => Promise<void>;
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
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    customerAge?: number;
    customerGender?: string;
    customerAddress?: string;
    customerCity?: string;
    customerState?: string;
    customerCountry?: string;
    customerPostalCode?: string;
    aadharNumber?: string;
    idProofType?: string;
    idProofNumber?: string;
    aadharDocumentName?: string;
    aadharDocumentData?: string;
    purposeOfVisit?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    paymentStatus?: 'Pending' | 'Paid' | 'Refunded' | 'Failed';
    paymentMethod?: string;
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
    razorpaySignature?: string;
  }) => Promise<Booking>;
  refreshCustomerBookings: () => Promise<void>;
  refreshAllData: () => Promise<void>;
  syncBookingsToRemote: () => Promise<{ synced: number; total: number }>;
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
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [insights] = useState<AiInsight[]>(AI_INSIGHTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [customerBookings, setCustomerBookings] = useState<Booking[]>([]);
  const [isDatabaseSyncing, setIsDatabaseSyncing] = useState<boolean>(false);

  // Synchronize all core data directly from remote Supabase PostgreSQL database
  const refreshAllData = useCallback(async () => {
    setIsDatabaseSyncing(true);
    try {
      if (isSupabaseConfigured) {
        // Automatically sync any offline or unsynced bookings to Supabase
        await syncLocalBookingsToSupabase();

        // 1. Fetch bookings, room types, rooms, customers, and all users in parallel
        const [dbBookings, dbRoomTypes, dbRooms, dbCustomers, usersRes] = await Promise.all([
          fetchAllBookingsFromDatabase(),
          fetchRoomTypesFromDatabase(),
          fetchRoomsFromDatabase(),
          fetchCustomersFromDatabase(),
          supabase.from('users').select('*').order('created_at', { ascending: false })
        ]);

        const activeBookings = Array.isArray(dbBookings) ? dbBookings : [];
        setBookings(activeBookings);

        if (Array.isArray(dbRoomTypes) && dbRoomTypes.length > 0) {
          setRoomTypes(dbRoomTypes);
        }
        if (Array.isArray(dbRooms) && dbRooms.length > 0) {
          setRooms(dbRooms);
        }

        // 2. Map all users across roles (customer, management, admin)
        let loadedUsers: UserProfile[] = [];
        if (usersRes && Array.isArray(usersRes.data)) {
          loadedUsers = usersRes.data.map((u: any) => ({
            id: u.id,
            full_name: u.full_name || u.email?.split('@')[0] || 'User',
            email: u.email,
            phone: u.phone || '',
            role: (u.role || 'customer') as Role,
            status: (u.status || 'active') as any,
            profile_image: u.profile_image || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.full_name || u.email || 'User')}`,
            created_at: u.created_at,
            updated_at: u.updated_at
          }));
          setAllUsers(loadedUsers);

          // Map management accounts from all users
          const mgmtAccounts: ManagementUser[] = loadedUsers
            .filter(u => u.role === 'management')
            .map(u => ({
              id: u.id,
              fullName: u.full_name,
              email: u.email,
              status: (u.status === 'active' ? 'Active' : 'Inactive') as any,
              createdAt: u.created_at ? u.created_at.split('T')[0] : '2026-10-01',
              lastLogin: 'Active session',
              department: 'Operations & Management'
            }));
          setManagementUsers(mgmtAccounts);
        }

        // 3. Combine public.customers and loaded customer users into unified live customer directory
        const customerMap = new Map<string, any>();

        loadedUsers
          .filter(u => u.role === 'customer')
          .forEach((u: any) => {
            const key = u.email ? u.email.toLowerCase() : u.id;
            customerMap.set(key, {
              id: u.id,
              customer_code: `CUS-${u.id.substring(0, 8).toUpperCase()}`,
              full_name: u.full_name,
              email: u.email,
              phone: u.phone || '',
              created_at: u.created_at
            });
          });

        if (Array.isArray(dbCustomers)) {
          dbCustomers.forEach((c: any) => {
            const key = (c.email || c.id).toLowerCase();
            const existing = customerMap.get(key);
            customerMap.set(key, {
              ...existing,
              ...c,
              id: c.id || existing?.id,
              customer_code: c.customer_code || existing?.customer_code,
              full_name: c.full_name || existing?.full_name,
              email: c.email || existing?.email,
              phone: c.phone || existing?.phone
            });
          });
        }

        const combinedRecords = Array.from(customerMap.values());
        const mappedCustomers: Customer[] = combinedRecords.map(sc => {
          const custBookings = activeBookings.filter(
            b => b.customerId === sc.id || (b.customerEmail && b.customerEmail.toLowerCase() === sc.email?.toLowerCase())
          );
          const totalBookings = custBookings.length;
          const cancelledBookings = custBookings.filter(b => b.status === 'Cancelled').length;
          const totalSpend = custBookings
            .filter(b => b.status !== 'Cancelled' && b.paymentStatus === 'Paid')
            .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
          const lastBooking = custBookings[0]?.createdAt || (sc.created_at ? sc.created_at.split('T')[0] : 'No bookings yet');

          return {
            id: sc.id,
            customerCode: sc.customer_code || `CUS-${sc.id.substring(0, 8).toUpperCase()}`,
            fullName: sc.full_name || sc.email?.split('@')[0] || 'Guest Customer',
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
            vipStatus: totalSpend > 5000 || totalBookings >= 3,
            memberSince: sc.created_at ? sc.created_at.split('T')[0] : '2026-10-01',
            lastBookingDate: lastBooking
          };
        });

        setCustomers(mappedCustomers);
      }
    } catch (err) {
      console.warn('Error synchronizing hotel data with Supabase:', err);
    } finally {
      setIsDatabaseSyncing(false);
    }
  }, []);

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
      setCustomerBookings(all.filter(b => b.customerId === user.id || (b.customerEmail && b.customerEmail.toLowerCase() === user.email?.toLowerCase())));
    }
  }, [user]);

  // Initial load on startup
  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  useEffect(() => {
    refreshCustomerBookings();
  }, [refreshCustomerBookings]);

  // Set up Supabase Realtime channel for live bookings, rooms, room types, users & customers updates
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('hotel_realtime_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          console.log('Realtime event received for bookings:', payload);
          fetchAllBookingsFromDatabase().then(b => {
            if (Array.isArray(b)) setBookings(b);
          });
          if (user?.id) {
            fetchCustomerBookingsFromDatabase(user.id).then(cb => {
              if (Array.isArray(cb)) setCustomerBookings(cb);
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        () => {
          fetchRoomsFromDatabase().then(r => {
            if (Array.isArray(r)) setRooms(r);
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_types' },
        () => {
          fetchRoomTypesFromDatabase().then(rt => {
            if (Array.isArray(rt)) setRoomTypes(rt);
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        () => {
          refreshAllData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customers' },
        () => {
          refreshAllData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refreshAllData]);

  // Active customer booking for customer overview
  const activeCustomerBooking =
    customerBookings.find(b => b.status === 'Confirmed' || b.status === 'Checked-In') || null;

  const addManagementUser = async (userData: { fullName: string; email: string; temporaryPassword?: string }) => {
    const newId = `mgmt-${Date.now()}`;
    const newUser: ManagementUser = {
      id: newId,
      fullName: userData.fullName,
      email: userData.email.toLowerCase(),
      status: 'Active',
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: 'Never logged in',
      department: 'Operations & Management'
    };
    setManagementUsers(prev => [newUser, ...prev]);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('users').upsert({
          id: newId,
          full_name: userData.fullName,
          email: userData.email.toLowerCase(),
          phone: '',
          role: 'management',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'email' });
      } catch (e) {
        console.warn('Error adding management user to Supabase:', e);
      }
    }
    refreshAllData();
  };

  const deleteManagementUser = async (id: string) => {
    const target = managementUsers.find(u => u.id === id);
    setManagementUsers(prev => prev.filter(u => u.id !== id));
    if (isSupabaseConfigured && target?.email) {
      try {
        deleteLocalFallbackProfile(target.email.toLowerCase());
        await supabase.from('users').delete().eq('email', target.email.toLowerCase());
      } catch (e) {
        console.warn('Notice deleting from Supabase users table:', e);
      }
    }
    refreshAllData();
  };

  const updateUserRole = async (userId: string, newRole: Role): Promise<{ success: boolean; error?: string }> => {
    try {
      // 1. Optimistic UI update
      setAllUsers(prev => prev.map(u => (u.id === userId ? { ...u, role: newRole, updated_at: new Date().toISOString() } : u)));

      // 2. Persist to Supabase public.users
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('users')
          .update({ role: newRole, updated_at: new Date().toISOString() })
          .eq('id', userId);

        if (error) {
          console.warn('Notice from updating user role in Supabase:', error);
          return { success: false, error: error.message };
        }
      }

      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      console.warn('Error updating user role:', err);
      return { success: false, error: err?.message || 'Failed to update user role' };
    }
  };

  const deleteUserAccount = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setAllUsers(prev => prev.filter(u => u.id !== userId));
      setManagementUsers(prev => prev.filter(u => u.id !== userId));
      setCustomers(prev => prev.filter(c => c.id !== userId));

      if (isSupabaseConfigured) {
        const { error } = await supabase.from('users').delete().eq('id', userId);
        if (error) {
          console.warn('Notice deleting user from Supabase:', error);
          return { success: false, error: error.message };
        }
      }

      await refreshAllData();
      return { success: true };
    } catch (err: any) {
      console.warn('Error deleting user:', err);
      return { success: false, error: err?.message || 'Failed to delete user' };
    }
  };

  const updateRoomStatus = async (roomId: string, status: RoomStatus) => {
    setRooms(prev => prev.map(r => (r.id === roomId ? { ...r, status } : r)));
    if (isSupabaseConfigured) {
      try {
        await supabase.from('rooms').update({ status }).eq('id', roomId);
      } catch (e) {
        console.warn('Notice updating room status in Supabase:', e);
      }
    }
  };

  const addRoomType = (roomTypeData: Omit<RoomType, 'id'>) => {
    const newRt: RoomType = {
      id: `11111111-1111-1111-1111-${Date.now().toString().slice(-12)}`,
      ...roomTypeData
    };
    setRoomTypes(prev => [...prev, newRt]);
    if (isSupabaseConfigured) {
      supabase.from('room_types').insert({
        id: newRt.id,
        name: newRt.name,
        description: newRt.description,
        capacity: newRt.capacity,
        base_price: newRt.basePrice,
        amenities: newRt.amenities,
        is_active: newRt.status === 'Active'
      }).then(() => refreshAllData());
    }
  };

  const updateRoomType = (id: string, updated: Partial<RoomType>) => {
    setRoomTypes(prev => prev.map(rt => (rt.id === id ? { ...rt, ...updated } : rt)));
    if (isSupabaseConfigured) {
      const updatePayload: any = {};
      if (updated.name) updatePayload.name = updated.name;
      if (updated.description) updatePayload.description = updated.description;
      if (updated.capacity) updatePayload.capacity = updated.capacity;
      if (updated.basePrice) updatePayload.base_price = updated.basePrice;
      if (updated.amenities) updatePayload.amenities = updated.amenities;
      if (updated.status) updatePayload.is_active = updated.status === 'Active';
      supabase.from('room_types').update(updatePayload).eq('id', id).then(() => refreshAllData());
    }
  };

  const deleteRoomType = (id: string) => {
    setRoomTypes(prev => prev.filter(rt => rt.id !== id));
    if (isSupabaseConfigured) {
      supabase.from('room_types').delete().eq('id', id).then(() => refreshAllData());
    }
  };

  const addRoom = (roomData: Omit<Room, 'id'>) => {
    const newRoom: Room = {
      id: `22222222-2222-2222-2222-${Date.now().toString().slice(-12)}`,
      ...roomData
    };
    setRooms(prev => [...prev, newRoom]);
    if (isSupabaseConfigured) {
      supabase.from('rooms').insert({
        id: newRoom.id,
        room_number: newRoom.roomNumber,
        room_type_id: newRoom.roomTypeId,
        floor_number: newRoom.floor,
        status: newRoom.status
      }).then(() => refreshAllData());
    }
  };

  const cancelBooking = async (
    bookingId: string,
    refundDetails?: {
      refundAmount?: number;
      cancellationFee?: number;
      cancellationReason?: string;
      refundPercentage?: number;
    }
  ) => {
    await cancelBookingInDatabase(bookingId, user?.id, refundDetails);
    const cancelledTimestamp = new Date().toISOString();
    const updateFn = (b: Booking) => {
      if (b.id === bookingId || b.bookingReference === bookingId) {
        return {
          ...b,
          status: 'Cancelled' as BookingStatus,
          paymentStatus: 'Refunded' as const,
          cancelledAt: cancelledTimestamp,
          ...(refundDetails || {})
        };
      }
      return b;
    };
    setBookings(prev => prev.map(updateFn));
    setCustomerBookings(prev => prev.map(updateFn));
    refreshAllData();
  };

  const updateBookingStatus = (bookingId: string, status: BookingStatus) => {
    setBookings(prev =>
      prev.map(b => (b.id === bookingId || b.bookingReference === bookingId ? { ...b, status } : b))
    );
    setCustomerBookings(prev =>
      prev.map(b => (b.id === bookingId || b.bookingReference === bookingId ? { ...b, status } : b))
    );
    // Also update Supabase
    if (isSupabaseConfigured) {
      supabase
        .from('bookings')
        .update({ booking_status: status, updated_at: new Date().toISOString() })
        .or(`id.eq.${bookingId},booking_reference.eq.${bookingId}`)
        .then(() => refreshAllData());
    }
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
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    customerAge?: number;
    customerGender?: string;
    customerAddress?: string;
    customerCity?: string;
    customerState?: string;
    customerCountry?: string;
    customerPostalCode?: string;
    aadharNumber?: string;
    idProofType?: string;
    idProofNumber?: string;
    aadharDocumentName?: string;
    aadharDocumentData?: string;
    purposeOfVisit?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    paymentStatus?: 'Pending' | 'Paid' | 'Refunded' | 'Failed';
    paymentMethod?: string;
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
    razorpaySignature?: string;
  }): Promise<Booking> => {
    const customerId = user?.id || 'c0000000-0000-0000-0000-000000000003';
    const customerCode = customerProfile?.customer_code || 'CUS-NAIDU001';
    const customerName = data.customerName?.trim() || customerProfile?.full_name || user?.fullName || 'Guest Customer';
    const customerEmail = data.customerEmail?.trim() || customerProfile?.email || user?.email || 'customer@gmail.com';
    const customerPhone = data.customerPhone?.trim() || customerProfile?.phone || user?.phone || '';

    const res = await createBookingInDatabase({
      customerId,
      customerCode,
      customerName,
      customerEmail,
      customerPhone,
      customerAge: data.customerAge ?? (customerProfile?.age || undefined),
      customerGender: data.customerGender || customerProfile?.gender || undefined,
      customerAddress: data.customerAddress || customerProfile?.address_line || undefined,
      customerCity: data.customerCity || customerProfile?.city || undefined,
      customerState: data.customerState || customerProfile?.state || undefined,
      customerCountry: data.customerCountry || customerProfile?.country || 'India',
      customerPostalCode: data.customerPostalCode || customerProfile?.postal_code || undefined,
      aadharNumber: data.aadharNumber || customerProfile?.aadhar_number || data.idProofNumber || undefined,
      idProofType: data.idProofType || customerProfile?.id_proof_type || 'Aadhar Card',
      idProofNumber: data.idProofNumber || customerProfile?.id_proof_number || data.aadharNumber || undefined,
      aadharDocumentName: data.aadharDocumentName,
      aadharDocumentData: data.aadharDocumentData,
      purposeOfVisit: data.purposeOfVisit || 'Leisure / Holiday',
      emergencyContactName: data.emergencyContactName || customerProfile?.emergency_contact_name || undefined,
      emergencyContactPhone: data.emergencyContactPhone || customerProfile?.emergency_contact_phone || undefined,
      roomTypeId: data.roomTypeId,
      roomTypeName: data.roomTypeName,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      guests: data.guests,
      nights: data.nights,
      adr: data.adr,
      specialRequests: data.specialRequests,
      paymentStatus: data.paymentStatus || 'Paid',
      paymentMethod: data.paymentMethod || 'Razorpay',
      razorpayPaymentId: data.razorpayPaymentId,
      razorpayOrderId: data.razorpayOrderId,
      razorpaySignature: data.razorpaySignature
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
      message: `${newBooking.customerName} (${customerCode}) confirmed ${newBooking.roomTypeName} (${data.nights} nights, ₹${newBooking.totalAmount.toLocaleString('en-IN')}). Ref: ${newBooking.bookingReference}`,
      time: 'Just now',
      type: 'booking',
      read: false
    };
    setNotifications(prev => [notif, ...prev]);

    // Refresh all bookings from Supabase so all roles are in immediate lockstep
    refreshAllData();
    refreshCustomerBookings();

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
        allUsers,
        insights,
        notifications,
        customerBookings,
        activeCustomerBooking,
        isDatabaseSyncing,
        addManagementUser,
        deleteManagementUser,
        updateUserRole,
        deleteUserAccount,
        updateRoomStatus,
        addRoomType,
        updateRoomType,
        deleteRoomType,
        addRoom,
        cancelBooking,
        updateBookingStatus,
        createCustomerBooking,
        refreshCustomerBookings,
        refreshAllData,
        syncBookingsToRemote: syncLocalBookingsToSupabase,
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
