import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Users,
  ChevronDown,
  ArrowRight,
  Wifi,
  Coffee,
  Waves,
  Shield,
  Clock,
  MapPin,
  Phone,
  Mail,
  Sparkles,
  BedDouble,
  Maximize2,
  UtensilsCrossed,
  Car,
  Compass,
  Check,
  X,
  Menu,
  Eye
} from 'lucide-react';
import { useHotel } from '../../context/HotelContext';
import { useAuth } from '../../context/AuthContext';
import { RoomType } from '../../types/hotel';
import { CustomerBookingModal } from '../customer/CustomerBookingModal';

interface LuxuryHotelLandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
  onGoToDashboard?: () => void;
}

// Curated high-resolution cinematic luxury hotel photography
const HERO_IMAGE = 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2200&q=85';
const WELCOME_IMAGE = 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=85';
const CTA_IMAGE = 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=2200&q=85';

// Curated authentic room photography matched to the hotel's room types
const ROOM_IMAGES: Record<string, string> = {
  'Single Sharing Room': 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
  'Double Sharing Room': 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80',
  'Triple Sharing Room': 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
  'Deluxe Ocean View': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
  'Executive Business Suite': 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
  'Premier Garden Villa': 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
  'Luxery Presidential Penthouse': 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80'
};

const DEFAULT_ROOM_IMAGE = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';

export const LuxuryHotelLandingPage: React.FC<LuxuryHotelLandingPageProps> = ({
  onNavigateToLogin,
  onNavigateToRegister,
  onGoToDashboard
}) => {
  const { roomTypes } = useHotel();
  const { isAuthenticated, role, user } = useAuth();

  // Scroll state for sticky navbar
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Booking Search State (Section 2)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const defaultCheckoutStr = useMemo(
    () => new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    []
  );

  const [checkIn, setCheckIn] = useState(todayStr);
  const [checkOut, setCheckOut] = useState(defaultCheckoutStr);
  const [adults, setAdults] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>('ALL');

  // Room Category Filter (Section 4)
  const [roomCategoryFilter, setRoomCategoryFilter] = useState<'ALL' | 'OCEAN' | 'SUITES' | 'SHARING'>('ALL');

  // Booking Modal Integration (Reusing existing CustomerBookingModal)
  const [bookingModalRoom, setBookingModalRoom] = useState<RoomType | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Room Details Preview Modal
  const [inspectingRoom, setInspectingRoom] = useState<RoomType | null>(null);

  // Monitor scroll for navbar transitions
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll handler
  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Open booking modal with preselected parameters
  const handleOpenBooking = (room?: RoomType) => {
    if (!isAuthenticated) {
      onNavigateToLogin();
      return;
    }
    const targetRoom = room || roomTypes.find(r => r.id === selectedRoomTypeId) || roomTypes[0] || null;
    setBookingModalRoom(targetRoom);
    setIsBookingModalOpen(true);
  };

  // Handle Search Availability button click
  const handleSearchAvailability = (e: React.FormEvent) => {
    e.preventDefault();
    handleOpenBooking();
  };

  // Filtered rooms
  const filteredRoomTypes = useMemo(() => {
    return roomTypes.filter(rt => {
      if (rt.status && rt.status !== 'Active') return false;
      if (roomCategoryFilter === 'OCEAN') {
        return rt.name.toLowerCase().includes('ocean') || rt.amenities.some(a => a.toLowerCase().includes('ocean'));
      }
      if (roomCategoryFilter === 'SUITES') {
        return rt.name.toLowerCase().includes('suite') || rt.name.toLowerCase().includes('villa') || rt.name.toLowerCase().includes('penthouse');
      }
      if (roomCategoryFilter === 'SHARING') {
        return rt.name.toLowerCase().includes('sharing');
      }
      return true;
    });
  }, [roomTypes, roomCategoryFilter]);

  return (
    <div className="min-h-screen bg-[#0b0f17] text-[#fcfbf9] font-sans selection:bg-[#c5a880] selection:text-[#0b0f17]">
      {/* =========================================================================
          NAVIGATION BAR
          Minimal, transparent over hero, sticky with subtle dark backdrop on scroll
      ========================================================================= */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#0b0f17]/95 backdrop-blur-md border-b border-white/10 shadow-2xl py-3.5'
            : 'bg-gradient-to-b from-[#0b0f17]/80 via-[#0b0f17]/40 to-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo / Brand Name */}
          <button
            onClick={() => scrollToSection('hero')}
            className="flex items-center gap-3 text-left group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-sm border border-[#c5a880]/60 flex items-center justify-center bg-[#0b0f17]/70 text-[#c5a880] font-serif text-xl tracking-wider transition-transform duration-300 group-hover:scale-105">
              L
            </div>
            <div>
              <span className="block font-serif text-lg sm:text-xl font-medium tracking-[0.2em] text-[#fcfbf9] uppercase">
                Luxury Hotel
              </span>
              <span className="block text-[9px] uppercase tracking-[0.3em] text-[#c5a880]/90 font-mono">
                Sanctuary & Suites
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs uppercase tracking-[0.2em] text-[#fcfbf9]/80 font-medium">
            <button
              onClick={() => scrollToSection('hero')}
              className="hover:text-[#c5a880] transition-colors py-1 cursor-pointer"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('booking')}
              className="hover:text-[#c5a880] transition-colors py-1 cursor-pointer"
            >
              Reservation
            </button>
            <button
              onClick={() => scrollToSection('rooms')}
              className="hover:text-[#c5a880] transition-colors py-1 cursor-pointer"
            >
              Rooms & Suites
            </button>
            <button
              onClick={() => scrollToSection('experiences')}
              className="hover:text-[#c5a880] transition-colors py-1 cursor-pointer"
            >
              Experiences
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="hover:text-[#c5a880] transition-colors py-1 cursor-pointer"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="hover:text-[#c5a880] transition-colors py-1 cursor-pointer"
            >
              Contact
            </button>
          </nav>

          {/* Desktop Right CTA / Account */}
          <div className="hidden sm:flex items-center gap-4">
            {isAuthenticated ? (
              <button
                onClick={onGoToDashboard}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-[#c5a880]/40 text-[#c5a880] hover:bg-[#c5a880]/10 transition-colors text-xs uppercase tracking-[0.15em] font-medium"
              >
                <span>Dashboard ({role})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onNavigateToLogin}
                className="text-xs uppercase tracking-[0.18em] text-[#fcfbf9]/80 hover:text-[#c5a880] transition-colors px-3 py-2 cursor-pointer"
              >
                Sign In
              </button>
            )}

            <button
              onClick={() => handleOpenBooking()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-[#c5a880] hover:bg-[#b89868] text-[#0b0f17] font-medium text-xs uppercase tracking-[0.18em] transition-all duration-200 shadow-lg shadow-[#c5a880]/20 hover:shadow-[#c5a880]/30 cursor-pointer"
            >
              <span>Book Your Stay</span>
            </button>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-[#fcfbf9]/90 hover:text-[#c5a880] transition-colors focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-[#0b0f17]/98 border-b border-white/10 px-6 py-6 space-y-4 backdrop-blur-xl animate-in fade-in duration-200">
            <div className="flex flex-col space-y-3 text-xs uppercase tracking-[0.2em] font-medium text-[#fcfbf9]/80">
              <button
                onClick={() => scrollToSection('hero')}
                className="text-left py-2 hover:text-[#c5a880] transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('booking')}
                className="text-left py-2 hover:text-[#c5a880] transition-colors"
              >
                Reservation
              </button>
              <button
                onClick={() => scrollToSection('rooms')}
                className="text-left py-2 hover:text-[#c5a880] transition-colors"
              >
                Rooms & Suites
              </button>
              <button
                onClick={() => scrollToSection('experiences')}
                className="text-left py-2 hover:text-[#c5a880] transition-colors"
              >
                Experiences
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="text-left py-2 hover:text-[#c5a880] transition-colors"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="text-left py-2 hover:text-[#c5a880] transition-colors"
              >
                Contact
              </button>
            </div>

            <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
              {isAuthenticated ? (
                <button
                  onClick={onGoToDashboard}
                  className="w-full py-2.5 text-center rounded-sm border border-[#c5a880]/50 text-[#c5a880] text-xs uppercase tracking-[0.18em]"
                >
                  Return to Dashboard ({role})
                </button>
              ) : (
                <button
                  onClick={onNavigateToLogin}
                  className="w-full py-2.5 text-center rounded-sm border border-white/20 text-[#fcfbf9] text-xs uppercase tracking-[0.18em]"
                >
                  Sign In
                </button>
              )}
              <button
                onClick={() => handleOpenBooking()}
                className="w-full py-3 text-center rounded-sm bg-[#c5a880] hover:bg-[#b89868] text-[#0b0f17] font-semibold text-xs uppercase tracking-[0.18em]"
              >
                Book Your Stay
              </button>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          SECTION 1 — CINEMATIC HERO
          Full screen, luxury photo with subtle dark overlay, editorial typography
      ========================================================================= */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Hotel Photo */}
        <div className="absolute inset-0 z-0">
          <img
            src={HERO_IMAGE}
            alt="Luxury Hotel Exterior & Architecture"
            className="w-full h-full object-cover object-center scale-105 animate-pulse duration-[10000ms]"
          />
          {/* Subtle cinematic overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f17] via-[#0b0f17]/50 to-[#0b0f17]/40" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#0b0f17]/30 to-[#0b0f17]/80" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-36 sm:pb-44">
          {/* Small Heading */}
          <div className="inline-flex items-center gap-3 mb-6">
            <span className="h-[1px] w-8 sm:w-12 bg-[#c5a880]/70" />
            <span className="text-[11px] sm:text-xs font-mono tracking-[0.35em] text-[#c5a880] uppercase">
              WELCOME TO LUXURY HOTEL
            </span>
            <span className="h-[1px] w-8 sm:w-12 bg-[#c5a880]/70" />
          </div>

          {/* Main Heading */}
          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-normal tracking-tight text-[#fcfbf9] leading-[1.08] mb-6">
            Experience Luxury. <br />
            <span className="italic font-light text-[#c5a880]">Discover Comfort.</span>
          </h1>

          {/* Supporting Text */}
          <p className="max-w-2xl mx-auto text-sm sm:text-base md:text-lg text-[#fcfbf9]/80 font-light leading-relaxed mb-10">
            Where exceptional hospitality meets timeless elegance. Your perfect stay begins here.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => scrollToSection('rooms')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-sm bg-[#c5a880] hover:bg-[#b89868] text-[#0b0f17] font-medium text-xs uppercase tracking-[0.2em] transition-all duration-300 shadow-xl shadow-[#c5a880]/20 hover:scale-[1.02] cursor-pointer"
            >
              Explore Rooms
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-sm border border-white/30 hover:border-[#c5a880] text-[#fcfbf9] hover:text-[#c5a880] font-medium text-xs uppercase tracking-[0.2em] transition-all duration-300 hover:bg-white/5 cursor-pointer"
            >
              Discover More
            </button>
          </div>
        </div>

        {/* Subtle Scroll Down Indicator */}
        <button
          onClick={() => scrollToSection('booking')}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-[#fcfbf9]/60 hover:text-[#c5a880] transition-colors group cursor-pointer"
          aria-label="Scroll down to reservation"
        >
          <span className="text-[10px] uppercase tracking-[0.25em] font-mono group-hover:tracking-[0.3em] transition-all">
            Scroll Down
          </span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </button>
      </section>

      {/* =========================================================================
          SECTION 2 — BOOK YOUR STAY
          Clean, elegant booking search panel overlapping the bottom of hero section
      ========================================================================= */}
      <section id="booking" className="relative z-20 -mt-20 sm:-mt-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="bg-[#121620] border border-[#c5a880]/30 rounded-sm shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-white/10 gap-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#c5a880]">
                Direct Reservation Desk
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#fcfbf9] tracking-tight">
                Plan Your Stay
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#fcfbf9]/60">
              <Shield className="w-3.5 h-3.5 text-[#c5a880]" />
              <span>Best rate guarantee · 100% Free cancellation available</span>
            </div>
          </div>

          <form onSubmit={handleSearchAvailability} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Check-In Date */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-[#c5a880]/90">
                Check-In Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={checkIn}
                  min={todayStr}
                  onChange={e => setCheckIn(e.target.value)}
                  className="w-full bg-[#0b0f17] border border-white/15 focus:border-[#c5a880] rounded-sm px-3.5 py-2.5 text-xs text-[#fcfbf9] focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            {/* Check-Out Date */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-[#c5a880]/90">
                Check-Out Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={checkOut}
                  min={checkIn || todayStr}
                  onChange={e => setCheckOut(e.target.value)}
                  className="w-full bg-[#0b0f17] border border-white/15 focus:border-[#c5a880] rounded-sm px-3.5 py-2.5 text-xs text-[#fcfbf9] focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            {/* Adults */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-[#c5a880]/90">
                Adults
              </label>
              <select
                value={adults}
                onChange={e => setAdults(Number(e.target.value))}
                className="w-full bg-[#0b0f17] border border-white/15 focus:border-[#c5a880] rounded-sm px-3.5 py-2.5 text-xs text-[#fcfbf9] focus:outline-none transition-colors cursor-pointer"
              >
                <option value={1} className="bg-[#0b0f17] text-white">1 Adult</option>
                <option value={2} className="bg-[#0b0f17] text-white">2 Adults</option>
                <option value={3} className="bg-[#0b0f17] text-white">3 Adults</option>
                <option value={4} className="bg-[#0b0f17] text-white">4 Adults</option>
                <option value={6} className="bg-[#0b0f17] text-white">5+ Guests (Villa / Suite)</option>
              </select>
            </div>

            {/* Children */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-[#c5a880]/90">
                Children (0–6 Free)
              </label>
              <select
                value={childrenCount}
                onChange={e => setChildrenCount(Number(e.target.value))}
                className="w-full bg-[#0b0f17] border border-white/15 focus:border-[#c5a880] rounded-sm px-3.5 py-2.5 text-xs text-[#fcfbf9] focus:outline-none transition-colors cursor-pointer"
              >
                <option value={0} className="bg-[#0b0f17] text-white">0 Children</option>
                <option value={1} className="bg-[#0b0f17] text-white">1 Child</option>
                <option value={2} className="bg-[#0b0f17] text-white">2 Children</option>
                <option value={3} className="bg-[#0b0f17] text-white">3+ Children</option>
              </select>
            </div>

            {/* Room Type */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-[#c5a880]/90">
                Room Category
              </label>
              <select
                value={selectedRoomTypeId}
                onChange={e => setSelectedRoomTypeId(e.target.value)}
                className="w-full bg-[#0b0f17] border border-white/15 focus:border-[#c5a880] rounded-sm px-3.5 py-2.5 text-xs text-[#fcfbf9] focus:outline-none transition-colors cursor-pointer"
              >
                <option value="ALL" className="bg-[#0b0f17] text-white">All Rooms & Suites</option>
                {roomTypes.map(rt => (
                  <option key={rt.id} value={rt.id} className="bg-[#0b0f17] text-white">
                    {rt.name} (from ₹{rt.basePrice.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>

            {/* Search Availability CTA (Spans full width on bottom) */}
            <div className="sm:col-span-2 lg:col-span-5 pt-3">
              <button
                type="submit"
                className="w-full py-3.5 rounded-sm bg-[#c5a880] hover:bg-[#b89868] text-[#0b0f17] font-semibold text-xs uppercase tracking-[0.22em] transition-all duration-300 shadow-lg shadow-[#c5a880]/15 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Search Availability & Rates</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3 — WELCOME TO LUXURY HOTEL
          Editorial layout: large hotel photo on one side, curated text on the other
      ========================================================================= */}
      <section id="about" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Editorial Photo with subtle champagne frame */}
          <div className="lg:col-span-7 relative">
            <div className="relative z-10 overflow-hidden rounded-sm border border-white/10 group">
              <img
                src={WELCOME_IMAGE}
                alt="Luxury Hotel Interior Sanctuary"
                className="w-full h-[440px] sm:h-[540px] object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f17]/70 via-transparent to-transparent" />
            </div>

            {/* Subtle decorative offset border */}
            <div className="absolute -bottom-4 -left-4 w-full h-full border border-[#c5a880]/20 rounded-sm -z-0 hidden sm:block" />

            {/* Floating Luxury Detail Card */}
            <div className="absolute -bottom-6 -right-4 sm:right-6 bg-[#121620]/95 border border-[#c5a880]/40 p-4 sm:p-5 rounded-sm shadow-xl z-20 backdrop-blur-md max-w-xs">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#c5a880] mb-1">
                Guest Sanctuary
              </p>
              <p className="font-serif text-base sm:text-lg text-[#fcfbf9] leading-snug">
                "Where architecture breathes and serenity comes naturally."
              </p>
            </div>
          </div>

          {/* Right Column: Editorial Copy */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-[#c5a880]">
              <span className="w-6 h-[1px] bg-[#c5a880]" />
              <span>THE ESSENCE OF HOSPITALITY</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#fcfbf9] leading-[1.15]">
              A Stay Beyond <br />
              <span className="italic text-[#c5a880]">Expectations</span>
            </h2>

            <p className="text-sm sm:text-base text-[#fcfbf9]/75 font-light leading-relaxed">
              At Luxury Hotel, every detail is designed to make your stay special. From thoughtfully designed rooms to exceptional hospitality, we create memorable experiences that bring comfort, elegance, and convenience together.
            </p>

            <p className="text-sm text-[#fcfbf9]/60 font-light leading-relaxed">
              Perched along the serene coastal stretch of Marine Drive, our boutique hotel harmonizes understated modern luxury with genuine warmth. Whether traveling for executive leisure, romantic coastal getaways, or family holidays, our intuitive staff and curated spaces ensure your time with us is timeless.
            </p>

            {/* Key Hotel Highlights (clean text with dividers, no pills) */}
            <div className="pt-4 border-t border-white/10 grid grid-cols-3 gap-4">
              <div>
                <p className="font-serif text-2xl sm:text-3xl text-[#c5a880]">7</p>
                <p className="text-[11px] text-[#fcfbf9]/60 uppercase tracking-wider mt-0.5">Bespoke Suites</p>
              </div>
              <div>
                <p className="font-serif text-2xl sm:text-3xl text-[#c5a880]">100%</p>
                <p className="text-[11px] text-[#fcfbf9]/60 uppercase tracking-wider mt-0.5">Ocean Panorama</p>
              </div>
              <div>
                <p className="font-serif text-2xl sm:text-3xl text-[#c5a880]">24/7</p>
                <p className="text-[11px] text-[#fcfbf9]/60 uppercase tracking-wider mt-0.5">Concierge Care</p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => scrollToSection('experiences')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-sm border border-[#c5a880] text-[#c5a880] hover:bg-[#c5a880] hover:text-[#0b0f17] text-xs uppercase tracking-[0.2em] font-medium transition-all duration-300 cursor-pointer"
              >
                <span>Discover Our Story</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4 — ROOMS & SUITES
          Showcases existing room types, prices, details, and Book Now actions
      ========================================================================= */}
      <section id="rooms" className="py-24 bg-[#0e121a] border-t border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-[#c5a880] mb-2">
                <span className="w-6 h-[1px] bg-[#c5a880]" />
                <span>SANCTUARIES OF REPOSE</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#fcfbf9] tracking-tight">
                Rooms & Suites
              </h2>
              <p className="text-sm text-[#fcfbf9]/60 font-light mt-2 max-w-xl">
                Impeccably appointed accommodations featuring handcrafted bespoke furnishings, plush bedding, and serene oceanfront terraces.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-[#121620] border border-white/10 rounded-sm">
              <button
                onClick={() => setRoomCategoryFilter('ALL')}
                className={`px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.1em] rounded-xs transition-colors cursor-pointer ${
                  roomCategoryFilter === 'ALL'
                    ? 'bg-[#c5a880] text-[#0b0f17]'
                    : 'text-[#fcfbf9]/70 hover:text-[#fcfbf9]'
                }`}
              >
                All Accommodations
              </button>
              <button
                onClick={() => setRoomCategoryFilter('OCEAN')}
                className={`px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.1em] rounded-xs transition-colors cursor-pointer ${
                  roomCategoryFilter === 'OCEAN'
                    ? 'bg-[#c5a880] text-[#0b0f17]'
                    : 'text-[#fcfbf9]/70 hover:text-[#fcfbf9]'
                }`}
              >
                Ocean View
              </button>
              <button
                onClick={() => setRoomCategoryFilter('SUITES')}
                className={`px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.1em] rounded-xs transition-colors cursor-pointer ${
                  roomCategoryFilter === 'SUITES'
                    ? 'bg-[#c5a880] text-[#0b0f17]'
                    : 'text-[#fcfbf9]/70 hover:text-[#fcfbf9]'
                }`}
              >
                Suites & Villas
              </button>
              <button
                onClick={() => setRoomCategoryFilter('SHARING')}
                className={`px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.1em] rounded-xs transition-colors cursor-pointer ${
                  roomCategoryFilter === 'SHARING'
                    ? 'bg-[#c5a880] text-[#0b0f17]'
                    : 'text-[#fcfbf9]/70 hover:text-[#fcfbf9]'
                }`}
              >
                Sharing
              </button>
            </div>
          </div>

          {/* Room Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRoomTypes.map(rt => {
              const roomImage = ROOM_IMAGES[rt.name] || DEFAULT_ROOM_IMAGE;

              return (
                <div
                  key={rt.id}
                  className="group bg-[#121620] border border-white/10 hover:border-[#c5a880]/60 rounded-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl hover:shadow-[#c5a880]/5"
                >
                  {/* Room Photography with subtle zoom on hover */}
                  <div className="relative h-64 overflow-hidden bg-slate-900">
                    <img
                      src={roomImage}
                      alt={rt.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121620] via-transparent to-black/30" />

                    {/* Occupancy and Size quiet tag */}
                    <div className="absolute top-3 left-3 bg-[#0b0f17]/85 backdrop-blur-md px-2.5 py-1 rounded-xs border border-white/10 text-[10px] font-mono uppercase tracking-wider text-[#c5a880]">
                      {rt.capacity} {rt.capacity === 1 ? 'Guest' : 'Guests'} · {rt.sizeSqFt || 320} sq ft
                    </div>
                  </div>

                  {/* Room Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-baseline justify-between gap-2 mb-1.5">
                        <h3 className="font-serif text-xl sm:text-2xl text-[#fcfbf9] group-hover:text-[#c5a880] transition-colors">
                          {rt.name}
                        </h3>
                      </div>

                      <p className="text-xs text-[#fcfbf9]/65 font-light leading-relaxed line-clamp-2 mb-4">
                        {rt.description}
                      </p>

                      {/* Clean metadata indicators without pill boxes */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#fcfbf9]/50 font-light border-t border-b border-white/5 py-2.5">
                        <span>{rt.bedType || 'Plush King Bed'}</span>
                        <span aria-hidden="true" className="text-[#c5a880]">·</span>
                        <span>High-Speed WiFi</span>
                        <span aria-hidden="true" className="text-[#c5a880]">·</span>
                        <span>Private Ensuite</span>
                      </div>
                    </div>

                    {/* Price & Action Buttons */}
                    <div className="pt-2 flex items-center justify-between gap-3">
                      <div>
                        <span className="block text-[10px] font-mono uppercase tracking-wider text-[#fcfbf9]/50">
                          Starting Tariff
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="font-serif text-2xl font-normal text-[#c5a880]">
                            ₹{rt.basePrice.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-[#fcfbf9]/50 font-light">/ night</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setInspectingRoom(rt)}
                          className="px-3 py-2 rounded-xs border border-white/20 hover:border-[#c5a880] text-xs text-[#fcfbf9] hover:text-[#c5a880] transition-colors flex items-center gap-1 cursor-pointer"
                          title="View Room Blueprint & Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Details</span>
                        </button>

                        <button
                          onClick={() => handleOpenBooking(rt)}
                          className="px-4 py-2 rounded-xs bg-[#c5a880] hover:bg-[#b89868] text-[#0b0f17] text-xs uppercase tracking-wider font-semibold transition-all duration-200 cursor-pointer shadow-md shadow-[#c5a880]/10 hover:shadow-[#c5a880]/25"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5 — THE LUXURY EXPERIENCE
          Highlights actual hotel amenities: Coast & Spice Dining, Infinity Pool,
          Ocean Terraces, Chauffeur & Concierge
      ========================================================================= */}
      <section id="experiences" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-[#c5a880] mb-3">
            <span className="w-6 h-[1px] bg-[#c5a880]" />
            <span>UNMATCHED COMFORTS & SERVICES</span>
            <span className="w-6 h-[1px] bg-[#c5a880]" />
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#fcfbf9] tracking-tight">
            The Luxury Experience
          </h2>
          <p className="text-sm sm:text-base text-[#fcfbf9]/65 font-light mt-3">
            Immerse yourself in world-class amenities and tranquil spaces designed to restore and inspire.
          </p>
        </div>

        {/* 4 Feature Experiences Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Facility 1: Fine Dining */}
          <div className="bg-[#121620] border border-white/10 rounded-sm p-6 flex flex-col justify-between group hover:border-[#c5a880]/40 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-sm bg-[#c5a880]/10 border border-[#c5a880]/30 flex items-center justify-center text-[#c5a880] mb-5">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-xl text-[#fcfbf9] mb-2 group-hover:text-[#c5a880] transition-colors">
                Fine Dining
              </h3>
              <p className="text-xs text-[#fcfbf9]/65 font-light leading-relaxed">
                Coast & Spice Specialty Restaurant serving coastal multi-cuisine delicacies, fresh catch-of-the-day, and complimentary gourmet breakfast buffet.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5 text-[11px] text-[#c5a880] font-mono">
              6:30 AM – 11:00 PM Daily
            </div>
          </div>

          {/* Facility 2: Relaxation & Comfort */}
          <div className="bg-[#121620] border border-white/10 rounded-sm p-6 flex flex-col justify-between group hover:border-[#c5a880]/40 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-sm bg-[#c5a880]/10 border border-[#c5a880]/30 flex items-center justify-center text-[#c5a880] mb-5">
                <Waves className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-xl text-[#fcfbf9] mb-2 group-hover:text-[#c5a880] transition-colors">
                Relaxation & Comfort
              </h3>
              <p className="text-xs text-[#fcfbf9]/65 font-light leading-relaxed">
                4th-floor infinity pool offering uninterrupted panoramic vistas of the Bay of Bengal, sun lounging decks, and evening twilight ambient lighting.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5 text-[11px] text-[#c5a880] font-mono">
              Heated Infinity Pool · Floor 4
            </div>
          </div>

          {/* Facility 3: Premium Rooms */}
          <div className="bg-[#121620] border border-white/10 rounded-sm p-6 flex flex-col justify-between group hover:border-[#c5a880]/40 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-sm bg-[#c5a880]/10 border border-[#c5a880]/30 flex items-center justify-center text-[#c5a880] mb-5">
                <BedDouble className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-xl text-[#fcfbf9] mb-2 group-hover:text-[#c5a880] transition-colors">
                Premium Rooms
              </h3>
              <p className="text-xs text-[#fcfbf9]/65 font-light leading-relaxed">
                Secluded enclaves, botanical garden terraces, and presidential penthouses with private elevator access, Nespresso bars, and soaking tubs.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5 text-[11px] text-[#c5a880] font-mono">
              Custom California King Beds
            </div>
          </div>

          {/* Facility 4: Exceptional Hospitality */}
          <div className="bg-[#121620] border border-white/10 rounded-sm p-6 flex flex-col justify-between group hover:border-[#c5a880]/40 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-sm bg-[#c5a880]/10 border border-[#c5a880]/30 flex items-center justify-center text-[#c5a880] mb-5">
                <Car className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-xl text-[#fcfbf9] mb-2 group-hover:text-[#c5a880] transition-colors">
                Exceptional Hospitality
              </h3>
              <p className="text-xs text-[#fcfbf9]/65 font-light leading-relaxed">
                Complimentary luxury airport chauffeur transfer for villas and penthouses, secure on-site valet parking, and 24/7 dedicated concierge assistance.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5 text-[11px] text-[#c5a880] font-mono">
              24/7 Front Desk & Chauffeur
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6 — WHY CHOOSE LUXURY HOTEL
          Four minimal feature highlights with simple elegant icons
      ========================================================================= */}
      <section className="py-20 bg-[#0e121a] border-t border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-sm border border-[#c5a880]/40 flex items-center justify-center text-[#c5a880]">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg text-[#fcfbf9]">
                Exceptional Guest Experience
              </h3>
              <p className="text-xs text-[#fcfbf9]/60 font-light leading-relaxed">
                Personalized care from check-in to departure, designed to exceed expectations and create unforgettable memories.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-sm border border-[#c5a880]/40 flex items-center justify-center text-[#c5a880]">
                <Coffee className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg text-[#fcfbf9]">
                Comfortable Accommodation
              </h3>
              <p className="text-xs text-[#fcfbf9]/60 font-light leading-relaxed">
                Quiet acoustic isolation, premium mattresses, climate-controlled comfort, and ergonomic workspaces in every suite.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-sm border border-[#c5a880]/40 flex items-center justify-center text-[#c5a880]">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg text-[#fcfbf9]">
                Easy Online Reservations
              </h3>
              <p className="text-xs text-[#fcfbf9]/60 font-light leading-relaxed">
                Instant confirmation powered by secure Razorpay checkout, live inventory tracking, and hassle-free date management.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-sm border border-[#c5a880]/40 flex items-center justify-center text-[#c5a880]">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg text-[#fcfbf9]">
                Personalized Guest Assistance
              </h3>
              <p className="text-xs text-[#fcfbf9]/60 font-light leading-relaxed">
                Intelligent digital concierge and dedicated front desk specialists available around the clock to assist your itinerary.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7 — GUEST EXPERIENCE
          Authentic hospitality-focused visual section
      ========================================================================= */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-[#c5a880]">
              <span className="w-6 h-[1px] bg-[#c5a880]" />
              <span>THE ART OF HOSPITALITY</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#fcfbf9] tracking-tight">
              Crafted for Rest. <br />
              <span className="italic text-[#c5a880]">Curated for Peace.</span>
            </h2>

            <p className="text-sm sm:text-base text-[#fcfbf9]/75 font-light leading-relaxed">
              We believe true luxury is tranquility. From our prompt government digital KYC verification to smooth room dispatch and express checkout, every touchpoint is frictionless.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 text-xs text-[#fcfbf9]/80">
                <Check className="w-4 h-4 text-[#c5a880] shrink-0 mt-0.5" />
                <span>Express digital check-in with Aadhaar & PAN instant KYC verification</span>
              </div>
              <div className="flex items-start gap-3 text-xs text-[#fcfbf9]/80">
                <Check className="w-4 h-4 text-[#c5a880] shrink-0 mt-0.5" />
                <span>Clear 48-hour free cancellation policy with automated refunds</span>
              </div>
              <div className="flex items-start gap-3 text-xs text-[#fcfbf9]/80">
                <Check className="w-4 h-4 text-[#c5a880] shrink-0 mt-0.5" />
                <span>100% non-smoking guest rooms maintaining pristine coastal air</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <img
                src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=700&q=80"
                alt="Luxury Hotel Infinity Pool Over Ocean"
                className="w-full h-56 sm:h-72 object-cover rounded-sm border border-white/10"
              />
              <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=700&q=80"
                alt="Coast & Spice Dining Room"
                className="w-full h-44 sm:h-52 object-cover rounded-sm border border-white/10"
              />
            </div>
            <div className="space-y-4 pt-6 sm:pt-8">
              <img
                src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=700&q=80"
                alt="Ocean View Suite Balcony"
                className="w-full h-44 sm:h-52 object-cover rounded-sm border border-white/10"
              />
              <img
                src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=700&q=80"
                alt="Twilight Poolside Cabana"
                className="w-full h-56 sm:h-72 object-cover rounded-sm border border-white/10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 8 — FINAL CALL TO ACTION
          Full-width cinematic hotel image section
      ========================================================================= */}
      <section className="relative py-28 sm:py-36 overflow-hidden">
        {/* Background CTA Photo */}
        <div className="absolute inset-0 z-0">
          <img
            src={CTA_IMAGE}
            alt="Luxury Hotel Twilight Panorama"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-[#0b0f17]/85 backdrop-blur-[1px]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b0f17] via-transparent to-[#0b0f17]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-[#c5a880]">
            TIMELESS EXPERIENCES
          </span>

          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal text-[#fcfbf9] tracking-tight leading-tight">
            Your Perfect Stay Awaits
          </h2>

          <p className="text-sm sm:text-base text-[#fcfbf9]/80 font-light max-w-xl mx-auto">
            Make your next stay memorable with Luxury Hotel. Reserve your bespoke suite today and enjoy direct booking privileges.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => handleOpenBooking()}
              className="w-full sm:w-auto px-9 py-4 rounded-sm bg-[#c5a880] hover:bg-[#b89868] text-[#0b0f17] font-semibold text-xs uppercase tracking-[0.22em] transition-all duration-300 shadow-2xl shadow-[#c5a880]/30 hover:scale-[1.02] cursor-pointer"
            >
              Book Your Stay
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="w-full sm:w-auto px-8 py-4 rounded-sm border border-white/30 hover:border-[#c5a880] text-[#fcfbf9] hover:text-[#c5a880] text-xs uppercase tracking-[0.2em] font-medium transition-colors"
            >
              Contact Concierge
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 9 — FOOTER
          Minimal, premium footer with contact, navigation links, and copyright
      ========================================================================= */}
      <footer id="contact" className="bg-[#080b11] border-t border-white/10 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-white/10">
            {/* Col 1: Hotel Name & Description */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-sm border border-[#c5a880]/60 flex items-center justify-center text-[#c5a880] font-serif text-lg font-bold">
                  L
                </div>
                <span className="font-serif text-xl font-normal tracking-[0.2em] text-[#fcfbf9] uppercase">
                  Luxury Hotel
                </span>
              </div>
              <p className="text-xs text-[#fcfbf9]/60 font-light leading-relaxed max-w-sm">
                A premier boutique coastal hotel blending understated modern elegance, bespoke accommodations, and genuine hospitality along Marine Drive.
              </p>
              <div className="pt-2 text-[11px] font-mono text-[#c5a880]">
                Beach Road Marine Drive, Visakhapatnam, Andhra Pradesh 530003, India
              </div>
            </div>

            {/* Col 2: Navigation Links */}
            <div className="lg:col-span-3 space-y-3">
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#c5a880]">
                Quick Navigation
              </p>
              <ul className="space-y-2 text-xs text-[#fcfbf9]/75 font-light">
                <li>
                  <button onClick={() => scrollToSection('hero')} className="hover:text-[#c5a880] transition-colors cursor-pointer">
                    Home
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('rooms')} className="hover:text-[#c5a880] transition-colors cursor-pointer">
                    Rooms & Suites
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('experiences')} className="hover:text-[#c5a880] transition-colors cursor-pointer">
                    Hotel Experiences
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('about')} className="hover:text-[#c5a880] transition-colors cursor-pointer">
                    About Luxury Hotel
                  </button>
                </li>
                <li>
                  <button onClick={() => handleOpenBooking()} className="hover:text-[#c5a880] transition-colors cursor-pointer text-[#c5a880]">
                    Direct Reservation
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Verified Contact Details */}
            <div className="lg:col-span-4 space-y-3">
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#c5a880]">
                Front Desk & Concierge
              </p>
              <div className="space-y-2.5 text-xs text-[#fcfbf9]/75 font-light">
                <div className="flex items-center gap-2.5">
                  <Phone className="w-3.5 h-3.5 text-[#c5a880] shrink-0" />
                  <span>+91 79930 62979 (24/7 Desk)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-3.5 h-3.5 text-[#c5a880] shrink-0" />
                  <span>reservations@naiduhotel.com</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Clock className="w-3.5 h-3.5 text-[#c5a880] shrink-0 mt-0.5" />
                  <span>Check-In: 2:00 PM · Check-Out: 11:00 AM</span>
                </div>
                <div className="pt-2">
                  <button
                    onClick={onNavigateToLogin}
                    className="inline-flex items-center gap-1.5 text-xs text-[#c5a880] hover:underline uppercase tracking-wider font-mono cursor-pointer"
                  >
                    <span>Staff & Management Portal</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#fcfbf9]/40 font-light">
            <p>© 2026 Luxury Hotel. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span>Privacy Guarantee</span>
              <span>·</span>
              <span>Terms of Service</span>
              <span>·</span>
              <span>GST Hospitality Compliant</span>
            </div>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          ROOM DETAILS PREVIEW MODAL
          Allows inspecting room blueprints, full amenities, capacity, and booking
      ========================================================================= */}
      {inspectingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#121620] border border-[#c5a880]/40 rounded-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            {/* Close button */}
            <button
              onClick={() => setInspectingRoom(null)}
              className="absolute top-4 right-4 z-10 p-1.5 bg-[#0b0f17]/80 rounded-full text-white/80 hover:text-white border border-white/20 transition-colors"
              aria-label="Close details"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Room Image Banner */}
            <div className="relative h-60 sm:h-72 w-full bg-slate-900">
              <img
                src={ROOM_IMAGES[inspectingRoom.name] || DEFAULT_ROOM_IMAGE}
                alt={inspectingRoom.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121620] via-transparent to-black/30" />
              <div className="absolute bottom-4 left-6 right-6">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#c5a880]">
                  {inspectingRoom.code} · Floor Plan
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl text-white">
                  {inspectingRoom.name}
                </h3>
              </div>
            </div>

            {/* Room Details Body */}
            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#c5a880] mb-2">
                  Suite Description
                </h4>
                <p className="text-sm text-white/75 font-light leading-relaxed">
                  {inspectingRoom.description}
                </p>
              </div>

              {/* Room Specifications */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-[#0b0f17] border border-white/10 rounded-sm">
                <div>
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-white/50">Capacity</span>
                  <span className="font-serif text-lg text-[#c5a880]">
                    {inspectingRoom.capacity} {inspectingRoom.capacity === 1 ? 'Guest' : 'Guests'}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-white/50">Room Size</span>
                  <span className="font-serif text-lg text-[#c5a880]">
                    {inspectingRoom.sizeSqFt || 320} sq ft
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-white/50">Bed Arrangement</span>
                  <span className="font-serif text-lg text-[#c5a880] truncate block">
                    {inspectingRoom.bedType || 'Plush King'}
                  </span>
                </div>
              </div>

              {/* Included Amenities */}
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#c5a880] mb-3">
                  Signature Amenities Included
                </h4>
                <div className="grid grid-cols-2 gap-2.5">
                  {inspectingRoom.amenities.map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-white/80">
                      <Check className="w-3.5 h-3.5 text-[#c5a880] shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer with Pricing & Direct Booking */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4">
                <div>
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-white/50">Tariff per night</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-2xl text-[#c5a880]">
                      ₹{inspectingRoom.basePrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-white/50 font-light">+ GST (12%)</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setInspectingRoom(null)}
                    className="px-4 py-2.5 rounded-sm border border-white/20 text-xs text-white/80 hover:text-white"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      const rm = inspectingRoom;
                      setInspectingRoom(null);
                      handleOpenBooking(rm);
                    }}
                    className="px-5 py-2.5 rounded-sm bg-[#c5a880] hover:bg-[#b89868] text-[#0b0f17] text-xs uppercase tracking-wider font-semibold transition-all duration-200 cursor-pointer shadow-md"
                  >
                    Book This Suite
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          REUSED CUSTOMER BOOKING MODAL
          Preserves 100% of the existing booking logic, KYC validation & Razorpay!
      ========================================================================= */}
      {isBookingModalOpen && (
        <CustomerBookingModal
          isOpen={isBookingModalOpen}
          roomType={bookingModalRoom}
          defaultCheckIn={checkIn}
          defaultCheckOut={checkOut}
          defaultGuests={adults}
          onClose={() => setIsBookingModalOpen(false)}
        />
      )}
    </div>
  );
};
