-- ==============================================================================
-- Naidu Hotel: AI-Powered Hotel Booking & Intelligence System
-- Supabase Schema & Row-Level Security (RLS) Setup for Table: public.users
-- ==============================================================================

-- 1. Create public.users table
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

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid naming conflicts
DROP POLICY IF EXISTS "Allow users to read profiles" ON public.users;
DROP POLICY IF EXISTS "Allow public read of profiles" ON public.users;
DROP POLICY IF EXISTS "Allow insert profile" ON public.users;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.users;
DROP POLICY IF EXISTS "Allow all inserts during registration" ON public.users;

-- 4. RLS Policies:
-- (a) Allow SELECT for all users (anon & authenticated) to verify role and status during auth
CREATE POLICY "Allow public read of profiles"
  ON public.users
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- (b) Allow INSERT during registration (permits both anon and authenticated to register their profile)
CREATE POLICY "Allow all inserts during registration"
  ON public.users
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- (c) Allow authenticated users to update their own profile
CREATE POLICY "Allow users to update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR auth.jwt() ->> 'email' = email);

-- 5. Recommended Automatic Trigger (Bypasses RLS with SECURITY DEFINER):
-- This automatically syncs new auth.users accounts into public.users with 'customer' role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, phone, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    'active'
  )
  ON CONFLICT (email) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Seed Initial Test Users (including Default Admin appalanaidu.dev@gmail.com)
INSERT INTO public.users (full_name, email, phone, role, status)
VALUES
  ('Appala Naidu', 'appalanaidu.dev@gmail.com', '+91 99000 11223', 'admin', 'active'),
  ('Executive Administrator', 'admin@naiduhotel.com', '+91 99000 11223', 'admin', 'active'),
  ('Deepa Rao', 'manager@naiduhotel.com', '+91 99888 22334', 'management', 'active'),
  ('Rajesh Naidu', 'customer@gmail.com', '+1 (555) 234-5678', 'customer', 'active')
ON CONFLICT (email) DO UPDATE
SET role = EXCLUDED.role, status = EXCLUDED.status;
