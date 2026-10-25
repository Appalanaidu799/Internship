import React, { useState, useEffect } from 'react';
import { RoomType } from '../../types/hotel';
import { Modal } from '../common/Modal';
import { useHotel } from '../../context/HotelContext';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  Users,
  DollarSign,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  Clock,
  HeartPulse,
  Building2,
  BedDouble
} from 'lucide-react';

interface CustomerBookingModalProps {
  roomType: RoomType | null;
  isOpen: boolean;
  onClose: () => void;
  defaultCheckIn?: string;
  defaultCheckOut?: string;
  defaultGuests?: number;
}

export const CustomerBookingModal: React.FC<CustomerBookingModalProps> = ({
  roomType,
  isOpen,
  onClose,
  defaultCheckIn = '2026-10-25',
  defaultCheckOut = '2026-10-28',
  defaultGuests = 2
}) => {
  const { createCustomerBooking } = useHotel();
  const { user, customerProfile } = useAuth();

  // Stay Dates & Guest Capacity
  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);
  const [guests, setGuests] = useState(defaultGuests);
  const [specialRequests, setSpecialRequests] = useState('');

  // Primary Guest Personal Identity
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState<number | ''>(28);
  const [gender, setGender] = useState('Male');

  // KYC & Identification Proof
  const [idProofType, setIdProofType] = useState('Aadhar Card');
  const [idProofNumber, setIdProofNumber] = useState('');

  // Residential Address
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');

  // Hotel Stay Purpose & Safety Contacts
  const [purposeOfVisit, setPurposeOfVisit] = useState('Leisure / Vacation');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // State flags
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<{
    reference: string;
    customerCode: string;
    customerName: string;
    phone: string;
    aadhar: string;
    roomTypeName: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    guests: number;
    totalAmount: number;
  } | null>(null);

  // Initialize guest defaults from authenticated profile or user
  useEffect(() => {
    if (isOpen) {
      setFullName(customerProfile?.full_name || user?.fullName || 'Bhaskar Gorli');
      setPhone(customerProfile?.phone || user?.phone || '+91 98765 43210');
      setEmail(customerProfile?.email || user?.email || 'bhaskar.gorli@gmail.com');
      if (customerProfile?.age) {
        setAge(customerProfile.age);
      } else {
        setAge(28);
      }
      setGender(customerProfile?.gender || 'Male');
      setAddress(customerProfile?.address_line || 'Door No. 12-4-5, Beach Road');
      setCity(customerProfile?.city || 'Visakhapatnam');
      setState(customerProfile?.state || 'Andhra Pradesh');
      setPostalCode(customerProfile?.postal_code || '530002');
      setCountry(customerProfile?.country || 'India');
      setIdProofType(customerProfile?.id_proof_type || 'Aadhar Card');
      setIdProofNumber(customerProfile?.aadhar_number || customerProfile?.id_proof_number || '4521 8934 7612');
      setEmergencyContactName(customerProfile?.emergency_contact_name || 'Ravi Gorli');
      setEmergencyContactPhone(customerProfile?.emergency_contact_phone || '+91 99887 66554');
    }
  }, [isOpen, user, customerProfile]);

  if (!roomType) return null;

  // Calculate nights and dynamic folio
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  const diffTime = Math.max(d2.getTime() - d1.getTime(), 1000 * 3600 * 24);
  const nights = Math.max(Math.ceil(diffTime / (1000 * 3600 * 24)), 1);
  const totalAmount = roomType.basePrice * nights;
  const taxes = Math.round(totalAmount * 0.12);
  const finalTotal = totalAmount + taxes;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');

    if (!fullName.trim()) {
      setBookingError('Please enter primary guest full name.');
      return;
    }

    if (!phone.trim()) {
      setBookingError('Please enter a valid contact phone / mobile number.');
      return;
    }

    if (!idProofNumber.trim()) {
      setBookingError(`Please provide valid ${idProofType} number for hotel check-in compliance.`);
      return;
    }

    if (!age || Number(age) < 18) {
      setBookingError('Primary guest must be at least 18 years old to reserve a room.');
      return;
    }

    if (!address.trim() || !city.trim()) {
      setBookingError('Please provide complete residential street address and city.');
      return;
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
      setBookingError('Check-out date must be strictly after check-in date.');
      return;
    }

    if (guests > roomType.capacity) {
      setBookingError(`Guest limit exceeded. This room accommodates up to ${roomType.capacity} guests.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createCustomerBooking({
        roomTypeId: roomType.id,
        roomTypeName: roomType.name,
        checkIn,
        checkOut,
        guests,
        nights,
        adr: roomType.basePrice,
        specialRequests,
        customerName: fullName.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim(),
        customerAge: Number(age),
        customerGender: gender,
        customerAddress: address.trim(),
        customerCity: city.trim(),
        customerState: state.trim(),
        customerPostalCode: postalCode.trim(),
        customerCountry: country.trim() || 'India',
        aadharNumber: idProofNumber.trim(),
        idProofType,
        idProofNumber: idProofNumber.trim(),
        purposeOfVisit,
        emergencyContactName: emergencyContactName.trim(),
        emergencyContactPhone: emergencyContactPhone.trim()
      });

      setConfirmedBooking({
        reference: created.bookingReference || created.id,
        customerCode: created.customerCode || customerProfile?.customer_code || 'CUS-NAIDU001',
        customerName: created.customerName,
        phone: created.customerPhone || phone,
        aadhar: created.aadharNumber || idProofNumber,
        roomTypeName: created.roomTypeName,
        checkIn: created.checkIn,
        checkOut: created.checkOut,
        nights: created.nights,
        guests: created.guests,
        totalAmount: created.totalAmount
      });

      setIsSuccess(true);
    } catch (err: any) {
      setBookingError(err?.message || 'Failed to complete reservation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setBookingError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isSuccess ? 'Reservation Confirmed & Saved' : `Reserve ${roomType.name}`}
      subtitle={
        isSuccess
          ? 'Your booking details and guest verification are securely registered in Supabase.'
          : 'Complete guest KYC verification and stay details for hotel check-in compliance.'
      }
      maxWidth="xl"
      footer={
        isSuccess ? (
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Data Synced to Supabase Database</span>
            </span>
            <button
              onClick={handleClose}
              className="py-2.5 px-6 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
            >
              Done & View In My Bookings
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="text-left">
              <span className="text-[11px] text-slate-500 block">Total Estimated Folio:</span>
              <span className="text-base font-bold font-mono text-blue-700">${finalTotal}</span>
              <span className="text-[10px] text-slate-400 ml-1.5 font-normal">
                ({nights} {nights === 1 ? 'night' : 'nights'} · incl. 12% taxes)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleClose}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirm}
                className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs disabled:opacity-50 inline-flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving to Supabase...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm & Book Stay (${finalTotal})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )
      }
    >
      {isSuccess && confirmedBooking ? (
        <div className="py-2 space-y-4">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-4 ring-emerald-50">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">Reservation Successfully Booked!</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                All guest verification details, stay duration, and folio have been written directly to Supabase.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs font-mono font-bold">
              <span>Booking Reference:</span>
              <span className="text-blue-700">{confirmedBooking.reference}</span>
            </div>
          </div>

          {/* Detailed summary of stay & customer info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Room & Stay Details */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs border-b border-slate-200 pb-1.5">
                <BedDouble className="w-4 h-4 text-blue-600" />
                <span>Room & Schedule Details</span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Reserved Suite:</span>
                  <span className="font-semibold text-slate-800">{confirmedBooking.roomTypeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Check-In Date:</span>
                  <span className="font-mono text-slate-800">{confirmedBooking.checkIn} (From 2:00 PM)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Check-Out Date:</span>
                  <span className="font-mono text-slate-800">{confirmedBooking.checkOut} (Until 11:00 AM)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Stay Duration:</span>
                  <span className="font-mono text-slate-800">{confirmedBooking.nights} Nights · {confirmedBooking.guests} Guests</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                  <span className="text-slate-700">Settled Amount:</span>
                  <span className="font-mono text-blue-700">${confirmedBooking.totalAmount} (Paid in Full)</span>
                </div>
              </div>
            </div>

            {/* Guest KYC & Verification Details */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs border-b border-slate-200 pb-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Guest Stay Verification (KYC)</span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Guest Name:</span>
                  <span className="font-semibold text-slate-900">{confirmedBooking.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mobile Number:</span>
                  <span className="font-mono text-slate-800">{confirmedBooking.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Age & Gender:</span>
                  <span className="text-slate-800">{age} Years · {gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{idProofType}:</span>
                  <span className="font-mono font-bold text-slate-800">{confirmedBooking.aadhar}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Residence:</span>
                  <span className="text-slate-800 truncate max-w-[180px] text-right" title={`${city}, ${state}`}>
                    {city}, {state}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              This booking is synced with your Supabase <code className="font-mono font-bold">bookings</code> & <code className="font-mono font-bold">customers</code> tables. You can view, track, or download your voucher under "My Bookings".
            </span>
          </div>
        </div>
      ) : (
        <form onSubmit={handleConfirm} className="space-y-4 text-xs">
          {bookingError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{bookingError}</span>
            </div>
          )}

          {/* Selected Room Header Snippet */}
          <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-xl border border-blue-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Selected Room Type</span>
              <p className="font-bold text-blue-950 text-sm mt-0.5">{roomType.name}</p>
              <p className="text-blue-700 text-[11px] font-mono mt-0.5">
                ${roomType.basePrice} / night · Accommodates up to {roomType.capacity} Guests
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                ✓ Available for Instant Booking
              </span>
            </div>
          </div>

          {/* Section 1: Hotel Guest Identification (Name, Number, Age, Gender) */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-100 pb-2">
              <User className="w-4 h-4 text-blue-600" />
              <span>1. Guest Stay Details & Contact Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block font-semibold text-slate-700 mb-1">
                  Primary Guest Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bhaskar Gorli"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mobile / Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="e.g. bhaskar@gmail.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Age <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="18"
                  max="120"
                  required
                  placeholder="28"
                  value={age}
                  onChange={e => setAge(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Min 18 for booking</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Purpose of Stay</label>
                <select
                  value={purposeOfVisit}
                  onChange={e => setPurposeOfVisit(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="Leisure / Vacation">Leisure / Vacation</option>
                  <option value="Business / Corporate Work">Business / Corporate Work</option>
                  <option value="Family & Social Event">Family & Social Event</option>
                  <option value="Transit / Stopover">Transit / Stopover</option>
                  <option value="Medical / Healthcare">Medical / Healthcare</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Identity Proof / Aadhar Card Verification (Hotel Compliance) */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-100 pb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>2. Government Identification & Aadhar Verification (Hotel Compliance)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ID Proof Document <span className="text-rose-500">*</span>
                </label>
                <select
                  value={idProofType}
                  onChange={e => setIdProofType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="Aadhar Card">Aadhar Card (UIDAI)</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Voter ID">Voter ID</option>
                  <option value="Government ID">Other Government ID</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  {idProofType} Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder={idProofType === 'Aadhar Card' ? 'XXXX-XXXX-XXXX (12 digits)' : 'Enter document identification number'}
                    value={idProofNumber}
                    onChange={e => setIdProofNumber(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Mandatory for hotel guest verification & local safety registration.
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Residential Address & Emergency Contact */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-100 pb-2">
              <MapPin className="w-4 h-4 text-amber-600" />
              <span>3. Permanent Address & Emergency Contact</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Street / Residential Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Door No. 12-4-5, Beach Road"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Visakhapatnam"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    placeholder="Andhra Pradesh"
                    value={state}
                    onChange={e => setState(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">PIN / Postal Code</label>
                <input
                  type="text"
                  placeholder="530002"
                  value={postalCode}
                  onChange={e => setPostalCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Emergency Person</label>
                <input
                  type="text"
                  placeholder="e.g. Ravi Gorli"
                  value={emergencyContactName}
                  onChange={e => setEmergencyContactName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Emergency Phone</label>
                <input
                  type="tel"
                  placeholder="+91 99887 66554"
                  value={emergencyContactPhone}
                  onChange={e => setEmergencyContactPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Stay Dates & Room Guests */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-100 pb-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>4. Stay Dates & Guest Allocation</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Check-In Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={checkIn}
                  onChange={e => setCheckIn(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Check-Out Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={checkOut}
                  onChange={e => setCheckOut(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Total Guests <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={roomType.capacity}
                  value={guests}
                  onChange={e => setGuests(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Capacity: 1 to {roomType.capacity} guests.
                </span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Special Concierge Requests (Optional)</label>
              <textarea
                rows={2}
                value={specialRequests}
                onChange={e => setSpecialRequests(e.target.value)}
                placeholder="e.g. Quiet upper floor room, early check-in, extra linen or towels, honeymoon decoration"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Financial Breakdown Card */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Base Accommodation ({nights} nights @ ${roomType.basePrice}/night):</span>
              <span className="font-mono">${totalAmount}</span>
            </div>
            <div className="flex justify-between">
              <span>Hotel Luxury & Municipal Service Taxes (12%):</span>
              <span className="font-mono">${taxes}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 text-xs pt-1.5 border-t border-slate-200">
              <span>Total Estimated Folio:</span>
              <span className="font-mono text-blue-700 text-sm">${finalTotal}</span>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};
