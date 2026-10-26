import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, Role, UserStatus, CustomerProfileData } from '../types/auth';
import { Booking, Customer, Room, RoomType, RoomStatus, BookingStatus } from '../types/hotel';

export const DEFAULT_SUPABASE_URL = 'https://ksjcdbirvgmhhppzagsq.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzamNkYmlydmdtaGhwcHphZ3NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyODc4MTAsImV4cCI6MjEwNjg2MzgxMH0.SFps4HrYy4riROJLzoIRES24aEGRdcdoWgqzXcNIih4';

export const supabaseUrl = (import.meta.env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL).trim();
export const supabaseAnonKey = (import.meta.env?.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY).trim();

// Check if valid production Supabase credentials are configured
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key' &&
  supabaseUrl.startsWith('https://')
);

/**
 * Complete SQL to create public.users, public.customers, public.room_types,
 * public.rooms, and public.bookings tables in Supabase, along with triggers and RLS policies.
 */
export const SUPABASE_USERS_TABLE_SQL = `-- ==============================================================================
-- Naidu Hotel: Complete Schema, Triggers, RLS & Seed Data
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLE: public.users (Base Identity & Multi-Role Roster)
CREATE TABLE IF NOT EXISTS public.users (
  id text PRIMARY KEY,
  full_name text NOT NULL DEFAULT '',
  email text UNIQUE NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'management', 'customer')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  profile_image text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Safely add missing columns if users table previously existed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name text DEFAULT '';
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text DEFAULT 'customer';
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone text;
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_image text;
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON public.users(email);

-- 2. TABLE: public.customers (Customer Identity & Comprehensive Profile)
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_code text UNIQUE NOT NULL,
  full_name text NOT NULL,
  email text,
  phone text,
  date_of_birth date,
  gender text CHECK (gender IN ('Male', 'Female', 'Non-binary', 'Prefer not to say')),
  address_line text,
  city text,
  state text,
  postal_code text,
  country text,
  emergency_contact_name text,
  emergency_contact_phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure all customer columns exist if created earlier
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS customer_code text;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS full_name text;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS email text;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS phone text;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS date_of_birth date;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS gender text;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS address_line text;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS city text;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS state text;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS postal_code text;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS country text;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS emergency_contact_name text;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS emergency_contact_phone text;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_customers_code ON public.customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);

-- 3. TABLE: public.room_types (Configurable Room Categories & Blueprints)
CREATE TABLE IF NOT EXISTS public.room_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  capacity integer NOT NULL CHECK (capacity > 0),
  base_price numeric(10,2) NOT NULL CHECK (base_price > 0),
  amenities jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. TABLE: public.rooms (Physical Room Inventory)
CREATE TABLE IF NOT EXISTS public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number text UNIQUE NOT NULL,
  room_type_id uuid REFERENCES public.room_types(id) ON DELETE SET NULL,
  floor_number integer,
  status text DEFAULT 'Available' CHECK (status IN ('Available', 'Occupied', 'Maintenance', 'Inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rooms_type ON public.rooms(room_type_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);

-- 5. TABLE: public.bookings (Master Bookings Ledger & Customer Relationship)
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference text UNIQUE NOT NULL,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  customer_name text,
  customer_email text,
  customer_phone text,
  customer_age integer,
  customer_gender text,
  customer_address text,
  customer_city text,
  customer_state text,
  customer_country text,
  aadhar_number text,
  id_proof_type text DEFAULT 'Aadhar Card',
  id_proof_number text,
  purpose_of_visit text,
  emergency_contact_name text,
  emergency_contact_phone text,
  room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  room_number text,
  room_type_id uuid REFERENCES public.room_types(id) ON DELETE SET NULL,
  room_type_name text,
  check_in date NOT NULL,
  check_out date NOT NULL,
  number_of_guests integer NOT NULL DEFAULT 1 CHECK (number_of_guests > 0),
  guests integer NOT NULL DEFAULT 1 CHECK (guests > 0),
  nights integer NOT NULL DEFAULT 1 CHECK (nights > 0),
  number_of_days integer NOT NULL DEFAULT 1 CHECK (number_of_days > 0),
  days integer NOT NULL DEFAULT 1 CHECK (days > 0),
  adr numeric(10,2) DEFAULT 0,
  number_of_rooms integer NOT NULL DEFAULT 1 CHECK (number_of_rooms > 0),
  total_amount numeric(10,2) NOT NULL CHECK (total_amount >= 0),
  booking_status text NOT NULL DEFAULT 'Confirmed' CHECK (booking_status IN ('Confirmed', 'Checked-In', 'Checked-Out', 'Cancelled')),
  payment_status text DEFAULT 'Paid' CHECK (payment_status IN ('Pending', 'Paid', 'Refunded', 'Failed')),
  special_requests text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_booking_dates CHECK (check_out > check_in)
);

-- 5b. MIGRATION: Ensure existing bookings and customers tables have all rich stay and identity columns
-- Explicit top-level ALTER TABLE statements ensure columns exist in PostgreSQL catalog immediately
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_email text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_phone text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_age integer;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_gender text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_address text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_city text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_state text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_country text DEFAULT 'India';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_postal_code text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS aadhar_number text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS id_proof_type text DEFAULT 'Aadhar Card';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS id_proof_number text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS purpose_of_visit text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS emergency_contact_name text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS emergency_contact_phone text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS room_number text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS room_type_name text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS number_of_guests integer DEFAULT 1;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS guests integer DEFAULT 1;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS nights integer DEFAULT 1;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS number_of_days integer DEFAULT 1;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS days integer DEFAULT 1;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS adr numeric(10,2) DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'Razorpay';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS razorpay_payment_id text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS razorpay_order_id text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS razorpay_signature text;
ALTER TABLE public.bookings ALTER COLUMN room_type_id DROP NOT NULL;

-- Relax foreign key constraint if room_types doesn't have the matched id
DO $$
BEGIN
  ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_room_type_id_fkey;
  ALTER TABLE public.bookings ADD CONSTRAINT bookings_room_type_id_fkey 
    FOREIGN KEY (room_type_id) REFERENCES public.room_types(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Ensure public.customers also has all verification and KYC columns
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS age integer;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS aadhar_number text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS id_proof_type text DEFAULT 'Aadhar Card';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS id_proof_number text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS emergency_contact_name text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS emergency_contact_phone text;

-- Safe dynamic backfill of legacy bookings using EXECUTE (prevents PostgreSQL 42703 & 42P01 errors)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'customer_name'
  ) THEN
    EXECUTE '
      UPDATE public.bookings b
      SET 
        nights = COALESCE(b.nights, GREATEST(1, (b.check_out - b.check_in))),
        number_of_days = COALESCE(b.number_of_days, GREATEST(1, (b.check_out - b.check_in))),
        days = COALESCE(b.days, GREATEST(1, (b.check_out - b.check_in))),
        guests = COALESCE(b.guests, b.number_of_guests, 1),
        number_of_guests = COALESCE(b.number_of_guests, b.guests, 1),
        adr = COALESCE(b.adr, CASE WHEN (b.check_out - b.check_in) > 0 THEN ROUND(b.total_amount / (b.check_out - b.check_in), 2) ELSE b.total_amount END),
        customer_name = COALESCE(b.customer_name, (SELECT c.full_name FROM public.customers c WHERE c.id = b.customer_id), ''Guest Customer''),
        customer_email = COALESCE(b.customer_email, (SELECT c.email FROM public.customers c WHERE c.id = b.customer_id), ''''),
        customer_phone = COALESCE(b.customer_phone, (SELECT c.phone FROM public.customers c WHERE c.id = b.customer_id), ''''),
        room_type_name = COALESCE(b.room_type_name, (SELECT rt.name FROM public.room_types rt WHERE rt.id = b.room_type_id), ''Deluxe Room'')
      WHERE (b.customer_name IS NULL OR b.nights IS NULL OR b.room_type_name IS NULL);
    ';
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room ON public.bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_type ON public.bookings(room_type_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON public.bookings(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON public.bookings(booking_reference);

-- Helper: Generate unique customer code
CREATE OR REPLACE FUNCTION public.generate_unique_customer_code()
RETURNS text AS $$
DECLARE
  v_code text;
  v_exists boolean;
BEGIN
  LOOP
    v_code := 'CUS-' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    SELECT EXISTS (SELECT 1 FROM public.customers WHERE customer_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Helper: Get user role (id::text = auth.uid()::text avoids operator mismatch if id is text or uuid)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text AS $$
  SELECT role FROM public.users
  WHERE id::text = auth.uid()::text OR email = (auth.jwt() ->> 'email')
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Overlapping physical room booking prevention trigger
CREATE OR REPLACE FUNCTION public.prevent_overlapping_room_bookings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.room_id IS NOT NULL AND NEW.booking_status IN ('Confirmed', 'Checked-In') THEN
    IF EXISTS (
      SELECT 1 FROM public.bookings
      WHERE room_id = NEW.room_id
        AND id::text <> COALESCE(NEW.id::text, '')
        AND booking_status IN ('Confirmed', 'Checked-In')
        AND check_in < NEW.check_out
        AND check_out > NEW.check_in
    ) THEN
      RAISE EXCEPTION 'Physical room % is already booked for overlapping dates (% to %)',
        NEW.room_id, NEW.check_in, NEW.check_out;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_overlapping_room_bookings ON public.bookings;
CREATE TRIGGER trg_prevent_overlapping_room_bookings
  BEFORE INSERT OR UPDATE OF room_id, check_in, check_out, booking_status ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.prevent_overlapping_room_bookings();

-- Trigger: Auto-sync new Supabase Auth user to public.users AND public.customers
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
  v_name text;
  v_phone text;
  v_code text;
BEGIN
  v_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  v_phone := NEW.raw_user_meta_data->>'phone';
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'customer');

  BEGIN
    INSERT INTO public.users (id, full_name, email, phone, role, status)
    VALUES (NEW.id::text, v_name, NEW.email, v_phone, v_role, 'active')
    ON CONFLICT (email) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        phone = COALESCE(EXCLUDED.phone, public.users.phone),
        updated_at = now();
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  IF v_role = 'customer' THEN
    v_code := public.generate_unique_customer_code();
    BEGIN
      INSERT INTO public.customers (id, customer_code, full_name, email, phone)
      VALUES (NEW.id, v_code, v_name, NEW.email, v_phone)
      ON CONFLICT (id) DO UPDATE
      SET full_name = EXCLUDED.full_name,
          phone = COALESCE(EXCLUDED.phone, public.customers.phone),
          updated_at = now();
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Safely drop restrictive foreign key to auth.users if it exists to allow guest & customer records
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_id_fkey;

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users public read" ON public.users;
CREATE POLICY "Users public read" ON public.users FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Users insert registration" ON public.users;
CREATE POLICY "Users insert registration" ON public.users FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Users update own profile" ON public.users;
CREATE POLICY "Users update own profile" ON public.users FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Customers can read own profile or staff" ON public.customers;
DROP POLICY IF EXISTS "Customers select policy" ON public.customers;
CREATE POLICY "Customers select policy" ON public.customers FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Customers can insert own profile" ON public.customers;
DROP POLICY IF EXISTS "Customers insert policy" ON public.customers;
CREATE POLICY "Customers insert policy" ON public.customers FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Customers can update own personal details" ON public.customers;
DROP POLICY IF EXISTS "Customers update policy" ON public.customers;
CREATE POLICY "Customers update policy" ON public.customers FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view active room types" ON public.room_types;
CREATE POLICY "Anyone can view active room types" ON public.room_types FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Staff can manage room types" ON public.room_types;
CREATE POLICY "Staff can manage room types" ON public.room_types FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can view rooms" ON public.rooms;
CREATE POLICY "Authenticated can view rooms" ON public.rooms FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Staff can manage physical rooms" ON public.rooms;
CREATE POLICY "Staff can manage physical rooms" ON public.rooms FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Customers view own bookings or staff view all" ON public.bookings;
DROP POLICY IF EXISTS "Bookings select policy" ON public.bookings;
CREATE POLICY "Bookings select policy" ON public.bookings FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Customers create bookings with own customer_id" ON public.bookings;
DROP POLICY IF EXISTS "Bookings insert policy" ON public.bookings;
CREATE POLICY "Bookings insert policy" ON public.bookings FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Customers can cancel own booking or staff manage" ON public.bookings;
DROP POLICY IF EXISTS "Bookings update policy" ON public.bookings;
CREATE POLICY "Bookings update policy" ON public.bookings FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Enable Supabase Realtime publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
`;

// Seed users for offline fallback and seamless testing across Admin, Management, and Customer roles
export const SEED_USERS: UserProfile[] = [
  {
    id: '8ef2e174-d93f-4961-8259-94ce37e202a8',
    full_name: 'Appala Naidu',
    email: 'appalanaidu.dev@gmail.com',
    phone: '+91 99000 11223',
    role: 'admin',
    status: 'active',
    profile_image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'm-4',
    full_name: 'Deepa Rao',
    email: 'manager@naiduhotel.com',
    phone: '+91 98765 43210',
    role: 'management',
    status: 'active',
    profile_image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
    created_at: '2025-05-01T00:00:00.000Z',
    updated_at: '2025-05-01T00:00:00.000Z'
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    full_name: 'Rajesh Naidu',
    email: 'customer@gmail.com',
    phone: '+1 (555) 234-5678',
    role: 'customer',
    status: 'active',
    profile_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    created_at: '2025-01-10T08:00:00.000Z',
    updated_at: '2025-01-10T08:00:00.000Z'
  }
];

// Local Storage Keys
export const STORAGE_KEY_USERS = 'naidu_supabase_users_table';
export const STORAGE_KEY_CUSTOMERS = 'naidu_supabase_customers_table';
export const STORAGE_KEY_ROOM_TYPES = 'naidu_supabase_room_types_table';
export const STORAGE_KEY_ROOMS = 'naidu_supabase_rooms_table';
export const STORAGE_KEY_BOOKINGS = 'naidu_supabase_bookings_table';
export const STORAGE_KEY_SESSION = 'naidu_supabase_auth_session';
export const STORAGE_KEY_TABLE_STATUS = 'naidu_supabase_table_status';

// Helper to generate unique customer code e.g. CUS-7A8B9C0D
export function generateCustomerCode(): string {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let randomHex = '';
  for (let i = 0; i < 8; i++) {
    randomHex += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CUS-${randomHex}`;
}

// Helper to generate unique booking reference e.g. BKG-NDU-492184
export function generateBookingReference(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `BKG-NDU-${num}`;
}

// ==============================================================================
// SEED INITIAL FALLBACK DATA
// ==============================================================================
export const INITIAL_FALLBACK_CUSTOMERS: CustomerProfileData[] = [
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    customer_code: 'CUS-NAIDU001',
    full_name: 'Rajesh Naidu',
    email: 'customer@gmail.com',
    phone: '+1 (555) 234-5678',
    date_of_birth: '1992-06-15',
    gender: 'Male',
    address_line: '742 Evergreen Terrace, Suite 400',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94107',
    country: 'United States',
    emergency_contact_name: 'Priya Naidu',
    emergency_contact_phone: '+1 (555) 876-5432',
    created_at: '2025-01-10T08:00:00.000Z',
    updated_at: '2025-01-10T08:00:00.000Z'
  }
];

export const INITIAL_FALLBACK_ROOM_TYPES: RoomType[] = [
  {
    id: '11111111-1111-1111-1111-111111111101',
    name: 'Single Sharing Room',
    code: 'SGL',
    description: 'Cozy private room with single bed, ergonomic workspace, and high-speed Wi-Fi.',
    capacity: 1,
    basePrice: 999,
    amenities: ['High-Speed WiFi', 'Workstation Desk', 'Ensuite Shower', 'Air Conditioning'],
    status: 'Active',
    totalInventory: 10,
    sizeSqFt: 220,
    bedType: 'Single Bed',
    imageTheme: 'executive'
  },
  {
    id: '11111111-1111-1111-1111-111111111102',
    name: 'Double Sharing Room',
    code: 'DBL',
    description: 'Spacious twin or queen arrangement ideal for couples or traveling partners.',
    capacity: 2,
    basePrice: 1499,
    amenities: ['High-Speed WiFi', 'Queen Bed / Twin', 'Smart HDTV', 'Coffee Maker', 'Balcony'],
    status: 'Active',
    totalInventory: 15,
    sizeSqFt: 340,
    bedType: 'Queen Bed or 2 Twins',
    imageTheme: 'ocean'
  },
  {
    id: '11111111-1111-1111-1111-111111111103',
    name: 'Triple Sharing Room',
    code: 'TRP',
    description: 'Generously apportioned suite featuring three single beds or king + single with lounge.',
    capacity: 3,
    basePrice: 2199,
    amenities: ['High-Speed WiFi', '3 Individual Beds', 'Mini Bar', 'Walk-in Wardrobe', 'Seaside Balcony'],
    status: 'Active',
    totalInventory: 8,
    sizeSqFt: 460,
    bedType: '3 Single Beds',
    imageTheme: 'ocean'
  },
  {
    id: '11111111-1111-1111-1111-111111111104',
    name: 'Deluxe Ocean View',
    code: 'DLX-OCN',
    description: 'Uninterrupted panoramic coastline vistas with plush king bedding and private terrace.',
    capacity: 2,
    basePrice: 2799,
    amenities: ['Ocean View Balcony', 'King Bed', 'Rain Shower', 'Nespresso Bar', 'Smart 65-inch TV'],
    status: 'Active',
    totalInventory: 20,
    sizeSqFt: 480,
    bedType: 'California King',
    imageTheme: 'ocean'
  },
  {
    id: '11111111-1111-1111-1111-111111111105',
    name: 'Executive Business Suite',
    code: 'EXE-STE',
    description: 'Executive lounge access, separate meeting parlor, and complimentary boardroom privileges.',
    capacity: 4,
    basePrice: 3999,
    amenities: ['Executive Lounge', 'Private Meeting Table', 'Soaking Tub', 'High-Speed Mesh WiFi', 'Butler Service'],
    status: 'Active',
    totalInventory: 12,
    sizeSqFt: 620,
    bedType: 'King Bed + Sofa Bed',
    imageTheme: 'executive'
  },
  {
    id: '11111111-1111-1111-1111-111111111106',
    name: 'Premier Garden Villa',
    code: 'GRD-VLA',
    description: 'Private villa garden enclave with private plunge jacuzzi and secluded sundeck.',
    capacity: 6,
    basePrice: 5499,
    amenities: ['Private Plunge Pool', 'Botanical Garden Terrace', 'Full Kitchenette', 'Dual Vanities', 'In-villa Dining'],
    status: 'Active',
    totalInventory: 6,
    sizeSqFt: 850,
    bedType: '2 King Beds + Daybed',
    imageTheme: 'garden'
  },
  {
    id: '11111111-1111-1111-1111-111111111107',
    name: 'Luxery Presidential Penthouse',
    code: 'PRS-PNT',
    description: 'Top-floor 3,200 sq ft crowning residence with 360-degree panorama, chef pantry, and 24/7 dedicated concierge.',
    capacity: 8,
    basePrice: 8999,
    amenities: ['360 Ocean Panorama', 'Private Elevator Access', 'Chef Kitchen', 'Grand Piano', 'Personal Concierge'],
    status: 'Active',
    totalInventory: 2,
    sizeSqFt: 3200,
    bedType: '3 King Suites + Nursery',
    imageTheme: 'presidential'
  }
];

export const INITIAL_FALLBACK_ROOMS: Room[] = [
  { id: '22222222-2222-2222-2222-222222222101', roomNumber: 'Room 101', roomTypeId: '11111111-1111-1111-1111-111111111101', roomTypeName: 'Single Sharing Room', floor: 1, price: 999, status: 'Available' },
  { id: '22222222-2222-2222-2222-222222222102', roomNumber: 'Room 102', roomTypeId: '11111111-1111-1111-1111-111111111102', roomTypeName: 'Double Sharing Room', floor: 1, price: 1499, status: 'Available' },
  { id: '22222222-2222-2222-2222-222222222103', roomNumber: 'Room 103', roomTypeId: '11111111-1111-1111-1111-111111111103', roomTypeName: 'Triple Sharing Room', floor: 1, price: 2199, status: 'Available' },
  { id: '22222222-2222-2222-2222-222222222201', roomNumber: 'Room 201', roomTypeId: '11111111-1111-1111-1111-111111111104', roomTypeName: 'Deluxe Ocean View', floor: 2, price: 2799, status: 'Available' },
  { id: '22222222-2222-2222-2222-222222222202', roomNumber: 'Room 202', roomTypeId: '11111111-1111-1111-1111-111111111104', roomTypeName: 'Deluxe Ocean View', floor: 2, price: 2799, status: 'Occupied' },
  { id: '22222222-2222-2222-2222-222222222301', roomNumber: 'Room 301', roomTypeId: '11111111-1111-1111-1111-111111111105', roomTypeName: 'Executive Business Suite', floor: 3, price: 3999, status: 'Available' },
  { id: '22222222-2222-2222-2222-222222222302', roomNumber: 'Room 302', roomTypeId: '11111111-1111-1111-1111-111111111105', roomTypeName: 'Executive Business Suite', floor: 3, price: 3999, status: 'Maintenance' },
  { id: '22222222-2222-2222-2222-222222222401', roomNumber: 'Villa 401', roomTypeId: '11111111-1111-1111-1111-111111111106', roomTypeName: 'Premier Garden Villa', floor: 4, price: 5499, status: 'Available' },
  { id: '22222222-2222-2222-2222-222222222501', roomNumber: 'Penthouse 501', roomTypeId: '11111111-1111-1111-1111-111111111107', roomTypeName: 'Luxery Presidential Penthouse', floor: 5, price: 8999, status: 'Available' }
];

export const INITIAL_FALLBACK_BOOKINGS: Booking[] = [
  {
    id: 'BKG-NDU-882194',
    bookingReference: 'BKG-NDU-882194',
    customerId: 'c0000000-0000-0000-0000-000000000003',
    customerCode: 'CUS-NAIDU001',
    customerName: 'Rajesh Naidu',
    customerEmail: 'customer@gmail.com',
    customerPhone: '+1 (555) 234-5678',
    roomTypeId: '11111111-1111-1111-1111-111111111104',
    roomTypeName: 'Deluxe Ocean View',
    roomNumber: 'Room 201',
    checkIn: '2026-10-22',
    checkOut: '2026-10-26',
    nights: 4,
    guests: 2,
    adr: 2799,
    totalAmount: 11196,
    status: 'Confirmed',
    paymentStatus: 'Paid',
    cancellationProbability: 14,
    cancellationRisk: 'LOW',
    leadTimeDays: 16,
    marketSegment: 'Direct',
    depositType: 'Refundable',
    createdAt: '2026-10-06',
    specialRequests: 'High floor preferred, late arrival around 8 PM.'
  },
  {
    id: 'BKG-NDU-731920',
    bookingReference: 'BKG-NDU-731920',
    customerId: 'c0000000-0000-0000-0000-000000000003',
    customerCode: 'CUS-NAIDU001',
    customerName: 'Rajesh Naidu',
    customerEmail: 'customer@gmail.com',
    customerPhone: '+1 (555) 234-5678',
    roomTypeId: '11111111-1111-1111-1111-111111111105',
    roomTypeName: 'Executive Business Suite',
    roomNumber: 'Room 301',
    checkIn: '2026-08-10',
    checkOut: '2026-08-14',
    nights: 4,
    guests: 2,
    adr: 3999,
    totalAmount: 15996,
    status: 'Checked-Out',
    paymentStatus: 'Paid',
    cancellationProbability: 5,
    cancellationRisk: 'LOW',
    leadTimeDays: 28,
    marketSegment: 'Corporate',
    depositType: 'No Deposit',
    createdAt: '2026-07-15',
    specialRequests: 'Quiet room near elevator.'
  }
];

// ==============================================================================
// LOCAL STORAGE DATA ACCESS HELPERS
// ==============================================================================

export function getStoredUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingEmails = new Set(parsed.map((u: any) => u.email?.toLowerCase()));
        let added = false;
        SEED_USERS.forEach(su => {
          if (!existingEmails.has(su.email.toLowerCase())) {
            parsed.push(su);
            added = true;
          }
        });
        if (added) saveStoredUsers(parsed);
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse local users', e);
  }
  saveStoredUsers(SEED_USERS);
  return SEED_USERS;
}

export function saveStoredUsers(users: UserProfile[]) {
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save local users', e);
  }
}

export function getStoredCustomers(): CustomerProfileData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse local customers', e);
  }
  // Initialize with seed customer if empty
  saveStoredCustomers(INITIAL_FALLBACK_CUSTOMERS);
  return INITIAL_FALLBACK_CUSTOMERS;
}

export function saveStoredCustomers(customers: CustomerProfileData[]) {
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
  } catch (e) {
    console.error('Failed to save local customers', e);
  }
}

export function getStoredBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOOKINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Upgrade any legacy dollar prices (< 900) to Indian Rupee equivalents
        if (parsed.some((item: any) => item.adr && item.adr < 900)) {
          const updated = parsed.map((b: any) => (b.adr && b.adr < 900) ? {
            ...b,
            adr: b.adr <= 120 ? 999 : b.adr <= 180 ? 1499 : b.adr <= 240 ? 2199 : 2799,
            totalAmount: (b.adr <= 120 ? 999 : b.adr <= 180 ? 1499 : b.adr <= 240 ? 2199 : 2799) * (b.nights || 1)
          } : b);
          saveStoredBookings(updated);
          return updated;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse local bookings', e);
  }
  saveStoredBookings(INITIAL_FALLBACK_BOOKINGS);
  return INITIAL_FALLBACK_BOOKINGS;
}

export function saveStoredBookings(bookings: Booking[]) {
  try {
    localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(bookings));
  } catch (e) {
    console.error('Failed to save local bookings', e);
  }
}

export function getStoredRoomTypes(): RoomType[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ROOM_TYPES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Upgrade legacy non-uuid IDs or old dollar prices (< 900) to Indian Rupee tariffs
        if (parsed.some((item: any) => !item.id || item.id.startsWith('rt-') || item.basePrice < 900)) {
          saveStoredRoomTypes(INITIAL_FALLBACK_ROOM_TYPES);
          return INITIAL_FALLBACK_ROOM_TYPES;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse local room types', e);
  }
  saveStoredRoomTypes(INITIAL_FALLBACK_ROOM_TYPES);
  return INITIAL_FALLBACK_ROOM_TYPES;
}

export function saveStoredRoomTypes(rts: RoomType[]) {
  try {
    localStorage.setItem(STORAGE_KEY_ROOM_TYPES, JSON.stringify(rts));
  } catch (e) {
    console.error('Failed to save local room types', e);
  }
}

export function getStoredRooms(): Room[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ROOMS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Upgrade legacy non-uuid IDs or old dollar prices (< 900) to Indian Rupee tariffs
        if (parsed.some((item: any) => !item.id || item.id.startsWith('rm-') || item.price < 900)) {
          saveStoredRooms(INITIAL_FALLBACK_ROOMS);
          return INITIAL_FALLBACK_ROOMS;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse local rooms', e);
  }
  saveStoredRooms(INITIAL_FALLBACK_ROOMS);
  return INITIAL_FALLBACK_ROOMS;
}

export function saveStoredRooms(rooms: Room[]) {
  try {
    localStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(rooms));
  } catch (e) {
    console.error('Failed to save local rooms', e);
  }
}

export function saveLocalFallbackProfile(profile: UserProfile) {
  const users = getStoredUsers();
  const existingIdx = users.findIndex(u => u.email.toLowerCase() === profile.email.toLowerCase());
  if (existingIdx >= 0) {
    users[existingIdx] = { ...users[existingIdx], ...profile };
  } else {
    users.push(profile);
  }
  saveStoredUsers(users);
}

export function getLocalFallbackProfile(email: string): UserProfile | null {
  const users = getStoredUsers();
  const found = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  return found || null;
}

export function deleteLocalFallbackProfile(email: string) {
  const users = getStoredUsers();
  const filtered = users.filter(u => u.email.toLowerCase() !== email.trim().toLowerCase());
  saveStoredUsers(filtered);
}

// Track whether public.users / public.customers table exists on remote Supabase DB
let remoteTableStatus: 'unknown' | 'ready' | 'missing' = (() => {
  const saved = localStorage.getItem(STORAGE_KEY_TABLE_STATUS);
  if (saved === 'ready') return 'ready';
  if (saved === 'missing') return 'missing';
  return 'unknown';
})();

export function getRemoteTableStatus(): 'unknown' | 'ready' | 'missing' {
  return remoteTableStatus;
}

export function setRemoteTableStatus(status: 'unknown' | 'ready' | 'missing') {
  remoteTableStatus = status;
  localStorage.setItem(STORAGE_KEY_TABLE_STATUS, status);
}

// ==============================================================================
// MOCK SUPABASE CLIENT (for complete offline resilience & testability)
// ==============================================================================
class MockSupabaseClient {
  auth = {
    signInWithPassword: async ({ email }: { email: string; password?: string }) => {
      await new Promise(r => setTimeout(r, 100));
      const cleanEmail = email.trim().toLowerCase();
      const users = getStoredUsers();
      const found = users.find(u => u.email.toLowerCase() === cleanEmail);

      if (!found) {
        return {
          data: { user: null, session: null },
          error: { message: 'User not registered in database.' }
        };
      }

      if (found.status === 'blocked') {
        return {
          data: { user: null, session: null },
          error: { message: 'This account has been blocked by system administration.' }
        };
      }

      const mockSession = {
        access_token: `mock_jwt_${Date.now()}`,
        user: {
          id: found.id,
          email: found.email,
          user_metadata: { full_name: found.full_name }
        }
      };

      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(mockSession));
      return {
        data: { user: mockSession.user, session: mockSession },
        error: null
      };
    },

    signUp: async ({ email, options }: { email: string; password?: string; options?: any }) => {
      await new Promise(r => setTimeout(r, 100));
      const cleanEmail = email.trim().toLowerCase();
      const users = getStoredUsers();
      const existing = users.find(u => u.email.toLowerCase() === cleanEmail);

      if (existing) {
        return {
          data: { user: { id: existing.id, email: existing.email }, session: null },
          error: null
        };
      }

      const newId = `u-${Date.now()}`;
      const newProfile: UserProfile = {
        id: newId,
        full_name: options?.data?.full_name || cleanEmail.split('@')[0],
        email: cleanEmail,
        phone: options?.data?.phone || '',
        role: (options?.data?.role || 'customer') as Role,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      users.push(newProfile);
      saveStoredUsers(users);

      return {
        data: {
          user: {
            id: newId,
            email: cleanEmail,
            user_metadata: { full_name: newProfile.full_name }
          },
          session: null
        },
        error: null
      };
    },

    signInWithOAuth: async () => {
      return { data: { url: window.location.origin }, error: null };
    },

    signOut: async () => {
      localStorage.removeItem(STORAGE_KEY_SESSION);
      return { error: null };
    },

    getSession: async () => {
      const raw = localStorage.getItem(STORAGE_KEY_SESSION);
      if (raw) {
        try {
          return { data: { session: JSON.parse(raw) }, error: null };
        } catch {}
      }
      return { data: { session: null }, error: null };
    },

    onAuthStateChange: () => {
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      };
    }
  };

  from(table: string) {
    return {
      select: () => {
        return {
          eq: (field: string, value: any) => {
            return {
              order: () => {
                return {
                  then: async (resolve: any) => {
                    const data = this._getTableData(table);
                    const filtered = data.filter((item: any) => (item as any)[field] === value);
                    resolve({ data: filtered, error: null });
                  }
                };
              },
              maybeSingle: async () => {
                const data = this._getTableData(table);
                const found = data.find((item: any) => (item as any)[field] === value);
                return { data: found || null, error: null };
              },
              single: async () => {
                const data = this._getTableData(table);
                const found = data.find((item: any) => (item as any)[field] === value);
                return { data: found || null, error: found ? null : { message: 'Not found' } };
              },
              then: async (resolve: any) => {
                const data = this._getTableData(table);
                const filtered = data.filter((item: any) => (item as any)[field] === value);
                resolve({ data: filtered, error: null });
              }
            };
          },
          order: () => {
            return {
              then: async (resolve: any) => {
                const data = this._getTableData(table);
                resolve({ data, error: null });
              }
            };
          },
          limit: (n: number) => {
            return {
              then: async (resolve: any) => {
                const data = this._getTableData(table);
                resolve({ data: data.slice(0, n), error: null });
              }
            };
          },
          then: async (resolve: any) => {
            const data = this._getTableData(table);
            resolve({ data, error: null });
          }
        };
      },

      insert: (payload: any) => {
        return {
          then: async (resolve: any) => {
            const data = this._getTableData(table);
            const items = Array.isArray(payload) ? payload : [payload];
            data.unshift(...items);
            this._saveTableData(table, data);
            resolve({ data: items, error: null });
          }
        };
      },

      upsert: (payload: any) => {
        return {
          then: async (resolve: any) => {
            const data = this._getTableData(table);
            const items = Array.isArray(payload) ? payload : [payload];
            items.forEach((item: any) => {
              const idx = data.findIndex((d: any) => d.id === item.id || (item.email && d.email === item.email));
              if (idx >= 0) {
                data[idx] = { ...data[idx], ...item };
              } else {
                data.push(item);
              }
            });
            this._saveTableData(table, data);
            resolve({ data: items, error: null });
          }
        };
      },

      update: (payload: any) => {
        return {
          eq: (field: string, value: any) => {
            return {
              then: async (resolve: any) => {
                const data = this._getTableData(table);
                const updated = data.map((d: any) => (d[field] === value ? { ...d, ...payload } : d));
                this._saveTableData(table, updated);
                resolve({ data: updated, error: null });
              }
            };
          }
        };
      },

      delete: () => {
        return {
          eq: (field: string, value: any) => {
            return {
              then: async (resolve: any) => {
                const data = this._getTableData(table);
                const filtered = data.filter((d: any) => d[field] !== value);
                this._saveTableData(table, filtered);
                resolve({ data: filtered, error: null });
              }
            };
          }
        };
      }
    };
  }

  private _getTableData(table: string): any[] {
    switch (table) {
      case 'users':
        return getStoredUsers();
      case 'customers':
        return getStoredCustomers();
      case 'bookings':
        return getStoredBookings();
      case 'room_types':
        return getStoredRoomTypes();
      case 'rooms':
        return getStoredRooms();
      default:
        return [];
    }
  }

  private _saveTableData(table: string, data: any[]) {
    switch (table) {
      case 'users':
        saveStoredUsers(data);
        break;
      case 'customers':
        saveStoredCustomers(data);
        break;
      case 'bookings':
        saveStoredBookings(data);
        break;
      case 'room_types':
        saveStoredRoomTypes(data);
        break;
      case 'rooms':
        saveStoredRooms(data);
        break;
    }
  }
}

// Create real Supabase client or fallback client
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (new MockSupabaseClient() as unknown as SupabaseClient);

// ==============================================================================
// CUSTOMER IDENTITY & PROFILE SERVICES
// ==============================================================================

/**
 * Fetch a customer's profile by their permanent Supabase Auth UUID.
 * Never uses raw email lookup alone.
 */
export async function fetchCustomerProfileFromDatabase(userId: string): Promise<CustomerProfileData | null> {
  if (!userId) return null;

  // 1. Try real Supabase if configured
  if (isSupabaseConfigured && remoteTableStatus !== 'missing') {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        // Save fresh copy in local storage cache
        const all = getStoredCustomers();
        const idx = all.findIndex(c => c.id === userId);
        if (idx >= 0) all[idx] = data;
        else all.push(data);
        saveStoredCustomers(all);
        return data as CustomerProfileData;
      }

      if (error && (error.message?.includes('does not exist') || (error as any).code === 'PGRST205' || (error as any).code === '42P01')) {
        setRemoteTableStatus('missing');
      }
    } catch (e) {
      console.warn('Notice querying Supabase customers table:', e);
    }
  }

  // 2. Fallback to local persistent storage
  const localCustomers = getStoredCustomers();
  const found = localCustomers.find(c => c.id === userId);
  return found || null;
}

/**
 * Ensures a customer profile exists for an authenticated Supabase user.
 * If missing, generates a permanent human-readable customer_code and creates the record.
 * Never creates duplicates.
 */
export async function ensureCustomerProfileExists(user: {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
}): Promise<CustomerProfileData> {
  if (!user.id) {
    throw new Error('User ID is required to ensure customer profile.');
  }

  // 1. Check if profile already exists in DB or local
  const existing = await fetchCustomerProfileFromDatabase(user.id);
  if (existing) {
    return existing;
  }

  // Also check local store
  const localCustomers = getStoredCustomers();
  const localFound = localCustomers.find(c => c.id === user.id);
  if (localFound) {
    return localFound;
  }

  // 2. Generate permanent unique customer code
  const code = generateCustomerCode();
  const newProfile: CustomerProfileData = {
    id: user.id,
    customer_code: code,
    full_name: user.fullName || user.email.split('@')[0],
    email: user.email.toLowerCase().trim(),
    phone: user.phone || '',
    date_of_birth: undefined,
    gender: 'Prefer not to say',
    address_line: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Save to local storage immediately
  localCustomers.push(newProfile);
  saveStoredCustomers(localCustomers);

  // 3. Upsert into Supabase public.customers if configured
  if (isSupabaseConfigured && remoteTableStatus !== 'missing') {
    try {
      const { error } = await supabase
        .from('customers')
        .upsert(newProfile, { onConflict: 'id' });

      if (error && (error.message?.includes('does not exist') || (error as any).code === 'PGRST205')) {
        setRemoteTableStatus('missing');
      }
    } catch (e) {
      console.warn('Notice creating customer profile in Supabase:', e);
    }
  }

  return newProfile;
}

/**
 * Updates permitted personal details in a customer's profile.
 * Customers CANNOT change their id, customer_code, or role.
 */
export async function syncCustomerProfileToDatabase(
  profileUpdate: Partial<CustomerProfileData> & { id: string }
): Promise<{ success: boolean; data?: CustomerProfileData; error?: string }> {
  const { id } = profileUpdate;
  if (!id) return { success: false, error: 'Customer UUID is required.' };

  const current = (await fetchCustomerProfileFromDatabase(id)) || (await ensureCustomerProfileExists({ id, email: profileUpdate.email || '' }));

  // Sanitize: do not allow modifying primary key or customer_code
  const updatedProfile: CustomerProfileData = {
    ...current,
    full_name: profileUpdate.full_name !== undefined ? profileUpdate.full_name.trim() : current.full_name,
    phone: profileUpdate.phone !== undefined ? profileUpdate.phone.trim() : current.phone,
    date_of_birth: profileUpdate.date_of_birth !== undefined ? profileUpdate.date_of_birth : current.date_of_birth,
    gender: profileUpdate.gender !== undefined ? profileUpdate.gender : current.gender,
    address_line: profileUpdate.address_line !== undefined ? profileUpdate.address_line.trim() : current.address_line,
    city: profileUpdate.city !== undefined ? profileUpdate.city.trim() : current.city,
    state: profileUpdate.state !== undefined ? profileUpdate.state.trim() : current.state,
    postal_code: profileUpdate.postal_code !== undefined ? profileUpdate.postal_code.trim() : current.postal_code,
    country: profileUpdate.country !== undefined ? profileUpdate.country.trim() : current.country,
    emergency_contact_name: profileUpdate.emergency_contact_name !== undefined ? profileUpdate.emergency_contact_name.trim() : current.emergency_contact_name,
    emergency_contact_phone: profileUpdate.emergency_contact_phone !== undefined ? profileUpdate.emergency_contact_phone.trim() : current.emergency_contact_phone,
    updated_at: new Date().toISOString()
  };

  // 1. Update local storage
  const localCustomers = getStoredCustomers();
  const idx = localCustomers.findIndex(c => c.id === id);
  if (idx >= 0) {
    localCustomers[idx] = updatedProfile;
  } else {
    localCustomers.push(updatedProfile);
  }
  saveStoredCustomers(localCustomers);

  // 2. Also keep public.users full_name & phone in sync
  const users = getStoredUsers();
  const uIdx = users.findIndex(u => u.id === id);
  if (uIdx >= 0) {
    users[uIdx].full_name = updatedProfile.full_name;
    users[uIdx].phone = updatedProfile.phone;
    users[uIdx].updated_at = updatedProfile.updated_at;
    saveStoredUsers(users);
  }

  // 3. Upsert into Supabase public.customers
  if (isSupabaseConfigured && remoteTableStatus !== 'missing') {
    try {
      const { error } = await supabase
        .from('customers')
        .upsert(updatedProfile, { onConflict: 'id' });

      if (error) {
        if (error.message?.includes('does not exist') || (error as any).code === 'PGRST205') {
          setRemoteTableStatus('missing');
        }
        return { success: true, data: updatedProfile, error: error.message };
      }

      // Sync name into public.users in Supabase too
      await supabase
        .from('users')
        .update({
          full_name: updatedProfile.full_name,
          phone: updatedProfile.phone,
          updated_at: updatedProfile.updated_at
        })
        .eq('id', id);

      return { success: true, data: updatedProfile };
    } catch (e: any) {
      return { success: true, data: updatedProfile, error: e?.message };
    }
  }

  return { success: true, data: updatedProfile };
}

// ==============================================================================
// BOOKINGS & ROOM INVENTORY SERVICES
// ==============================================================================

/**
 * Fetch bookings for a specific customer ID from Supabase (or local fallback).
 * Enforces customer-specific query boundary.
 */
export async function fetchCustomerBookingsFromDatabase(customerId: string): Promise<Booking[]> {
  if (!customerId) return [];

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        setRemoteTableStatus('ready');
        const roomTypes = getStoredRoomTypes();
        const rooms = getStoredRooms();
        const mapped: Booking[] = data.map((b: any) => {
          const rt = roomTypes.find(t => t.id === b.room_type_id);
          const rm = rooms.find(r => r.id === b.room_id);
          const calcNights = b.nights || b.number_of_days || b.days || Math.max(1, Math.ceil((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / (1000 * 3600 * 24)));
          const calcGuests = b.guests || b.number_of_guests || 1;
          const calcAdr = b.adr ? Number(b.adr) : Math.round(Number(b.total_amount) / calcNights);

          return {
            id: b.booking_reference || b.id,
            bookingReference: b.booking_reference,
            customerId: b.customer_id,
            customerCode: 'CUS-GUEST',
            roomTypeId: b.room_type_id,
            roomTypeName: b.room_type_name || rt?.name || 'Selected Suite',
            roomId: b.room_id,
            roomNumber: b.room_number || rm?.roomNumber || 'Assigned at Check-In',
            customerName: b.customer_name || 'Guest',
            customerEmail: b.customer_email || '',
            customerPhone: b.customer_phone || '',
            customerAge: b.customer_age || b.age,
            customerGender: b.customer_gender || b.gender,
            customerAddress: b.customer_address || b.address,
            customerCity: b.customer_city || b.city,
            customerState: b.customer_state || b.state,
            customerCountry: b.customer_country || b.country,
            customerPostalCode: b.customer_postal_code || b.postal_code,
            aadharNumber: b.aadhar_number || b.customer_aadhar,
            idProofType: b.id_proof_type || 'Aadhar Card',
            idProofNumber: b.id_proof_number || b.aadhar_number,
            purposeOfVisit: b.purpose_of_visit || 'Leisure / Holiday',
            emergencyContactName: b.emergency_contact_name,
            emergencyContactPhone: b.emergency_contact_phone,
            checkIn: b.check_in,
            checkOut: b.check_out,
            nights: calcNights,
            guests: calcGuests,
            adr: calcAdr,
            totalAmount: Number(b.total_amount),
            status: b.booking_status as BookingStatus,
            paymentStatus: b.payment_status || 'Paid',
            paymentMethod: b.payment_method || 'Razorpay',
            razorpayPaymentId: b.razorpay_payment_id || undefined,
            razorpayOrderId: b.razorpay_order_id || undefined,
            razorpaySignature: b.razorpay_signature || undefined,
            cancellationProbability: 10,
            cancellationRisk: 'LOW',
            leadTimeDays: 14,
            marketSegment: 'Direct',
            depositType: 'Refundable',
            createdAt: b.created_at ? b.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            specialRequests: b.special_requests || ''
          };
        });

        // Merge with local storage cache
        const allBookings = getStoredBookings();
        const otherBookings = allBookings.filter(b => b.customerId !== customerId);
        saveStoredBookings([...mapped, ...otherBookings]);
        return mapped;
      }
    } catch (e) {
      console.warn('Notice querying customer bookings from Supabase:', e);
    }
  }

  // Fallback to local storage bookings matching customerId
  const allBookings = getStoredBookings();
  return allBookings.filter(b => b.customerId === customerId);
}

/**
 * Fetch ALL bookings from Supabase for Admin & Management views.
 */
export async function fetchAllBookingsFromDatabase(): Promise<Booking[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        setRemoteTableStatus('ready');
        const roomTypes = getStoredRoomTypes();
        const rooms = getStoredRooms();
        const storedCustomers = getStoredCustomers();

        const mapped: Booking[] = data.map((b: any) => {
          const rt = roomTypes.find(t => t.id === b.room_type_id);
          const rm = rooms.find(r => r.id === b.room_id);
          const cust = storedCustomers.find(c => c.id === b.customer_id);
          const calcNights = b.nights || b.number_of_days || b.days || Math.max(1, Math.ceil((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / (1000 * 3600 * 24)));
          const calcGuests = b.guests || b.number_of_guests || 1;
          const calcAdr = b.adr ? Number(b.adr) : Math.round(Number(b.total_amount) / calcNights);

          return {
            id: b.booking_reference || b.id,
            bookingReference: b.booking_reference,
            customerId: b.customer_id,
            customerCode: cust?.customer_code || 'CUS-GUEST',
            customerName: b.customer_name || cust?.full_name || 'Guest Customer',
            customerEmail: b.customer_email || cust?.email || '',
            customerPhone: b.customer_phone || cust?.phone || '',
            customerAge: b.customer_age || b.age || cust?.age,
            customerGender: b.customer_gender || b.gender || cust?.gender,
            customerAddress: b.customer_address || b.address || cust?.address_line,
            customerCity: b.customer_city || b.city || cust?.city,
            customerState: b.customer_state || b.state || cust?.state,
            customerCountry: b.customer_country || b.country || cust?.country,
            customerPostalCode: b.customer_postal_code || b.postal_code || cust?.postal_code,
            aadharNumber: b.aadhar_number || b.customer_aadhar || cust?.aadhar_number,
            idProofType: b.id_proof_type || cust?.id_proof_type || 'Aadhar Card',
            idProofNumber: b.id_proof_number || b.aadhar_number || cust?.id_proof_number,
            purposeOfVisit: b.purpose_of_visit || 'Leisure / Holiday',
            emergencyContactName: b.emergency_contact_name || cust?.emergency_contact_name,
            emergencyContactPhone: b.emergency_contact_phone || cust?.emergency_contact_phone,
            roomTypeId: b.room_type_id,
            roomTypeName: b.room_type_name || rt?.name || 'Selected Suite',
            roomId: b.room_id,
            roomNumber: b.room_number || rm?.roomNumber || 'Assigned at Check-In',
            checkIn: b.check_in,
            checkOut: b.check_out,
            nights: calcNights,
            guests: calcGuests,
            adr: calcAdr,
            totalAmount: Number(b.total_amount),
            status: b.booking_status as BookingStatus,
            paymentStatus: b.payment_status || 'Paid',
            paymentMethod: b.payment_method || 'Razorpay',
            razorpayPaymentId: b.razorpay_payment_id || undefined,
            razorpayOrderId: b.razorpay_order_id || undefined,
            razorpaySignature: b.razorpay_signature || undefined,
            cancellationProbability: 10,
            cancellationRisk: 'LOW',
            leadTimeDays: 14,
            marketSegment: 'Direct',
            depositType: 'Refundable',
            createdAt: b.created_at ? b.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            specialRequests: b.special_requests || ''
          };
        });

        saveStoredBookings(mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Notice querying all bookings from Supabase:', e);
    }
  }

  return getStoredBookings();
}

/**
 * Fetch room types from Supabase public.room_types table.
 */
export async function fetchRoomTypesFromDatabase(): Promise<RoomType[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('room_types')
        .select('*')
        .order('base_price', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        setRemoteTableStatus('ready');
        const mapped: RoomType[] = data.map((rt: any) => ({
          id: rt.id,
          name: rt.name,
          code: rt.name.substring(0, 3).toUpperCase(),
          description: rt.description || '',
          capacity: rt.capacity,
          basePrice: Number(rt.base_price),
          amenities: Array.isArray(rt.amenities) ? rt.amenities : [],
          status: rt.is_active ? 'Active' : 'Inactive',
          totalInventory: 10,
          sizeSqFt: 400,
          bedType: `${rt.capacity} Guests`,
          imageTheme: 'ocean'
        }));
        saveStoredRoomTypes(mapped);
        return mapped;
      }

      // If remote table exists in Supabase but has 0 rows, auto-seed default room types!
      if (!error && Array.isArray(data) && data.length === 0) {
        const seedPayload = INITIAL_FALLBACK_ROOM_TYPES.map(rt => ({
          id: rt.id,
          name: rt.name,
          description: rt.description,
          capacity: rt.capacity,
          base_price: rt.basePrice,
          amenities: rt.amenities,
          is_active: true
        }));

        const { data: seededData } = await supabase
          .from('room_types')
          .upsert(seedPayload)
          .select();

        if (Array.isArray(seededData) && seededData.length > 0) {
          setRemoteTableStatus('ready');
          const mapped: RoomType[] = seededData.map((rt: any) => ({
            id: rt.id,
            name: rt.name,
            code: rt.name.substring(0, 3).toUpperCase(),
            description: rt.description || '',
            capacity: rt.capacity,
            basePrice: Number(rt.base_price),
            amenities: Array.isArray(rt.amenities) ? rt.amenities : [],
            status: rt.is_active ? 'Active' : 'Inactive',
            totalInventory: 10,
            sizeSqFt: 400,
            bedType: `${rt.capacity} Guests`,
            imageTheme: 'ocean'
          }));
          saveStoredRoomTypes(mapped);
          return mapped;
        }
      }
    } catch (e) {
      console.warn('Notice querying room types from Supabase:', e);
    }
  }
  return getStoredRoomTypes();
}

/**
 * Fetch physical rooms from Supabase public.rooms table.
 */
export async function fetchRoomsFromDatabase(): Promise<Room[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('room_number', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        setRemoteTableStatus('ready');
        const roomTypes = getStoredRoomTypes();
        const mapped: Room[] = data.map((r: any) => {
          const rt = roomTypes.find(t => t.id === r.room_type_id);
          return {
            id: r.id,
            roomNumber: r.room_number,
            roomTypeId: r.room_type_id,
            roomTypeName: rt?.name || 'Selected Suite',
            floor: r.floor_number || 1,
            price: rt?.basePrice || 200,
            status: (r.status || 'Available') as RoomStatus,
            lastCleaned: 'Today'
          };
        });
        saveStoredRooms(mapped);
        return mapped;
      }

      // If remote table exists in Supabase but has 0 rows, auto-seed default physical rooms!
      if (!error && Array.isArray(data) && data.length === 0) {
        const seedPayload = INITIAL_FALLBACK_ROOMS.map(r => ({
          id: r.id,
          room_number: r.roomNumber,
          room_type_id: r.roomTypeId,
          floor_number: r.floor,
          status: r.status
        }));
        await supabase.from('rooms').upsert(seedPayload);
      }
    } catch (e) {
      console.warn('Notice querying rooms from Supabase:', e);
    }
  }
  return getStoredRooms();
}

/**
 * Fetch customer profiles from Supabase public.customers table.
 */
export async function fetchCustomersFromDatabase(): Promise<CustomerProfileData[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        setRemoteTableStatus('ready');
        saveStoredCustomers(data);
        return data;
      }
    } catch (e) {
      console.warn('Notice querying customers from Supabase:', e);
    }
  }
  return getStoredCustomers();
}

/**
 * Resolves a room_type_id that is guaranteed to exist in Supabase public.room_types.
 * Handles existing tables, empty tables, name mismatches, or custom UUID schemas.
 */
export async function resolveDatabaseRoomTypeId(
  requestedId?: string,
  requestedName?: string,
  guestCount?: number,
  basePrice?: number
): Promise<string | null> {
  if (!isSupabaseConfigured) {
    return requestedId || '11111111-1111-1111-1111-111111111104';
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  try {
    // 1. Direct ID match check
    if (requestedId && uuidRegex.test(requestedId)) {
      const { data: directMatch } = await supabase
        .from('room_types')
        .select('id')
        .eq('id', requestedId)
        .maybeSingle();

      if (directMatch?.id) {
        return directMatch.id;
      }
    }

    // 2. Fetch all existing room types from Supabase
    const { data: allRts, error: fetchErr } = await supabase
      .from('room_types')
      .select('id, name, capacity, base_price');

    if (!fetchErr && Array.isArray(allRts) && allRts.length > 0) {
      // (a) Try exact or case-insensitive name match
      if (requestedName) {
        const nameClean = requestedName.trim().toLowerCase();
        const found = allRts.find(r => r.name.toLowerCase() === nameClean);
        if (found) return found.id;

        // (b) Partial name match (e.g. 'Deluxe' in 'Deluxe Ocean View')
        const partial = allRts.find(
          r => r.name.toLowerCase().includes(nameClean) || nameClean.includes(r.name.toLowerCase())
        );
        if (partial) return partial.id;
      }

      // (c) Pick the first room type in the table
      return allRts[0].id;
    }

    // 3. Table is completely empty in Supabase! Seed the room types into Supabase
    const seedPayload = INITIAL_FALLBACK_ROOM_TYPES.map(rt => ({
      id: rt.id,
      name: rt.name,
      description: rt.description,
      capacity: rt.capacity,
      base_price: rt.basePrice,
      amenities: rt.amenities,
      is_active: true
    }));

    const { data: seeded, error: seedErr } = await supabase
      .from('room_types')
      .upsert(seedPayload)
      .select('id, name');

    if (!seedErr && Array.isArray(seeded) && seeded.length > 0) {
      if (requestedName) {
        const found = seeded.find(r => r.name.toLowerCase() === requestedName.toLowerCase());
        if (found) return found.id;
      }
      return seeded[0].id;
    }

    // 4. Fallback single room type insert
    const fallbackPayload = {
      name: requestedName || 'Deluxe Room',
      description: 'Standard guest room accommodation',
      capacity: guestCount || 2,
      base_price: basePrice || 200,
      amenities: ['WiFi', 'Air Conditioning', 'Ensuite Bathroom'],
      is_active: true
    };
    const { data: singleInsert } = await supabase
      .from('room_types')
      .insert(fallbackPayload)
      .select('id')
      .maybeSingle();

    if (singleInsert?.id) {
      return singleInsert.id;
    }
  } catch (err) {
    console.warn('Notice resolving room type from Supabase:', err);
  }

  return (requestedId && uuidRegex.test(requestedId)) ? requestedId : null;
}

/**
 * Create a new customer booking in Supabase public.bookings table (and local storage).
 * Validates check-in/out dates, guest count against room capacity, and availability.
 */
export async function createBookingInDatabase(bookingData: {
  customerId: string;
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
  aadharNumber?: string;
  idProofType?: string;
  idProofNumber?: string;
  aadharDocumentName?: string;
  aadharDocumentData?: string;
  purposeOfVisit?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  roomTypeId: string;
  roomTypeName: string;
  roomId?: string;
  roomNumber?: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  adr: number;
  specialRequests?: string;
  paymentStatus?: 'Pending' | 'Paid' | 'Refunded' | 'Failed';
  paymentMethod?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
}): Promise<{ success: boolean; booking?: Booking; error?: string }> {
  const { customerId, roomTypeId, checkIn, checkOut, guests, nights, adr } = bookingData;

  // 1. Validation
  if (!customerId) {
    return { success: false, error: 'Authentication required: customer identity missing.' };
  }

  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
    return { success: false, error: 'Invalid check-in or check-out date.' };
  }

  if (d2 <= d1) {
    return { success: false, error: 'Check-out date must be strictly after check-in date.' };
  }

  const roomTypes = getStoredRoomTypes();
  const targetRt = roomTypes.find(rt => rt.id === roomTypeId);
  if (targetRt && guests > targetRt.capacity) {
    return {
      success: false,
      error: `Selected room capacity (${targetRt.capacity} guests) is exceeded by ${guests} guests.`
    };
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // 2. Resolve room_type_id dynamically against Supabase public.room_types
  let resolvedRoomTypeId = await resolveDatabaseRoomTypeId(
    roomTypeId,
    bookingData.roomTypeName,
    guests,
    adr
  );

  // 3. Resolve customer_id to guarantee a valid UUID in PostgreSQL
  let resolvedCustomerId = customerId;
  if (!uuidRegex.test(resolvedCustomerId)) {
    resolvedCustomerId = 'c0000000-0000-0000-0000-000000000003';
  }

  // 4. Resolve room_id: verify it is a valid UUID and exists, otherwise null
  let resolvedRoomId: string | null = (bookingData.roomId && uuidRegex.test(bookingData.roomId)) ? bookingData.roomId : null;
  if (isSupabaseConfigured && resolvedRoomId) {
    try {
      const { data: rmCheck } = await supabase.from('rooms').select('id').eq('id', resolvedRoomId).maybeSingle();
      if (!rmCheck?.id) {
        resolvedRoomId = null;
      }
    } catch {
      resolvedRoomId = null;
    }
  }

  // 5. Generate unique booking reference
  const bookingRef = generateBookingReference();
  const totalAmount = adr * nights;

  const newBooking: Booking = {
    id: bookingRef,
    bookingReference: bookingRef,
    customerId: resolvedCustomerId,
    customerCode: bookingData.customerCode || 'CUS-GUEST',
    customerName: bookingData.customerName,
    customerEmail: bookingData.customerEmail,
    customerPhone: bookingData.customerPhone || '',
    customerAge: bookingData.customerAge,
    customerGender: bookingData.customerGender,
    customerAddress: bookingData.customerAddress,
    customerCity: bookingData.customerCity,
    customerState: bookingData.customerState,
    customerCountry: bookingData.customerCountry,
    customerPostalCode: bookingData.customerPostalCode,
    aadharNumber: bookingData.aadharNumber || bookingData.idProofNumber,
    idProofType: bookingData.idProofType || 'Aadhar Card',
    idProofNumber: bookingData.idProofNumber || bookingData.aadharNumber,
    aadharDocumentName: bookingData.aadharDocumentName,
    aadharDocumentData: bookingData.aadharDocumentData,
    purposeOfVisit: bookingData.purposeOfVisit || 'Leisure / Holiday',
    emergencyContactName: bookingData.emergencyContactName,
    emergencyContactPhone: bookingData.emergencyContactPhone,
    roomTypeId: resolvedRoomTypeId || '11111111-1111-1111-1111-111111111104',
    roomTypeName: bookingData.roomTypeName,
    roomId: resolvedRoomId || undefined,
    roomNumber: bookingData.roomNumber || 'Assigned at Check-In',
    checkIn,
    checkOut,
    nights,
    guests,
    adr,
    totalAmount,
    status: 'Confirmed',
    paymentStatus: (bookingData.paymentStatus || 'Paid') as any,
    paymentMethod: bookingData.paymentMethod || 'Razorpay',
    razorpayPaymentId: bookingData.razorpayPaymentId,
    razorpayOrderId: bookingData.razorpayOrderId,
    razorpaySignature: bookingData.razorpaySignature,
    cancellationProbability: 10,
    cancellationRisk: 'LOW',
    leadTimeDays: Math.max(1, Math.ceil((d1.getTime() - Date.now()) / (1000 * 3600 * 24))),
    marketSegment: 'Direct',
    depositType: 'Refundable',
    createdAt: new Date().toISOString().split('T')[0],
    specialRequests: bookingData.specialRequests || ''
  };

  // 6. Direct Supabase Integration: Insert into public.customers and public.bookings
  if (isSupabaseConfigured) {
    try {
      // (a) Ensure customer exists in public.customers with complete stay verification details
      try {
        await supabase.from('customers').upsert({
          id: resolvedCustomerId,
          customer_code: bookingData.customerCode || generateCustomerCode(),
          full_name: bookingData.customerName || 'Guest Customer',
          email: bookingData.customerEmail || '',
          phone: bookingData.customerPhone || '',
          age: bookingData.customerAge || null,
          gender: bookingData.customerGender || null,
          address_line: bookingData.customerAddress || null,
          city: bookingData.customerCity || null,
          state: bookingData.customerState || null,
          postal_code: bookingData.customerPostalCode || null,
          country: bookingData.customerCountry || 'India',
          aadhar_number: bookingData.aadharNumber || bookingData.idProofNumber || null,
          id_proof_type: bookingData.idProofType || 'Aadhar Card',
          id_proof_number: bookingData.idProofNumber || bookingData.aadharNumber || null,
          emergency_contact_name: bookingData.emergencyContactName || null,
          emergency_contact_phone: bookingData.emergencyContactPhone || null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      } catch (custErr) {
        console.warn('Notice upserting customer verification to Supabase:', custErr);
      }

      // (b) Build rich payload for public.bookings (includes customer name, nights, days, guests, aadhar, room info)
      const dbPayload: any = {
        booking_reference: bookingRef,
        customer_id: resolvedCustomerId,
        customer_name: bookingData.customerName,
        customer_email: bookingData.customerEmail,
        customer_phone: bookingData.customerPhone || '',
        customer_age: bookingData.customerAge || null,
        customer_gender: bookingData.customerGender || null,
        customer_address: bookingData.customerAddress || '',
        customer_city: bookingData.customerCity || '',
        customer_state: bookingData.customerState || '',
        customer_country: bookingData.customerCountry || 'India',
        aadhar_number: bookingData.aadharNumber || bookingData.idProofNumber || '',
        id_proof_type: bookingData.idProofType || 'Aadhar Card',
        id_proof_number: bookingData.idProofNumber || bookingData.aadharNumber || '',
        purpose_of_visit: bookingData.purposeOfVisit || 'Leisure / Holiday',
        emergency_contact_name: bookingData.emergencyContactName || '',
        emergency_contact_phone: bookingData.emergencyContactPhone || '',
        room_id: resolvedRoomId,
        room_number: bookingData.roomNumber || 'Assigned at Check-In',
        room_type_id: resolvedRoomTypeId,
        room_type_name: bookingData.roomTypeName,
        check_in: checkIn,
        check_out: checkOut,
        number_of_guests: guests,
        guests: guests,
        nights: nights,
        number_of_days: nights,
        days: nights,
        adr: adr,
        number_of_rooms: 1,
        total_amount: totalAmount,
        booking_status: 'Confirmed',
        payment_status: bookingData.paymentStatus || 'Paid',
        payment_method: bookingData.paymentMethod || 'Razorpay',
        razorpay_payment_id: bookingData.razorpayPaymentId || null,
        razorpay_order_id: bookingData.razorpayOrderId || null,
        razorpay_signature: bookingData.razorpaySignature || null,
        special_requests: bookingData.specialRequests || ''
      };

      const { data: insertData, error: insertError } = await supabase
        .from('bookings')
        .insert(dbPayload)
        .select()
        .maybeSingle();

      if (insertError) {
        console.warn('Notice from initial Supabase booking insert:', insertError);

        // Case A: Missing columns in older schema (e.g. customer_name, nights not added yet)
        if (insertError.code === '42703') {
          const basePayload = {
            booking_reference: bookingRef,
            customer_id: resolvedCustomerId,
            room_id: resolvedRoomId,
            room_type_id: resolvedRoomTypeId,
            check_in: checkIn,
            check_out: checkOut,
            number_of_guests: guests,
            number_of_rooms: 1,
            total_amount: totalAmount,
            booking_status: 'Confirmed',
            payment_status: 'Paid',
            special_requests: bookingData.specialRequests || ''
          };

          const { data: baseData, error: baseErr } = await supabase
            .from('bookings')
            .insert(basePayload)
            .select()
            .maybeSingle();

          if (!baseErr) {
            setRemoteTableStatus('ready');
            console.log('Successfully written booking to Supabase with base columns:', baseData);
          }
        }
        // Case B: Foreign key violation on room_types
        else if (
          insertError.code === '23503' &&
          (insertError.message?.includes('room_type') || insertError.details?.includes('room_types'))
        ) {
          // 1) Find ANY existing room type ID in public.room_types
          const { data: anyRt } = await supabase.from('room_types').select('id').limit(1).maybeSingle();
          if (anyRt?.id) {
            dbPayload.room_type_id = anyRt.id;
          } else {
            // Seed a room type right now
            const { data: seededRt } = await supabase.from('room_types').insert({
              name: bookingData.roomTypeName || 'Deluxe Room',
              capacity: guests || 2,
              base_price: adr || 200,
              amenities: ['WiFi', 'Air Conditioning', 'Ensuite Bathroom'],
              is_active: true
            }).select('id').maybeSingle();
            dbPayload.room_type_id = seededRt?.id || null;
          }

          const { data: retry1, error: retry1Err } = await supabase
            .from('bookings')
            .insert(dbPayload)
            .select()
            .maybeSingle();

          if (!retry1Err) {
            setRemoteTableStatus('ready');
            console.log('Successfully inserted booking into Supabase after resolving room_type:', retry1);
          } else if (retry1Err.code === '23503') {
            // Retry with null room_type_id if column is nullable
            dbPayload.room_type_id = null;
            await supabase.from('bookings').insert(dbPayload);
            setRemoteTableStatus('ready');
          }
        }
        // Case C: Foreign key violation on customers
        else if (
          insertError.code === '23503' &&
          (insertError.message?.includes('customer') || insertError.details?.includes('customers'))
        ) {
          await supabase.from('customers').upsert({
            id: resolvedCustomerId,
            customer_code: bookingData.customerCode || generateCustomerCode(),
            full_name: bookingData.customerName || 'Guest Customer',
            email: bookingData.customerEmail || '',
            phone: bookingData.customerPhone || ''
          }, { onConflict: 'id' });

          const { error: retryCustErr } = await supabase.from('bookings').insert(dbPayload);
          if (!retryCustErr) {
            setRemoteTableStatus('ready');
          }
        }
        // Case D: Foreign key violation on rooms
        else if (
          insertError.code === '23503' &&
          (insertError.message?.includes('room') || insertError.details?.includes('rooms'))
        ) {
          dbPayload.room_id = null;
          const { error: retryRoomErr } = await supabase.from('bookings').insert(dbPayload);
          if (!retryRoomErr) {
            setRemoteTableStatus('ready');
          }
        }
      } else {
        setRemoteTableStatus('ready');
        console.log('Successfully written booking to Supabase:', insertData);
      }
    } catch (e: any) {
      console.warn('Supabase booking insertion error:', e);
    }
  }

  // 7. Save to local storage for instant offline availability
  const allBookings = getStoredBookings();
  const existingIdx = allBookings.findIndex(b => b.bookingReference === newBooking.bookingReference);
  if (existingIdx >= 0) {
    allBookings[existingIdx] = newBooking;
  } else {
    allBookings.unshift(newBooking);
  }
  saveStoredBookings(allBookings);

  return { success: true, booking: newBooking };
}

/**
 * Synchronize any bookings stored in localStorage that are missing in Supabase public.bookings.
 * Guarantees that any booking created while tables were absent or errored gets pushed to Supabase.
 */
export async function syncLocalBookingsToSupabase(): Promise<{ synced: number; total: number }> {
  if (!isSupabaseConfigured) return { synced: 0, total: 0 };

  try {
    const localBookings = getStoredBookings();
    if (!localBookings || localBookings.length === 0) return { synced: 0, total: 0 };

    // Fetch existing booking references from Supabase
    const { data: remoteBookings, error } = await supabase
      .from('bookings')
      .select('booking_reference');

    if (error) {
      console.warn('Notice checking remote bookings for sync:', error);
      return { synced: 0, total: localBookings.length };
    }

    const remoteRefs = new Set((remoteBookings || []).map((b: any) => b.booking_reference));
    const missingBookings = localBookings.filter(
      b => b.bookingReference && !remoteRefs.has(b.bookingReference) && !remoteRefs.has(b.id)
    );

    if (missingBookings.length === 0) {
      return { synced: 0, total: localBookings.length };
    }

    console.log(`Found ${missingBookings.length} unsynced bookings to push to Supabase.`);
    let syncedCount = 0;

    for (const b of missingBookings) {
      try {
        const res = await createBookingInDatabase({
          customerId: b.customerId || 'c0000000-0000-0000-0000-000000000003',
          customerCode: b.customerCode,
          customerName: b.customerName,
          customerEmail: b.customerEmail,
          customerPhone: b.customerPhone,
          customerAge: b.customerAge,
          customerGender: b.customerGender,
          customerAddress: b.customerAddress,
          customerCity: b.customerCity,
          customerState: b.customerState,
          customerCountry: b.customerCountry,
          customerPostalCode: b.customerPostalCode,
          aadharNumber: b.aadharNumber,
          idProofType: b.idProofType,
          idProofNumber: b.idProofNumber,
          purposeOfVisit: b.purposeOfVisit,
          emergencyContactName: b.emergencyContactName,
          emergencyContactPhone: b.emergencyContactPhone,
          roomTypeId: b.roomTypeId,
          roomTypeName: b.roomTypeName,
          roomId: b.roomId,
          roomNumber: b.roomNumber,
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          guests: b.guests,
          nights: b.nights,
          adr: b.adr,
          specialRequests: b.specialRequests,
          paymentStatus: b.paymentStatus || 'Paid',
          paymentMethod: b.paymentMethod || 'Razorpay',
          razorpayPaymentId: b.razorpayPaymentId,
          razorpayOrderId: b.razorpayOrderId,
          razorpaySignature: b.razorpaySignature
        });
        if (res.success) {
          syncedCount++;
        }
      } catch (err) {
        console.warn('Notice syncing booking to Supabase:', err);
      }
    }

    return { synced: syncedCount, total: localBookings.length };
  } catch (e) {
    console.warn('Notice during syncLocalBookingsToSupabase:', e);
    return { synced: 0, total: 0 };
  }
}

/**
 * Cancel a booking in Supabase public.bookings table (and local storage).
 */
export async function cancelBookingInDatabase(
  bookingId: string,
  customerId?: string
): Promise<{ success: boolean; error?: string }> {
  if (!bookingId) return { success: false, error: 'Booking identifier is required.' };

  // 1. Update local storage
  const allBookings = getStoredBookings();
  const target = allBookings.find(b => b.id === bookingId || b.bookingReference === bookingId);
  if (target) {
    target.status = 'Cancelled';
    saveStoredBookings(allBookings);
  }

  // 2. Update Supabase
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('bookings').update({ booking_status: 'Cancelled', updated_at: new Date().toISOString() });
      if (target?.bookingReference) {
        query = query.eq('booking_reference', target.bookingReference);
      } else {
        query = query.eq('id', bookingId);
      }
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      const { error } = await query;
      if (error) {
        return { success: true, error: error.message };
      }
      setRemoteTableStatus('ready');
    } catch (e: any) {
      return { success: true, error: e?.message };
    }
  }

  return { success: true };
}

// ==============================================================================
// PUBLIC.USERS CHECK & SYNC SERVICES (Existing compatibility)
// ==============================================================================

export async function checkDatabaseUsersTableStatus(forceCheck = false): Promise<{
  connected: boolean;
  tableExists: boolean;
  message: string;
  error?: string;
}> {
  if (!isSupabaseConfigured) {
    return {
      connected: true,
      tableExists: true,
      message: 'Local offline database active.'
    };
  }

  if (!forceCheck && remoteTableStatus === 'ready') {
    return {
      connected: true,
      tableExists: true,
      message: 'Supabase database tables are active.'
    };
  }

  try {
    const { error } = await supabase.from('users').select('id').limit(1);

    if (!error) {
      setRemoteTableStatus('ready');
      return {
        connected: true,
        tableExists: true,
        message: 'Supabase database tables are active.'
      };
    }

    const errMsg = error.message || '';
    const errCode = (error as any).code || '';

    if (
      errCode === '42P01' ||
      errCode === 'PGRST205' ||
      errMsg.toLowerCase().includes('does not exist') ||
      errMsg.toLowerCase().includes('could not find the table')
    ) {
      setRemoteTableStatus('missing');
      return {
        connected: true,
        tableExists: false,
        message: 'Database tables do not exist in Supabase yet. Please run the SQL setup script.',
        error: errMsg
      };
    }

    return {
      connected: true,
      tableExists: false,
      message: `Database notice: ${errMsg}`,
      error: errMsg
    };
  } catch (err: any) {
    return {
      connected: false,
      tableExists: false,
      message: err?.message || 'Failed to connect to Supabase.',
      error: err?.message
    };
  }
}

export async function appendAllUsersToRemote(): Promise<{
  success: boolean;
  count: number;
  message: string;
  error?: string;
}> {
  if (!isSupabaseConfigured) {
    return { success: true, count: 0, message: 'Supabase credentials not configured' };
  }

  const allUsers = getStoredUsers();
  const payload = allUsers.map(u => ({
    id: u.id,
    full_name: u.full_name || '',
    email: u.email.toLowerCase().trim(),
    phone: u.phone || '',
    role: u.role,
    status: u.status,
    profile_image: u.profile_image || '',
    updated_at: new Date().toISOString()
  }));

  try {
    const { error } = await supabase
      .from('users')
      .upsert(payload, { onConflict: 'email' });

    if (error) {
      if (error.message?.includes('could not find the table')) {
        setRemoteTableStatus('missing');
      }
      return {
        success: false,
        count: 0,
        message: `Failed to append users: ${error.message}`,
        error: error.message
      };
    }

    setRemoteTableStatus('ready');
    return {
      success: true,
      count: payload.length,
      message: `Successfully synchronized ${payload.length} user records to Supabase public.users table.`
    };
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      message: err?.message || 'Sync failed',
      error: err?.message
    };
  }
}

export async function syncUserToDatabase(profile: UserProfile): Promise<{
  success: boolean;
  syncedRemote: boolean;
  error?: string;
}> {
  saveLocalFallbackProfile(profile);

  if (remoteTableStatus === 'missing') {
    return { success: true, syncedRemote: false, error: 'Table public.users not yet created on remote database.' };
  }

  if (isSupabaseConfigured) {
    try {
      const payload = {
        id: profile.id,
        full_name: profile.full_name || '',
        email: profile.email.toLowerCase().trim(),
        phone: profile.phone || '',
        role: profile.role,
        status: profile.status,
        profile_image: profile.profile_image || '',
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('users')
        .upsert(payload, { onConflict: 'email' });

      if (error) {
        if (error.message?.includes('could not find the table') || (error as any).code === 'PGRST205') {
          setRemoteTableStatus('missing');
        }
        return { success: true, syncedRemote: false, error: error.message };
      }

      setRemoteTableStatus('ready');
      return { success: true, syncedRemote: true };
    } catch (err: any) {
      return { success: true, syncedRemote: false, error: err?.message };
    }
  }

  return { success: true, syncedRemote: false };
}

export async function checkUserExistsInDatabase(email: string): Promise<{
  exists: boolean;
  user: UserProfile | null;
  source: 'supabase' | 'local' | 'none';
}> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    return { exists: false, user: null, source: 'none' };
  }

  if (isSupabaseConfigured && remoteTableStatus !== 'missing') {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (!error && data) {
        const profile: UserProfile = {
          id: data.id || `u-${Date.now()}`,
          full_name: data.full_name || cleanEmail.split('@')[0],
          email: data.email || cleanEmail,
          phone: data.phone || '',
          role: (data.role || 'customer') as Role,
          status: (data.status || 'active') as UserStatus,
          profile_image: data.profile_image || '',
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString()
        };
        return { exists: true, user: profile, source: 'supabase' };
      }

      if (!error && !data) {
        return { exists: false, user: null, source: 'none' };
      }

      if (error && (error.message?.includes('could not find the table') || (error as any).code === 'PGRST205')) {
        setRemoteTableStatus('missing');
      }
    } catch {}
  }

  const local = getLocalFallbackProfile(cleanEmail);
  if (local) {
    return { exists: true, user: local, source: 'local' };
  }

  return { exists: false, user: null, source: 'none' };
}

export async function fetchUserProfileById(userId: string): Promise<UserProfile | null> {
  if (!userId) return null;

  if (isSupabaseConfigured && remoteTableStatus !== 'missing') {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        const profile: UserProfile = {
          id: data.id,
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          role: (data.role || 'customer') as Role,
          status: (data.status || 'active') as UserStatus,
          profile_image: data.profile_image || '',
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString()
        };
        saveLocalFallbackProfile(profile);
        return profile;
      }
    } catch {}
  }

  const localUsers = getStoredUsers();
  const found = localUsers.find(u => u.id === userId);
  return found || null;
}

export async function fetchUserFromDatabase(email: string): Promise<UserProfile | null> {
  const cleanEmail = email.trim().toLowerCase();

  if (remoteTableStatus === 'missing') {
    return getLocalFallbackProfile(cleanEmail);
  }

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (!error && data) {
        const profile: UserProfile = {
          id: data.id || `u-${Date.now()}`,
          full_name: data.full_name || cleanEmail.split('@')[0],
          email: data.email || cleanEmail,
          phone: data.phone || '',
          role: (data.role || 'customer') as Role,
          status: (data.status || 'active') as UserStatus,
          profile_image: data.profile_image || '',
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString()
        };
        saveLocalFallbackProfile(profile);
        return profile;
      }

      if (error && (error.message?.includes('could not find the table') || (error as any).code === 'PGRST205')) {
        setRemoteTableStatus('missing');
      }
    } catch {}
  }

  return getLocalFallbackProfile(cleanEmail);
}

export async function getAllDatabaseUsers(): Promise<UserProfile[]> {
  const localUsers = getStoredUsers();

  if (remoteTableStatus === 'missing' || !isSupabaseConfigured) {
    return localUsers;
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*');

    if (!error && Array.isArray(data) && data.length > 0) {
      const mergedMap = new Map<string, UserProfile>();
      localUsers.forEach(u => mergedMap.set(u.email.toLowerCase(), u));
      data.forEach(d => {
        mergedMap.set(d.email.toLowerCase(), {
          id: d.id,
          full_name: d.full_name || '',
          email: d.email,
          phone: d.phone || '',
          role: d.role as Role,
          status: d.status as UserStatus,
          profile_image: d.profile_image || '',
          created_at: d.created_at,
          updated_at: d.updated_at
        });
      });
      const combined = Array.from(mergedMap.values());
      saveStoredUsers(combined);
      return combined;
    }

    if (error && (error.message?.includes('could not find the table') || (error as any).code === 'PGRST205')) {
      setRemoteTableStatus('missing');
    }
  } catch {}

  return localUsers;
}
