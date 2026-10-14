-- ==============================================================================
-- Naidu Hotel: AI-Powered Hotel Booking & Intelligence System
-- Complete Supabase Schema, Constraints, Triggers & Row-Level Security (RLS)
-- Tables: public.users, public.customers, public.room_types, public.rooms, public.bookings
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. TABLE: public.users (Base Identity & Multi-Role Roster)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  role text NOT NULL CHECK (role IN ('admin', 'management', 'customer')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  profile_image text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ==============================================================================
-- 2. TABLE: public.customers (Customer Identity & Comprehensive Profile)
-- auth.users.id: permanent Supabase auth UUID
-- public.customers.id: same UUID as auth.users.id, referencing auth.users(id)
-- customer_code: unique human-readable identifier (e.g., CUS-XXXXXXXX)
-- ==============================================================================
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

CREATE INDEX IF NOT EXISTS idx_customers_code ON public.customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);

-- ==============================================================================
-- 3. TABLE: public.room_types (Configurable Room Categories & Blueprints)
-- ==============================================================================
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

-- ==============================================================================
-- 4. TABLE: public.rooms (Physical Room Inventory)
-- ==============================================================================
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

-- ==============================================================================
-- 5. TABLE: public.bookings (Master Bookings Ledger & Customer Relationship)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference text UNIQUE NOT NULL,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  room_type_id uuid REFERENCES public.room_types(id) ON DELETE RESTRICT,
  check_in date NOT NULL,
  check_out date NOT NULL,
  number_of_guests integer NOT NULL CHECK (number_of_guests > 0),
  number_of_rooms integer NOT NULL DEFAULT 1 CHECK (number_of_rooms > 0),
  total_amount numeric(10,2) NOT NULL CHECK (total_amount >= 0),
  booking_status text NOT NULL DEFAULT 'Confirmed' CHECK (booking_status IN ('Confirmed', 'Checked-In', 'Checked-Out', 'Cancelled')),
  payment_status text DEFAULT 'Paid' CHECK (payment_status IN ('Pending', 'Paid', 'Refunded', 'Failed')),
  special_requests text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_booking_dates CHECK (check_out > check_in)
);

CREATE INDEX IF NOT EXISTS idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room ON public.bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON public.bookings(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON public.bookings(booking_reference);

-- ==============================================================================
-- 6. HELPER FUNCTIONS & TRIGGERS
-- ==============================================================================

-- (a) Helper: Generate unique human-readable customer code (e.g. CUS-9A8B7C6D)
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

-- (b) Helper: Get current user role from public.users
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text AS $$
  SELECT role FROM public.users
  WHERE id = auth.uid() OR email = (auth.jwt() ->> 'email')
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- (c) Trigger: Prevent overlapping confirmed bookings on the same physical room
CREATE OR REPLACE FUNCTION public.prevent_overlapping_room_bookings()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate if physical room is assigned and booking is active
  IF NEW.room_id IS NOT NULL AND NEW.booking_status IN ('Confirmed', 'Checked-In') THEN
    IF EXISTS (
      SELECT 1 FROM public.bookings
      WHERE room_id = NEW.room_id
        AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND booking_status IN ('Confirmed', 'Checked-In')
        AND check_in < NEW.check_out
        AND check_out > NEW.check_in
    ) THEN
      RAISE EXCEPTION 'Physical room % is already reserved for overlapping dates (% to %)',
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

-- (d) Trigger: Auto-sync new Supabase Auth user to public.users AND public.customers
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

  -- 1. Upsert into public.users
  INSERT INTO public.users (id, full_name, email, phone, role, status)
  VALUES (NEW.id, v_name, NEW.email, v_phone, v_role, 'active')
  ON CONFLICT (email) DO UPDATE
  SET id = EXCLUDED.id,
      full_name = EXCLUDED.full_name,
      phone = COALESCE(EXCLUDED.phone, public.users.phone),
      updated_at = now();

  -- 2. If role is customer, also ensure public.customers profile exists
  IF v_role = 'customer' THEN
    v_code := public.generate_unique_customer_code();
    INSERT INTO public.customers (id, customer_code, full_name, email, phone)
    VALUES (NEW.id, v_code, v_name, NEW.email, v_phone)
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        phone = COALESCE(EXCLUDED.phone, public.customers.phone),
        updated_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- --- (A) public.users Policies ---
DROP POLICY IF EXISTS "Users public read" ON public.users;
CREATE POLICY "Users public read" ON public.users
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Users insert registration" ON public.users;
CREATE POLICY "Users insert registration" ON public.users
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Users update own profile" ON public.users;
CREATE POLICY "Users update own profile" ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.get_current_user_role() = 'admin')
  WITH CHECK (auth.uid() = id OR public.get_current_user_role() = 'admin');

-- --- (B) public.customers Policies ---
DROP POLICY IF EXISTS "Customers can read own profile or staff" ON public.customers;
CREATE POLICY "Customers can read own profile or staff" ON public.customers
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.get_current_user_role() IN ('admin', 'management'));

DROP POLICY IF EXISTS "Customers can insert own profile" ON public.customers;
CREATE POLICY "Customers can insert own profile" ON public.customers
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR public.get_current_user_role() IN ('admin', 'management'));

DROP POLICY IF EXISTS "Customers can update own personal details" ON public.customers;
CREATE POLICY "Customers can update own personal details" ON public.customers
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.get_current_user_role() IN ('admin', 'management'))
  WITH CHECK (id = auth.uid() OR public.get_current_user_role() IN ('admin', 'management'));

-- --- (C) public.room_types Policies ---
DROP POLICY IF EXISTS "Anyone can view active room types" ON public.room_types;
CREATE POLICY "Anyone can view active room types" ON public.room_types
  FOR SELECT TO anon, authenticated
  USING (is_active = true OR public.get_current_user_role() IN ('admin', 'management'));

DROP POLICY IF EXISTS "Staff can manage room types" ON public.room_types;
CREATE POLICY "Staff can manage room types" ON public.room_types
  FOR ALL TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'management'))
  WITH CHECK (public.get_current_user_role() IN ('admin', 'management'));

-- --- (D) public.rooms Policies ---
DROP POLICY IF EXISTS "Authenticated can view rooms" ON public.rooms;
CREATE POLICY "Authenticated can view rooms" ON public.rooms
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Staff can manage physical rooms" ON public.rooms;
CREATE POLICY "Staff can manage physical rooms" ON public.rooms
  FOR ALL TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'management'))
  WITH CHECK (public.get_current_user_role() IN ('admin', 'management'));

-- --- (E) public.bookings Policies ---
DROP POLICY IF EXISTS "Customers view own bookings or staff view all" ON public.bookings;
CREATE POLICY "Customers view own bookings or staff view all" ON public.bookings
  FOR SELECT TO authenticated
  USING (customer_id = auth.uid() OR public.get_current_user_role() IN ('admin', 'management'));

DROP POLICY IF EXISTS "Customers create bookings with own customer_id" ON public.bookings;
CREATE POLICY "Customers create bookings with own customer_id" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid() OR public.get_current_user_role() IN ('admin', 'management'));

DROP POLICY IF EXISTS "Customers can cancel own booking or staff manage" ON public.bookings;
CREATE POLICY "Customers can cancel own booking or staff manage" ON public.bookings
  FOR UPDATE TO authenticated
  USING (customer_id = auth.uid() OR public.get_current_user_role() IN ('admin', 'management'))
  WITH CHECK (customer_id = auth.uid() OR public.get_current_user_role() IN ('admin', 'management'));

-- ==============================================================================
-- 8. SEED INITIAL DATA (Idempotent)
-- ==============================================================================

-- (a) Seed Initial Users
INSERT INTO public.users (id, full_name, email, phone, role, status)
VALUES
  ('a0000000-0000-0000-0000-000000000000', 'Appala Naidu', 'appalanaidu.dev@gmail.com', '+91 99000 11223', 'admin', 'active'),
  ('a0000000-0000-0000-0000-000000000001', 'Executive Administrator', 'admin@naiduhotel.com', '+91 99000 11223', 'admin', 'active'),
  ('b0000000-0000-0000-0000-000000000002', 'Deepa Rao', 'manager@naiduhotel.com', '+91 99888 22334', 'management', 'active'),
  ('c0000000-0000-0000-0000-000000000003', 'Rajesh Naidu', 'customer@gmail.com', '+1 (555) 234-5678', 'customer', 'active')
ON CONFLICT (email) DO UPDATE
SET role = EXCLUDED.role, status = EXCLUDED.status;

-- (b) Seed Initial Room Types (Single, Double, Triple, Deluxe, Suite, Villa, Penthouse)
INSERT INTO public.room_types (id, name, description, capacity, base_price, amenities, is_active)
VALUES
  ('11111111-1111-1111-1111-111111111101', 'Single Sharing Room', 'Cozy private room with single bed, ergonomic workspace, and high-speed Wi-Fi.', 1, 120.00, '["High-Speed WiFi", "Workstation Desk", "Ensuite Shower", "Air Conditioning"]'::jsonb, true),
  ('11111111-1111-1111-1111-111111111102', 'Double Sharing Room', 'Spacious twin or queen arrangement ideal for couples or traveling partners.', 2, 180.00, '["High-Speed WiFi", "Queen Bed / Twin", "Smart HDTV", "Coffee Maker", "Balcony"]'::jsonb, true),
  ('11111111-1111-1111-1111-111111111103', 'Triple Sharing Room', 'Generously apportioned suite featuring three single beds or king + single with lounge.', 3, 240.00, '["High-Speed WiFi", "3 Individual Beds", "Mini Bar", "Walk-in Wardrobe", "Seaside Balcony"]'::jsonb, true),
  ('11111111-1111-1111-1111-111111111104', 'Deluxe Ocean View', 'Uninterrupted panoramic coastline vistas with plush king bedding and private terrace.', 2, 285.00, '["Ocean View Balcony", "King Bed", "Rain Shower", "Nespresso Bar", "Smart 65-inch TV"]'::jsonb, true),
  ('11111111-1111-1111-1111-111111111105', 'Executive Business Suite', 'Executive lounge access, separate meeting parlor, and complimentary boardroom privileges.', 4, 395.00, '["Executive Lounge", "Private Meeting Table", "Soaking Tub", "High-Speed Mesh WiFi", "Butler Service"]'::jsonb, true),
  ('11111111-1111-1111-1111-111111111106', 'Premier Garden Villa', 'Private villa garden enclave with private plunge jacuzzi and secluded sundeck.', 6, 460.00, '["Private Plunge Pool", "Botanical Garden Terrace", "Full Kitchenette", "Dual Vanities", "In-villa Dining"]'::jsonb, true),
  ('11111111-1111-1111-1111-111111111107', 'Luxery Presidential Penthouse', 'Top-floor 3,200 sq ft crowning residence with 360-degree panorama, chef pantry, and 24/7 dedicated concierge.', 8, 850.00, '["360 Ocean Panorama", "Private Elevator Access", "Chef Kitchen", "Grand Piano", "Personal Concierge"]'::jsonb, true)
ON CONFLICT (name) DO UPDATE
SET base_price = EXCLUDED.base_price,
    capacity = EXCLUDED.capacity,
    amenities = EXCLUDED.amenities;

-- (c) Seed Initial Physical Rooms
INSERT INTO public.rooms (id, room_number, room_type_id, floor_number, status)
VALUES
  ('22222222-2222-2222-2222-222222222101', 'Room 101', '11111111-1111-1111-1111-111111111101', 1, 'Available'),
  ('22222222-2222-2222-2222-222222222102', 'Room 102', '11111111-1111-1111-1111-111111111102', 1, 'Available'),
  ('22222222-2222-2222-2222-222222222103', 'Room 103', '11111111-1111-1111-1111-111111111103', 1, 'Available'),
  ('22222222-2222-2222-2222-222222222201', 'Room 201', '11111111-1111-1111-1111-111111111104', 2, 'Available'),
  ('22222222-2222-2222-2222-222222222202', 'Room 202', '11111111-1111-1111-1111-111111111104', 2, 'Occupied'),
  ('22222222-2222-2222-2222-222222222301', 'Room 301', '11111111-1111-1111-1111-111111111105', 3, 'Available'),
  ('22222222-2222-2222-2222-222222222302', 'Room 302', '11111111-1111-1111-1111-111111111105', 3, 'Maintenance'),
  ('22222222-2222-2222-2222-222222222401', 'Villa 401', '11111111-1111-1111-1111-111111111106', 4, 'Available'),
  ('22222222-2222-2222-2222-222222222501', 'Penthouse 501', '11111111-1111-1111-1111-111111111107', 5, 'Available')
ON CONFLICT (room_number) DO NOTHING;
