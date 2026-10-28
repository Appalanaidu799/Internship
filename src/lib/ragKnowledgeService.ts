import { RoomType, Room, Booking, Customer } from '../types/hotel';
import {
  isSupabaseConfigured,
  supabase,
  fetchRoomTypesFromDatabase,
  fetchRoomsFromDatabase,
  fetchAllBookingsFromDatabase,
  fetchCustomerBookingsFromDatabase,
  getStoredRoomTypes,
  getStoredRooms,
  getStoredBookings,
  getStoredCustomers
} from './supabase';
import { INITIAL_ROOM_TYPES, INITIAL_ROOMS, ANALYTICS_DATA } from '../data/mockData';

// ==============================================================================
// 1. HOTEL POLICIES KNOWLEDGE BASE
// ==============================================================================

export interface HotelPolicySection {
  id: string;
  category: 'check_in_out' | 'cancellation_refund' | 'identity_kyc' | 'pricing_tax' | 'occupancy_child' | 'amenities_services' | 'house_rules' | 'contact_support';
  title: string;
  summary: string;
  details: string[];
  roleAccess: ('customer' | 'management' | 'admin')[];
}

export const HOTEL_POLICIES: HotelPolicySection[] = [
  {
    id: 'policy-checkin',
    category: 'check_in_out',
    title: 'Check-In & Check-Out Times',
    summary: 'Standard check-in is at 2:00 PM (14:00) and check-out is at 11:00 AM (11:00).',
    details: [
      'Standard Check-In: 2:00 PM (14:00 hrs) Indian Standard Time.',
      'Standard Check-Out: 11:00 AM (11:00 hrs) Indian Standard Time.',
      'Early Check-In: Available from 09:00 AM onwards on request, subject to room availability. Complimentary for direct website bookings.',
      'Late Check-Out: Available up to 02:00 PM on request (nominal hourly fee of ₹350 may apply if hotel occupancy exceeds 85%).',
      'Express Digital Check-In: Available online after Aadhaar or PAN document verification.'
    ],
    roleAccess: ['customer', 'management', 'admin']
  },
  {
    id: 'policy-cancellation',
    category: 'cancellation_refund',
    title: 'Cancellation & Refund Schedule',
    summary: 'Free cancellation up to 48 hours prior to check-in with 100% refund. 50% refund between 24-48 hours. Non-refundable within 24 hours.',
    details: [
      'Free Cancellation (Tier 1): 100% refund if cancelled more than 48 hours before the scheduled check-in date (14:00 check-in time).',
      'Partial Refund (Tier 2): 50% refund if cancelled between 24 hours and 48 hours prior to scheduled check-in.',
      'Late Cancellation (Tier 3): 0% refund (cancellation fee equals 100% of the first night or booking amount) if cancelled less than 24 hours before check-in or on no-show.',
      'Refund Processing: Approved refunds are automatically credited back to the original payment source (UPI, Credit/Debit Card, or NetBanking) via Razorpay within 5 to 7 business days.',
      'Management Discretion: Hotel management and admin hold the authority to approve emergency 100% waivers for medical emergencies upon supporting documentation.'
    ],
    roleAccess: ['customer', 'management', 'admin']
  },
  {
    id: 'policy-kyc',
    category: 'identity_kyc',
    title: 'Government Identity & KYC Verification',
    summary: 'Valid Indian Government ID (UIDAI Aadhaar Card or Income Tax PAN Card) is required for all guests at check-in or profile completion.',
    details: [
      'Accepted Identity Documents: UIDAI Aadhaar Card (12 digits) or Indian Income Tax PAN Card (10 alphanumeric characters).',
      'Aadhaar Validation: Exactly 12 numerical digits (/^\\d{12}$/). Only last 4 digits are visible in public views for privacy.',
      'PAN Validation: Exactly 10 characters (/^[A-Z]{5}[0-9]{4}[A-Z]$/). Automatic uppercase formatting.',
      'Privacy & Encryption: Guest identity document numbers and uploaded scans are stored in private secure cloud storage with restricted access.',
      'OCR Address Auto-Fill: Guest profiles support AI OCR extraction to automatically populate permanent address fields from Aadhaar cards. PAN cards do not contain residential addresses and will prompt manual address entry.',
      'Physical Check-In: Primary guest must present original physical ID or DigiLocker verification at the front desk upon arrival.'
    ],
    roleAccess: ['customer', 'management', 'admin']
  },
  {
    id: 'policy-pricing',
    category: 'pricing_tax',
    title: 'Tariff, GST Taxes & Payment Methods',
    summary: 'Transparent pricing in Indian Rupees (INR ₹) with GST compliance and 100% secure Razorpay payment processing.',
    details: [
      'Currency: All room rates, meals, and extra charges are denominated in Indian Rupees (INR ₹).',
      'Goods & Services Tax (GST): Indian hospitality tax applies at 12% for room tariffs up to ₹7,500/night and 18% for luxury suites above ₹7,500/night.',
      'Accepted Payment Methods: UPI (Google Pay, PhonePe, Paytm, BHIM), Credit Cards (Visa, MasterCard, RuPay, Amex), Debit Cards, and NetBanking via Secure Payment Gateway.',
      'Security Guarantee: 256-bit TLS encryption. Card credentials or banking passwords are never stored on Naidu Hotel servers.',
      'Security Deposit: No incidental security deposit is collected at check-in for pre-paid online reservations.'
    ],
    roleAccess: ['customer', 'management', 'admin']
  },
  {
    id: 'policy-occupancy',
    category: 'occupancy_child',
    title: 'Room Capacity, Children & Extra Bedding',
    summary: 'Children under 6 stay free with existing bedding. Extra rollout beds available upon request.',
    details: [
      'Single Sharing Room: Maximum 1 adult. 1 Single Bed.',
      'Double Sharing Room: Maximum 2 adults + 1 child under 6. Queen or Twin beds.',
      'Triple Sharing Room: Maximum 3 adults + 1 child. 3 Single beds or 1 King + 1 Single.',
      'Deluxe Ocean View: Maximum 2 adults + 1 child. 1 King Bed with panoramic ocean balcony.',
      'Executive Business Suite: Maximum 3 adults. 1 King Bed + 1 Ergonomic Sofa Bed.',
      'Premier Garden Villa: Maximum 3 adults. 1 California King bed with private plunge pool.',
      'Luxury Presidential Penthouse: Maximum 4 adults + 2 children. 2 King beds, butler dining salon.',
      'Child Policy: Children aged 0–6 stay complimentary using existing parent bedding.',
      'Extra Bed Charge: ₹750 + GST per night, including complimentary breakfast.'
    ],
    roleAccess: ['customer', 'management', 'admin']
  },
  {
    id: 'policy-amenities',
    category: 'amenities_services',
    title: 'Hotel Amenities & Guest Services',
    summary: 'Complimentary 1Gbps Wi-Fi, infinity pool, fitness center, multi-cuisine dining, and 24/7 guest concierge.',
    details: [
      'High-Speed Wi-Fi: Complimentary 1Gbps fiber broadband across all suites, villas, and public hotel spaces.',
      'Infinity Pool: Located on the 4th floor overlooking the ocean, open daily from 6:00 AM to 10:00 PM.',
      'Coast & Spice Restaurant: Multi-cuisine coastal specialty dining open 6:30 AM to 11:00 PM. Complimentary breakfast buffet: 6:30 AM – 10:30 AM.',
      'In-Room Dining: 24/7 room service available by dialing Ext 0 or via the guest portal.',
      'Fitness Gymnasium: 24/7 access on Floor 3 with certified trainers on duty 7:00 AM to 7:00 PM.',
      'Valet Parking: Complimentary secure on-site parking for all staying guests.',
      'Airport Chauffeur Transfer: Available on prior reservation (complimentary for Presidential Penthouse and Premier Garden Villa guests).'
    ],
    roleAccess: ['customer', 'management', 'admin']
  },
  {
    id: 'policy-houserules',
    category: 'house_rules',
    title: 'House Rules & Code of Conduct',
    summary: '100% non-smoking inside suites, designated garden smoking gazebos, quiet hours between 10:00 PM and 7:00 AM.',
    details: [
      'Non-Smoking Policy: All indoor guest rooms, suites, and indoor public lounges are strictly 100% smoke-free. Designated outdoor smoking lounges are available in the courtyard.',
      'Quiet Hours: 10:00 PM to 7:00 AM daily to guarantee peaceful relaxation for all guests.',
      'Pet Policy: Pets are not permitted on hotel property, with the exception of certified service and guide animals.',
      'Visitors: Non-registered visitors are welcome in the lobby and dining areas until 9:00 PM.'
    ],
    roleAccess: ['customer', 'management', 'admin']
  },
  {
    id: 'policy-support',
    category: 'contact_support',
    title: 'Front Desk & Concierge Contact',
    summary: '24/7 on-site guest support team and executive desk.',
    details: [
      'Front Desk Reception: 24 hours a day, 7 days a week.',
      'Direct Telephone: +91 98765 43210 (or Dial 0 from any room).',
      'Concierge Email: reservations@naiduhotel.com / concierge@naiduhotel.com',
      'Address: Naidu Luxury Hotel & Resort, Beach Road Marine Drive, Visakhapatnam, Andhra Pradesh 530003, India.'
    ],
    roleAccess: ['customer', 'management', 'admin']
  }
];

// ==============================================================================
// 2. REAL-TIME ROOM AVAILABILITY & PRICING TYPES
// ==============================================================================

export interface RoomAvailabilityQuery {
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  guests?: number;
  roomTypeId?: string;
}

export interface RoomTypeAvailability {
  roomTypeId: string;
  name: string;
  code: string;
  description: string;
  capacity: number;
  basePricePerNight: number;
  totalNights: number;
  subtotal: number;
  gstTax: number;
  totalPayable: number;
  totalInventory: number;
  physicalRoomsCount: number;
  maintenanceCount: number;
  overlappingBookingsCount: number;
  availableRoomsCount: number;
  isAvailable: boolean;
  availabilityStatus: 'Available' | 'Limited (1-2 left)' | 'Sold Out';
  amenities: string[];
  bedType: string;
  sizeSqFt: number;
}

export interface RealtimeAvailabilityReport {
  checkIn: string;
  checkOut: string;
  nights: number;
  requestedGuests: number;
  timestamp: string;
  dataSource: 'supabase' | 'cache_fallback';
  totalRoomsInHotel: number;
  totalAvailableRoomsForDates: number;
  roomTypes: RoomTypeAvailability[];
  recommendedRoomType?: RoomTypeAvailability;
  summaryText: string;
}

// ==============================================================================
// 3. DATE UTILITIES & OVERLAP CALCULATION
// ==============================================================================

export function calculateNights(checkInStr: string, checkOutStr: string): number {
  try {
    const start = new Date(checkInStr);
    const end = new Date(checkOutStr);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  } catch {
    return 1;
  }
}

/**
 * Checks whether two date ranges [inA, outA] and [inB, outB] overlap.
 * Standard hotel rule: checkout date on day X does not conflict with checkin on day X.
 * Overlap condition: inA < outB && outA > inB
 */
export function isDateRangeOverlapping(
  inA: string,
  outA: string,
  inB: string,
  outB: string
): boolean {
  if (!inA || !outA || !inB || !outB) return false;
  const startA = new Date(inA).getTime();
  const endA = new Date(outA).getTime();
  const startB = new Date(inB).getTime();
  const endB = new Date(outB).getTime();
  return startA < endB && endA > startB;
}

// ==============================================================================
// 4. CORE RAG SERVICE LAYER: AGGREGATE REAL-TIME AVAILABILITY FROM SUPABASE
// ==============================================================================

export class RagKnowledgeService {
  /**
   * Retrieves all hotel policies, optionally filtered by role and category.
   */
  public static getPolicies(
    role: 'customer' | 'management' | 'admin' = 'customer',
    category?: HotelPolicySection['category']
  ): HotelPolicySection[] {
    return HOTEL_POLICIES.filter(policy => {
      const hasRoleAccess = policy.roleAccess.includes(role);
      const matchesCategory = category ? policy.category === category : true;
      return hasRoleAccess && matchesCategory;
    });
  }

  /**
   * Queries real-time room types, physical rooms, and active bookings from Supabase
   * to compute exact date-specific availability and pricing for each room type.
   */
  public static async getRealtimeAvailability(
    query: RoomAvailabilityQuery
  ): Promise<RealtimeAvailabilityReport> {
    const todayStr = new Date().toISOString().split('T')[0];
    const checkIn = query.checkIn || todayStr;
    const defaultCheckOut = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const checkOut = query.checkOut || defaultCheckOut;
    const guests = query.guests && query.guests > 0 ? query.guests : 2;
    const nights = calculateNights(checkIn, checkOut);

    let roomTypesData: RoomType[] = [];
    let physicalRoomsData: Room[] = [];
    let bookingsData: Booking[] = [];
    let dataSource: 'supabase' | 'cache_fallback' = 'cache_fallback';

    // 1. Fetch real-time data from Supabase
    try {
      if (isSupabaseConfigured) {
        const [rt, rm, bkg] = await Promise.all([
          fetchRoomTypesFromDatabase(),
          fetchRoomsFromDatabase(),
          fetchAllBookingsFromDatabase()
        ]);

        if (rt.length > 0) {
          roomTypesData = rt;
          physicalRoomsData = rm;
          bookingsData = bkg;
          dataSource = 'supabase';
        }
      }
    } catch (err) {
      console.warn('RAG Service: Falling back to local cache for availability calculation:', err);
    }

    // Fallbacks if remote was empty or unreachable
    if (roomTypesData.length === 0) {
      roomTypesData = getStoredRoomTypes().length > 0 ? getStoredRoomTypes() : INITIAL_ROOM_TYPES;
    }
    if (physicalRoomsData.length === 0) {
      physicalRoomsData = getStoredRooms().length > 0 ? getStoredRooms() : INITIAL_ROOMS;
    }
    if (bookingsData.length === 0) {
      bookingsData = getStoredBookings();
    }

    // 2. Filter active bookings that overlap with requested [checkIn, checkOut]
    const activeBookings = bookingsData.filter(b => {
      const isConfirmed = b.status === 'Confirmed' || b.status === 'Checked-In';
      if (!isConfirmed) return false;
      return isDateRangeOverlapping(checkIn, checkOut, b.checkIn, b.checkOut);
    });

    // 3. Compute availability per Room Type
    let totalHotelRooms = 0;
    let totalAvailableRooms = 0;

    const availabilityList: RoomTypeAvailability[] = roomTypesData.map(rt => {
      // Find all physical rooms configured for this room type
      const associatedRooms = physicalRoomsData.filter(
        r => r.roomTypeId === rt.id || r.roomTypeName?.toLowerCase() === rt.name.toLowerCase()
      );
      const physicalCount = associatedRooms.length > 0 ? associatedRooms.length : (rt.totalInventory || 5);
      totalHotelRooms += physicalCount;

      // Count rooms currently in maintenance
      const maintenanceCount = associatedRooms.filter(r => r.status === 'Maintenance').length;

      // Count active overlapping bookings for this room type
      const overlappingBookings = activeBookings.filter(
        b => b.roomTypeId === rt.id || b.roomTypeName?.toLowerCase() === rt.name.toLowerCase()
      );
      const overlappingCount = overlappingBookings.length;

      // Effective available count
      const availableRoomsCount = Math.max(0, physicalCount - overlappingCount - maintenanceCount);
      totalAvailableRooms += availableRoomsCount;

      const isAvailable = availableRoomsCount > 0;
      let availabilityStatus: 'Available' | 'Limited (1-2 left)' | 'Sold Out' = 'Sold Out';
      if (availableRoomsCount > 2) {
        availabilityStatus = 'Available';
      } else if (availableRoomsCount > 0) {
        availabilityStatus = 'Limited (1-2 left)';
      }

      // Calculate pricing & GST (12% for <= 7500, 18% for > 7500)
      const subtotal = rt.basePrice * nights;
      const gstRate = rt.basePrice > 7500 ? 0.18 : 0.12;
      const gstTax = Math.round(subtotal * gstRate);
      const totalPayable = subtotal + gstTax;

      return {
        roomTypeId: rt.id,
        name: rt.name,
        code: rt.code,
        description: rt.description,
        capacity: rt.capacity,
        basePricePerNight: rt.basePrice,
        totalNights: nights,
        subtotal,
        gstTax,
        totalPayable,
        totalInventory: rt.totalInventory || physicalCount,
        physicalRoomsCount: physicalCount,
        maintenanceCount,
        overlappingBookingsCount: overlappingCount,
        availableRoomsCount,
        isAvailable,
        availabilityStatus,
        amenities: rt.amenities || [],
        bedType: rt.bedType || `${rt.capacity} Guests`,
        sizeSqFt: rt.sizeSqFt || 400
      };
    });

    // If specific room type was requested, sort it first
    if (query.roomTypeId) {
      availabilityList.sort((a, b) => (a.roomTypeId === query.roomTypeId ? -1 : 1));
    }

    // Determine recommended room type based on guest count and availability
    const eligibleRooms = availabilityList.filter(r => r.isAvailable && r.capacity >= guests);
    const recommendedRoomType = eligibleRooms.length > 0
      ? eligibleRooms.sort((a, b) => a.basePricePerNight - b.basePricePerNight)[0]
      : availabilityList.find(r => r.isAvailable);

    // Natural language summary for RAG injection
    const availableCount = availabilityList.filter(r => r.isAvailable).length;
    const summaryText = availableCount > 0
      ? `For ${checkIn} to ${checkOut} (${nights} night${nights > 1 ? 's' : ''}, ${guests} guest${guests > 1 ? 's' : ''}), ${availableCount} of ${availabilityList.length} room categories have real-time vacancies at Naidu Hotel. Prices start from ₹${Math.min(...availabilityList.filter(r => r.isAvailable).map(r => r.basePricePerNight))}/night.`
      : `All room categories are currently fully committed for the dates ${checkIn} to ${checkOut}. Please consider shifting your arrival by 1-2 days.`;

    return {
      checkIn,
      checkOut,
      nights,
      requestedGuests: guests,
      timestamp: new Date().toISOString(),
      dataSource,
      totalRoomsInHotel: totalHotelRooms,
      totalAvailableRoomsForDates: totalAvailableRooms,
      roomTypes: availabilityList,
      recommendedRoomType,
      summaryText
    };
  }

  /**
   * Builds a tailored RAG context block for the specified user role:
   * - Customer: Real-time availability, room features, pricing, policies, customer's personal bookings.
   * - Management: Real-time room status, today's check-ins/outs, occupancy rate, housekeeping.
   * - Admin: Complete inventory, revenue KPIs, cancellation risk analysis, system audit.
   */
  public static async getRoleRAGContext(
    role: 'customer' | 'management' | 'admin',
    options?: {
      customerId?: string;
      customerEmail?: string;
      checkIn?: string;
      checkOut?: string;
      guests?: number;
      query?: string;
    }
  ): Promise<{
    role: string;
    systemPrompt: string;
    groundedContextText: string;
    realtimeAvailability?: RealtimeAvailabilityReport;
    policies: HotelPolicySection[];
    operationalMetrics?: any;
  }> {
    const todayStr = new Date().toISOString().split('T')[0];
    const checkIn = options?.checkIn || todayStr;
    const defaultCheckOut = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const checkOut = options?.checkOut || defaultCheckOut;
    const guests = options?.guests || 2;

    // 1. Compute real-time availability
    const availability = await this.getRealtimeAvailability({
      checkIn,
      checkOut,
      guests
    });

    // 2. Fetch role-permitted policies
    const policies = this.getPolicies(role);

    // 3. Assemble grounded context text based on role
    let groundedContextText = '';
    let operationalMetrics: any = undefined;

    // Common header for all roles
    groundedContextText += `### HOTEL PROFILE & CURRENT OPERATING DATA\n`;
    groundedContextText += `- Property Name: Naidu Luxury Hotel & Resort\n`;
    groundedContextText += `- Today's Date: ${todayStr}\n`;
    groundedContextText += `- Property Address: Beach Road Marine Drive, Visakhapatnam, Andhra Pradesh 530003, India\n`;
    groundedContextText += `- 24/7 Front Desk: +91 98765 43210 | concierge@naiduhotel.com\n\n`;

    // Real-Time Room Availability Ground Truth
    groundedContextText += `### REAL-TIME ROOM INVENTORY & AVAILABILITY (DATES: ${checkIn} to ${checkOut})\n`;
    groundedContextText += `Total Rooms in Hotel: ${availability.totalRoomsInHotel} | Available Rooms: ${availability.totalAvailableRoomsForDates}\n`;
    availability.roomTypes.forEach(rt => {
      groundedContextText += `- [${rt.isAvailable ? 'AVAILABLE' : 'SOLD OUT'}] ${rt.name} (${rt.code}): ₹${rt.basePricePerNight}/night. Capacity: ${rt.capacity} guests. Bed: ${rt.bedType}. Available: ${rt.availableRoomsCount} rooms. Total for ${rt.totalNights} night(s) with GST: ₹${rt.totalPayable}. Amenities: ${rt.amenities.slice(0, 4).join(', ')}.\n`;
    });
    groundedContextText += `\n`;

    // Hotel Policies
    groundedContextText += `### OFFICIAL HOTEL POLICIES\n`;
    policies.forEach(p => {
      groundedContextText += `#### ${p.title}\n`;
      p.details.forEach(d => {
        groundedContextText += `- ${d}\n`;
      });
      groundedContextText += `\n`;
    });

    // =========================================================================
    // ROLE SPECIFIC EXPANSIONS & SECURITY GUARDS
    // =========================================================================

    if (role === 'customer') {
      // Customer specific context: only their own bookings, NO management or revenue secrets
      groundedContextText += `### CUSTOMER CONCIERGE & PERSONAL RESERVATION DATA\n`;
      let userBookings: Booking[] = [];

      if (options?.customerId) {
        try {
          userBookings = await fetchCustomerBookingsFromDatabase(options.customerId);
        } catch {
          userBookings = getStoredBookings().filter(b => b.customerId === options.customerId);
        }
      } else if (options?.customerEmail) {
        userBookings = getStoredBookings().filter(b => b.customerEmail?.toLowerCase() === options.customerEmail?.toLowerCase());
      }

      if (userBookings.length > 0) {
        groundedContextText += `The current logged-in guest has ${userBookings.length} booking record(s):\n`;
        userBookings.forEach((b, idx) => {
          groundedContextText += `${idx + 1}. Reference: ${b.bookingReference || b.id} | Suite: ${b.roomTypeName} | Room: ${b.roomNumber || 'Assigned at Check-In'} | Dates: ${b.checkIn} to ${b.checkOut} (${b.nights} nights) | Status: ${b.status} | Payment: ${b.paymentStatus || 'Paid'} (₹${b.totalAmount}) | Guests: ${b.guests}.\n`;
        });
      } else {
        groundedContextText += `No existing bookings found for this customer. They can choose any available suite above and proceed to checkout.\n`;
      }

      const systemPrompt = `You are the AI Concierge for Naidu Luxury Hotel & Resort.
Your job is to provide warm, courteous, and highly accurate assistance to our guests.
Ground Rules:
1. Grounding: Rely strictly on the provided real-time room availability, prices, and hotel policies. Never invent prices or rooms that do not exist.
2. Room Queries: When asked about room availability, state clearly which suites are available for the requested dates, mention their nightly rates in INR (₹), capacity, and key amenities. Mention the 12% to 18% GST rules accurately.
3. Cancellation & Refunds: State the 48-hour free cancellation policy (100% refund), 24-48 hours (50% refund), and <24 hours (non-refundable). Mention that refunds take 5-7 business days via Razorpay.
4. Identity/KYC: Inform guests that a valid UIDAI Aadhaar Card (12 digits) or PAN Card (10 characters) is required for guest registration.
5. Privacy Boundary: NEVER expose other guests' names, internal hotel revenue figures, staff accounts, or system secrets. Keep all answers focused on the guest's stay.`;

      return {
        role: 'customer',
        systemPrompt,
        groundedContextText,
        realtimeAvailability: availability,
        policies
      };
    }

    if (role === 'management') {
      // Management specific operational context: today's arrivals, room status, occupancy
      const allBookings = getStoredBookings();
      const allRooms = getStoredRooms().length > 0 ? getStoredRooms() : INITIAL_ROOMS;

      const todaysArrivals = allBookings.filter(b => b.checkIn === todayStr && b.status === 'Confirmed');
      const todaysDepartures = allBookings.filter(b => b.checkOut === todayStr && b.status === 'Checked-In');
      const occupiedRooms = allRooms.filter(r => r.status === 'Occupied');
      const maintenanceRooms = allRooms.filter(r => r.status === 'Maintenance');
      const availableRooms = allRooms.filter(r => r.status === 'Available');
      const occupancyRate = allRooms.length > 0 ? Math.round((occupiedRooms.length / allRooms.length) * 100) : 78;

      operationalMetrics = {
        todaysArrivalsCount: todaysArrivals.length,
        todaysDeparturesCount: todaysDepartures.length,
        occupiedRoomsCount: occupiedRooms.length,
        maintenanceRoomsCount: maintenanceRooms.length,
        availableRoomsCount: availableRooms.length,
        occupancyRate: `${occupancyRate}%`
      };

      groundedContextText += `### FRONT DESK & HOUSEKEEPING OPERATIONS\n`;
      groundedContextText += `- Current Occupancy: ${occupancyRate}% (${occupiedRooms.length}/${allRooms.length} rooms occupied)\n`;
      groundedContextText += `- Rooms under Maintenance: ${maintenanceRooms.length} (${maintenanceRooms.map(r => r.roomNumber).join(', ') || 'None'})\n`;
      groundedContextText += `- Expected Check-Ins Today (${todayStr}): ${todaysArrivals.length} arrival(s).\n`;
      todaysArrivals.slice(0, 5).forEach(b => {
        groundedContextText += `  * ${b.customerName} - ${b.roomTypeName} (${b.bookingReference || b.id}) - Nights: ${b.nights}\n`;
      });
      groundedContextText += `- Expected Check-Outs Today (${todayStr}): ${todaysDepartures.length} departure(s).\n`;
      todaysDepartures.slice(0, 5).forEach(b => {
        groundedContextText += `  * ${b.customerName} - Room ${b.roomNumber} (${b.bookingReference || b.id})\n`;
      });
      groundedContextText += `\n`;

      const systemPrompt = `You are the Hotel Operations AI Assistant for Naidu Hotel Management.
Your job is to assist duty managers, front desk supervisors, and housekeeping staff.
Ground Rules:
1. Operational Focus: Help management track room turnarounds, check-in rushes, maintenance blocks, and guest allocation.
2. Availability & Overbooking: Use the real-time Supabase inventory to confirm whether walk-ins or date alterations can be accommodated.
3. Policy Enforcement: Guide staff on cancellation waiver requests, ID document compliance (Aadhaar/PAN), and late check-out handling.
4. Tone: Professional, crisp, and operationally decisive.`;

      return {
        role: 'management',
        systemPrompt,
        groundedContextText,
        realtimeAvailability: availability,
        policies,
        operationalMetrics
      };
    }

    // Role: Admin
    const allBookings = getStoredBookings();
    const confirmedBookings = allBookings.filter(b => b.status === 'Confirmed' || b.status === 'Checked-In');
    const highRiskBookings = allBookings.filter(b => b.cancellationRisk === 'HIGH' && b.status === 'Confirmed');
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const averageAdr = confirmedBookings.length > 0 ? Math.round(totalRevenue / confirmedBookings.length) : 342;

    operationalMetrics = {
      ...ANALYTICS_DATA.adminKpis,
      totalBookingsCount: allBookings.length,
      confirmedBookingsCount: confirmedBookings.length,
      highRiskCount: highRiskBookings.length,
      totalRevenueINR: totalRevenue,
      averageAdr,
    };

    groundedContextText += `### EXECUTIVE & REVENUE INTELLIGENCE (ADMIN VIEW)\n`;
    groundedContextText += `- Total System Bookings: ${allBookings.length}\n`;
    groundedContextText += `- Total Confirmed Revenue: ₹${totalRevenue.toLocaleString('en-IN')}\n`;
    groundedContextText += `- Average Daily Rate (ADR): ₹${averageAdr}\n`;
    groundedContextText += `- Machine Learning Cancellation Risk: ${highRiskBookings.length} booking(s) currently flagged as HIGH RISK.\n`;
    highRiskBookings.slice(0, 4).forEach(b => {
      groundedContextText += `  * Ref ${b.bookingReference || b.id}: ${b.customerName} (${b.roomTypeName}, ₹${b.totalAmount}, Lead time: ${b.leadTimeDays || 14} days)\n`;
    });
    groundedContextText += `- Cancellation Prevention Strategy: Recommend automated confirmation SMS, flexible rescheduling incentives, or deposit verification for online TA segments.\n\n`;

    const systemPrompt = `You are the Executive AI Strategic Advisor for Naidu Luxury Hotel & Resort System Administrators.
Your job is to provide high-level business intelligence, revenue optimization, risk management, and system auditing insights.
Ground Rules:
1. Holistic Visibility: You have full access to real-time inventory, financial metrics, ADR, ML cancellation risk scores, and staff governance.
2. Decision Support: Recommend dynamic pricing adjustments, marketing segment priorities (e.g. promoting Direct vs high-cancellation Online TAs), and operational efficiencies.
3. Precise Figures: Reference real numbers from the grounded context.
4. Tone: Strategic, analytical, and executive-ready.`;

    return {
      role: 'admin',
      systemPrompt,
      groundedContextText,
      realtimeAvailability: availability,
      policies,
      operationalMetrics
    };
  }

  /**
   * Fast keyword & intent search over the knowledge base chunks
   * to extract only the most relevant policies or room details for a specific query.
   */
  public static searchKnowledgeBase(
    userQuery: string,
    role: 'customer' | 'management' | 'admin' = 'customer'
  ): {
    matchedPolicies: HotelPolicySection[];
    relevantRoomTypes: RoomType[];
    topContextSummary: string;
  } {
    const q = userQuery.toLowerCase();
    const rolePolicies = this.getPolicies(role);

    // Score policies by keyword overlap
    const scoredPolicies = rolePolicies.map(p => {
      let score = 0;
      const combinedText = `${p.title} ${p.summary} ${p.details.join(' ')}`.toLowerCase();
      const keywords = q.split(/\s+/).filter(w => w.length > 2);
      keywords.forEach(kw => {
        if (combinedText.includes(kw)) score += 2;
      });
      if (q.includes('cancel') && p.category === 'cancellation_refund') score += 10;
      if (q.includes('refund') && p.category === 'cancellation_refund') score += 10;
      if (q.includes('check in') || q.includes('check out') || q.includes('time')) {
        if (p.category === 'check_in_out') score += 10;
      }
      if (q.includes('aadhaar') || q.includes('pan') || q.includes('id') || q.includes('kyc') || q.includes('document')) {
        if (p.category === 'identity_kyc') score += 10;
      }
      if (q.includes('wifi') || q.includes('pool') || q.includes('spa') || q.includes('food') || q.includes('gym')) {
        if (p.category === 'amenities_services') score += 10;
      }
      if (q.includes('price') || q.includes('cost') || q.includes('tax') || q.includes('gst') || q.includes('pay')) {
        if (p.category === 'pricing_tax') score += 10;
      }
      return { policy: p, score };
    });

    const matchedPolicies = scoredPolicies
      .filter(sp => sp.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(sp => sp.policy);

    // Filter relevant room types
    const storedRoomTypes = getStoredRoomTypes().length > 0 ? getStoredRoomTypes() : INITIAL_ROOM_TYPES;
    const relevantRoomTypes = storedRoomTypes.filter(rt => {
      const rtText = `${rt.name} ${rt.description} ${rt.amenities.join(' ')}`.toLowerCase();
      return (
        q.includes(rt.name.toLowerCase()) ||
        q.includes(rt.code.toLowerCase()) ||
        (q.includes('ocean') && rtText.includes('ocean')) ||
        (q.includes('villa') && rtText.includes('villa')) ||
        (q.includes('suite') && rtText.includes('suite')) ||
        (q.includes('single') && rtText.includes('single')) ||
        (q.includes('double') && rtText.includes('double')) ||
        (q.includes('triple') && rtText.includes('triple')) ||
        (q.includes('cheap') && rt.basePrice < 2000) ||
        (q.includes('luxury') && rt.basePrice >= 5000)
      );
    });

    const topContextSummary = `Found ${matchedPolicies.length} policy sections and ${relevantRoomTypes.length} room matches.`;

    return {
      matchedPolicies: matchedPolicies.length > 0 ? matchedPolicies : rolePolicies.slice(0, 3),
      relevantRoomTypes: relevantRoomTypes.length > 0 ? relevantRoomTypes : storedRoomTypes,
      topContextSummary
    };
  }
}
