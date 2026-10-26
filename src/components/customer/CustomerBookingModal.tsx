import React, { useState, useEffect, useRef } from 'react';
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
  Building2,
  BedDouble,
  QrCode,
  Smartphone,
  Lock,
  Sparkles,
  Upload,
  Trash2,
  FileCheck
} from 'lucide-react';
import { RazorpayCheckoutModal } from '../payment/RazorpayCheckoutModal';
import { convertUsdToInr, formatInr, RazorpaySuccessResult } from '../../lib/razorpay';

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
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState('Male');

  // KYC & Identification Proof
  const [idProofType, setIdProofType] = useState('Aadhar Card');
  const [idProofNumber, setIdProofNumber] = useState('');

  // Mandatory Aadhar Document Upload
  const [aadharFileName, setAadharFileName] = useState('');
  const [aadharFileData, setAadharFileData] = useState('');
  const [aadharFileSize, setAadharFileSize] = useState('');
  const [aadharUploadError, setAadharUploadError] = useState('');
  const aadharFileInputRef = useRef<HTMLInputElement>(null);

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
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<{
    reference: string;
    customerCode: string;
    customerName: string;
    phone: string;
    aadhar: string;
    aadharDocumentName?: string;
    roomTypeName: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    guests: number;
    totalAmount: number;
    amountInINR: number;
    paymentMethod: string;
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
  } | null>(null);

  // Clean empty input fields every time the modal is opened (no previous person's details)
  useEffect(() => {
    if (isOpen) {
      setFullName('');
      setPhone('');
      setEmail('');
      setAge('');
      setGender('Male');
      setAddress('');
      setCity('');
      setState('');
      setPostalCode('');
      setCountry('India');
      setIdProofType('Aadhar Card');
      setIdProofNumber('');
      setAadharFileName('');
      setAadharFileData('');
      setAadharFileSize('');
      setAadharUploadError('');
      setPurposeOfVisit('Leisure / Vacation');
      setEmergencyContactName('');
      setEmergencyContactPhone('');
      setSpecialRequests('');
      setBookingError('');
      setIsSuccess(false);
      setShowRazorpayModal(false);
      setConfirmedBooking(null);
      if (aadharFileInputRef.current) {
        aadharFileInputRef.current.value = '';
      }
    }
  }, [isOpen]);

  // Handle Aadhar Card file upload
  const handleAadharFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAadharUploadError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      setAadharUploadError('Aadhar file exceeds 5MB size limit. Please upload a smaller image or PDF.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAadharFileName(file.name);
      setAadharFileData(reader.result as string);
      const sizeKB = (file.size / 1024).toFixed(1);
      setAadharFileSize(file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${sizeKB} KB`);
    };
    reader.onerror = () => {
      setAadharUploadError('Failed to read document. Please select a valid file.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAadhar = () => {
    setAadharFileName('');
    setAadharFileData('');
    setAadharFileSize('');
    setAadharUploadError('');
    if (aadharFileInputRef.current) {
      aadharFileInputRef.current.value = '';
    }
  };

  if (!roomType) return null;

  // Calculate nights and dynamic folio
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  const diffTime = Math.max(d2.getTime() - d1.getTime(), 1000 * 3600 * 24);
  const nights = Math.max(Math.ceil(diffTime / (1000 * 3600 * 24)), 1);
  const totalAmount = roomType.basePrice * nights;
  const taxes = Math.round(totalAmount * 0.12);
  const finalTotal = totalAmount + taxes;

  const handleProceedToPayment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setBookingError('');

    if (!fullName.trim()) {
      setBookingError('Please enter primary guest full name.');
      return;
    }

    if (!phone.trim()) {
      setBookingError('Please enter a valid contact phone / mobile number.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setBookingError('Please enter a valid contact email address.');
      return;
    }

    if (!age || Number(age) < 18) {
      setBookingError('Primary guest must be at least 18 years old to reserve a room.');
      return;
    }

    if (!idProofNumber.trim()) {
      setBookingError(`Please provide valid ${idProofType} number for hotel check-in compliance.`);
      return;
    }

    // MANDATORY AADHAR CARD UPLOAD VALIDATION
    if (!aadharFileName || !aadharFileData) {
      setBookingError('Aadhar Card Document Upload is MANDATORY. Please attach a photo or PDF copy of your Aadhar Card.');
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

    // Validation passed: Trigger Razorpay Checkout Modal
    setShowRazorpayModal(true);
  };

  const handleRazorpaySuccess = async (result: RazorpaySuccessResult) => {
    setIsSubmitting(true);
    setShowRazorpayModal(false);
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
        aadharDocumentName: aadharFileName,
        aadharDocumentData: aadharFileData,
        purposeOfVisit,
        emergencyContactName: emergencyContactName.trim(),
        emergencyContactPhone: emergencyContactPhone.trim(),
        paymentStatus: 'Paid',
        paymentMethod: result.payment_method || 'Razorpay',
        razorpayPaymentId: result.razorpay_payment_id,
        razorpayOrderId: result.razorpay_order_id,
        razorpaySignature: result.razorpay_signature
      });

      setConfirmedBooking({
        reference: created.bookingReference || created.id,
        customerCode: created.customerCode || customerProfile?.customer_code || 'CUS-NAIDU001',
        customerName: created.customerName,
        phone: created.customerPhone || phone,
        aadhar: created.aadharNumber || idProofNumber,
        aadharDocumentName: aadharFileName,
        roomTypeName: created.roomTypeName,
        checkIn: created.checkIn,
        checkOut: created.checkOut,
        nights: created.nights,
        guests: created.guests,
        totalAmount: created.totalAmount,
        amountInINR: result.amount_inr,
        paymentMethod: result.payment_method || 'Razorpay',
        razorpayPaymentId: result.razorpay_payment_id,
        razorpayOrderId: result.razorpay_order_id
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
    setShowRazorpayModal(false);
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
              <span className="text-[11px] text-slate-500 block">Total Payable via Razorpay:</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold font-mono text-blue-700">{formatInr(finalTotal)}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-normal">
                ({nights} {nights === 1 ? 'night' : 'nights'} · incl. 12% GST/taxes)
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
                onClick={() => handleProceedToPayment()}
                className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md disabled:opacity-50 inline-flex items-center gap-2 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing & Saving...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Pay {formatInr(finalTotal)} with Razorpay</span>
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
              <h4 className="text-base font-bold text-slate-900">Reservation Successfully Booked & Paid!</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Payment verified through Razorpay Gateway and registered directly to Supabase.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs font-mono font-bold">
              <span>Booking Reference:</span>
              <span className="text-blue-700">{confirmedBooking.reference}</span>
            </div>
          </div>

          {/* Detailed summary of stay & customer info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Razorpay Verified Settlement Box */}
            <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50/70 rounded-xl border border-blue-200 md:col-span-2 space-y-2">
              <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                    R
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-xs">Razorpay Payment Verified</span>
                    <span className="text-[10px] text-slate-500 ml-2">256-bit Encrypted Settlement</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white uppercase tracking-wider">
                  PAID IN FULL
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[10px]">Razorpay Payment ID:</span>
                  <span className="font-mono font-bold text-blue-700">{confirmedBooking.razorpayPaymentId || 'pay_verified'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Gateway Method:</span>
                  <span className="font-medium text-slate-800">{confirmedBooking.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Amount Settled:</span>
                  <span className="font-mono font-bold text-emerald-700">{formatInr(confirmedBooking.amountInINR)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Transaction Status:</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Successful
                  </span>
                </div>
              </div>
            </div>

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
                  <span className="font-mono text-blue-700">₹{confirmedBooking.totalAmount.toLocaleString('en-IN')} (Paid in Full)</span>
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
                {confirmedBooking.aadharDocumentName && (
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Aadhar Document:</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 truncate max-w-[180px]">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{confirmedBooking.aadharDocumentName}</span>
                    </span>
                  </div>
                )}
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
              This booking and its Razorpay settlement reference are registered to Supabase <code className="font-mono font-bold">bookings</code> & <code className="font-mono font-bold">customers</code> tables.
            </span>
          </div>
        </div>
      ) : (
        <form onSubmit={handleProceedToPayment} className="space-y-4 text-xs">
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

          {/* Section 2: Identity Proof / Mandatory Aadhar Card Verification (Hotel Compliance) */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>2. Government Identification & Mandatory Aadhar Document</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wide">
                Upload Mandatory *
              </span>
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

            {/* MANDATORY AADHAR CARD UPLOAD BOX */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>Upload Aadhar Card Document (Mandatory)</span>
                  <span className="text-rose-600 font-bold">*</span>
                </label>
                <span className="text-[11px] text-slate-500">Max size 5 MB (JPG, PNG, PDF)</span>
              </div>

              {/* Hidden file input */}
              <input
                ref={aadharFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleAadharFileChange}
                className="hidden"
              />

              {!aadharFileName ? (
                /* Un-uploaded state: interactive dropzone */
                <div
                  onClick={() => aadharFileInputRef.current?.click()}
                  className="border-2 border-dashed border-blue-200 hover:border-blue-400 hover:bg-blue-50/40 bg-slate-50/60 rounded-xl p-4 text-center cursor-pointer transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 group-hover:bg-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-2 transition-colors">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="font-semibold text-slate-800 text-xs">
                    Click to browse & upload your Aadhar Card
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Government regulations mandate uploading an authentic Aadhar Card / UIDAI copy prior to booking confirmation.
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      aadharFileInputRef.current?.click();
                    }}
                    className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Select Aadhar File
                  </button>
                </div>
              ) : (
                /* Uploaded state: preview and remove */
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {aadharFileData.startsWith('data:image/') ? (
                      <img
                        src={aadharFileData}
                        alt="Aadhar Preview"
                        className="w-12 h-12 object-cover rounded-lg border border-emerald-300 shadow-xs shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200 flex flex-col items-center justify-center shrink-0">
                        <FileCheck className="w-6 h-6" />
                        <span className="text-[8px] font-bold uppercase">PDF</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-slate-900 text-xs truncate" title={aadharFileName}>
                          {aadharFileName}
                        </p>
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                          Attached
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Size: {aadharFileSize} · Ready for instant check-in verification
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => aadharFileInputRef.current?.click()}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveAadhar}
                      className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                      title="Remove Aadhar document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {aadharUploadError && (
                <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {aadharUploadError}
                </p>
              )}
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

          {/* Section 5: Razorpay Payment Gateway Summary */}
          <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2.5">
            <div className="flex items-center justify-between border-b border-blue-100 pb-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <div className="w-5 h-5 rounded bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                  R
                </div>
                <span>5. Razorpay Secure Payment Gateway</span>
              </div>
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded flex items-center gap-1 border border-blue-200">
                <Lock className="w-3 h-3 text-blue-600" />
                PCI-DSS Level 1 · 256-bit SSL
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
              <div className="p-2 rounded-lg bg-white border border-blue-100 shadow-2xs">
                <div className="font-bold text-slate-800 flex items-center justify-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                  <span>Instant UPI</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Google Pay, PhonePe, Paytm, QR</div>
              </div>
              <div className="p-2 rounded-lg bg-white border border-blue-100 shadow-2xs">
                <div className="font-bold text-slate-800 flex items-center justify-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cards</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">RuPay, Visa, MasterCard</div>
              </div>
              <div className="p-2 rounded-lg bg-white border border-blue-100 shadow-2xs">
                <div className="font-bold text-slate-800 flex items-center justify-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>NetBanking</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">All 50+ Major Indian Banks</div>
              </div>
            </div>
          </div>

          {/* Financial Breakdown Card */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Base Accommodation ({nights} nights @ ₹{roomType.basePrice.toLocaleString('en-IN')}/night):</span>
              <span className="font-mono">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Hotel Luxury & Municipal Service Taxes (12%):</span>
              <span className="font-mono">₹{taxes.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center font-bold text-slate-900 text-xs pt-2 border-t border-slate-200">
              <span>Total Amount Payable (Razorpay):</span>
              <div className="text-right">
                <span className="font-mono text-blue-700 text-base font-black">
                  {formatInr(finalTotal)}
                </span>
                <span className="text-[10px] text-slate-500 ml-1.5 font-normal">(All Taxes Included)</span>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Embedded Razorpay Payment Checkout Modal */}
      <RazorpayCheckoutModal
        isOpen={showRazorpayModal}
        onClose={() => setShowRazorpayModal(false)}
        bookingData={{
          bookingReference: `BKG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          roomTypeName: roomType.name,
          totalAmountUSD: finalTotal,
          customerName: fullName.trim() || 'Guest',
          customerEmail: email.trim(),
          customerPhone: phone.trim(),
          nights,
          guests
        }}
        onPaymentSuccess={handleRazorpaySuccess}
      />
    </Modal>
  );
};
