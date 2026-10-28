export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type BookingStatus = 'Confirmed' | 'Checked-In' | 'Checked-Out' | 'Cancelled';

export type RoomStatus = 'Available' | 'Occupied' | 'Maintenance';

export interface RoomType {
  id: string;
  name: string;
  code: string;
  description: string;
  capacity: number;
  basePrice: number;
  amenities: string[];
  status: 'Active' | 'Inactive';
  totalInventory: number;
  sizeSqFt: number;
  bedType: string;
  imageTheme: string;
}

export interface Room {
  id: string;
  roomNumber: string;
  roomTypeId: string;
  roomTypeName: string;
  floor: number;
  price: number;
  status: RoomStatus;
  currentGuest?: string;
  lastCleaned?: string;
}

export interface Booking {
  id: string;
  bookingReference?: string;
  customerId?: string;
  customerCode?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAge?: number;
  customerGender?: string;
  customerAddress?: string;
  customerCity?: string;
  customerState?: string;
  customerCountry?: string;
  customerPostalCode?: string;
  customerAddress2?: string;
  aadharNumber?: string;
  idProofType?: string;
  idProofNumber?: string;
  aadharDocumentName?: string;
  aadharDocumentData?: string;
  idDocumentName?: string;
  idDocumentData?: string;
  ocrStatus?: string;
  purposeOfVisit?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  roomTypeId: string;
  roomTypeName: string;
  roomId?: string;
  roomNumber?: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  adr: number;
  totalAmount: number;
  status: BookingStatus;
  paymentStatus?: 'Pending' | 'Paid' | 'Refunded' | 'Failed';
  paymentMethod?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  paymentVerifiedAt?: string;
  cancellationProbability: number; // 0-100%
  cancellationRisk: RiskLevel;
  leadTimeDays: number;
  marketSegment: 'Online TA' | 'Direct' | 'Corporate' | 'Groups' | 'Offline TA';
  depositType: 'No Deposit' | 'Non Refundable' | 'Refundable';
  createdAt: string;
  specialRequests?: string;
}

export interface Customer {
  id: string; // UUID references auth.users(id)
  customerCode?: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  age?: number;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  aadharNumber?: string;
  idProofType?: string;
  idProofNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  totalBookings: number;
  cancelledBookings: number;
  totalSpend: number;
  vipStatus: boolean;
  memberSince: string;
  lastBookingDate: string;
}

export interface ManagementUser {
  id: string;
  fullName: string;
  email: string;
  status: 'Active' | 'Suspended';
  createdAt: string;
  lastLogin: string;
  department: string;
}

export interface AiInsight {
  id: string;
  title: string;
  category: 'Cancellation Risk' | 'Revenue Opportunity' | 'Occupancy Trend' | 'Room Demand' | 'Customer Behavior';
  impact: 'HIGH' | 'MEDIUM' | 'INFO';
  metric: string;
  description: string;
  recommendation: string;
  date: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'alert' | 'booking' | 'system' | 'ai';
  read: boolean;
}
