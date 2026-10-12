import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, Role, UserStatus } from '../types/auth';

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
 * Complete SQL to create public.users table in Supabase, enable Row Level Security,
 * and append all initial user records into the table.
 */
export const SUPABASE_USERS_TABLE_SQL = `-- 1. Create public.users table if it does not exist
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  phone TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'customer',
  status TEXT NOT NULL DEFAULT 'active',
  profile_image TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Row Level Security Policies for Public Access
DROP POLICY IF EXISTS "Allow all public read" ON public.users;
CREATE POLICY "Allow all public read" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all public insert" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all public insert" ON public.users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all public update" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Allow all public update" ON public.users FOR UPDATE USING (true);

-- 4. Append Seed Users into public.users table
INSERT INTO public.users (id, full_name, email, phone, role, status, profile_image)
VALUES 
  ('a0000000-0000-0000-0000-000000000000', 'Appala Naidu', 'appalanaidu.dev@gmail.com', '+91 99000 11223', 'admin', 'active', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'),
  ('a0000000-0000-0000-0000-000000000001', 'Executive Administrator', 'admin@naiduhotel.com', '+91 99000 11223', 'admin', 'active', ''),
  ('b0000000-0000-0000-0000-000000000002', 'Deepa Rao', 'manager@naiduhotel.com', '+91 99888 22334', 'management', 'active', ''),
  ('c0000000-0000-0000-0000-000000000003', 'Rajesh Naidu', 'customer@gmail.com', '+1 (555) 234-5678', 'customer', 'active', '')
ON CONFLICT (email) DO UPDATE 
SET full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    updated_at = NOW();
`;

// Initial users: purely empty array, all accounts come fresh from Supabase database
export const SEED_USERS: UserProfile[] = [];

// Helper to manage public.users store in localStorage
export const STORAGE_KEY_USERS = 'naidu_supabase_users_table';
export const STORAGE_KEY_SESSION = 'naidu_supabase_auth_session';
export const STORAGE_KEY_TABLE_STATUS = 'naidu_supabase_table_status';

export function getStoredUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse local users', e);
  }
  return [];
}

export function saveStoredUsers(users: UserProfile[]) {
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save local users', e);
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

// Track whether public.users table exists on remote Supabase DB
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

// Emulated Supabase client interface for environments without active live API credentials
class MockSupabaseClient {
  auth = {
    signInWithPassword: async ({ email }: { email: string; password?: string }) => {
      await new Promise(r => setTimeout(r, 150));
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
      await new Promise(r => setTimeout(r, 150));
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
              maybeSingle: async () => {
                const users = getStoredUsers();
                const found = users.find(u => (u as any)[field] === value);
                return { data: found || null, error: null };
              },
              single: async () => {
                const users = getStoredUsers();
                const found = users.find(u => (u as any)[field] === value);
                return { data: found || null, error: found ? null : { message: 'Not found' } };
              }
            };
          },
          order: () => {
            return {
              then: async (resolve: any) => {
                const users = getStoredUsers();
                resolve({ data: users, error: null });
              }
            };
          },
          then: async (resolve: any) => {
            const users = getStoredUsers();
            resolve({ data: users, error: null });
          }
        };
      },

      upsert: (payload: any) => {
        return {
          then: async (resolve: any) => {
            const users = getStoredUsers();
            const items = Array.isArray(payload) ? payload : [payload];
            items.forEach(item => {
              const idx = users.findIndex(u => u.email.toLowerCase() === item.email?.toLowerCase());
              if (idx >= 0) {
                users[idx] = { ...users[idx], ...item };
              } else {
                users.push(item);
              }
            });
            saveStoredUsers(users);
            resolve({ data: items, error: null });
          }
        };
      }
    };
  }
}

// Create real Supabase client or fallback client
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (new MockSupabaseClient() as unknown as SupabaseClient);

/**
 * Check whether the public.users table exists in the Supabase database.
 * Does not spam non-existent RPCs or repeat failing queries.
 */
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

  // If table already confirmed ready, skip check unless forced
  if (!forceCheck && remoteTableStatus === 'ready') {
    return {
      connected: true,
      tableExists: true,
      message: 'public.users table is active on Supabase database.'
    };
  }

  try {
    const { error } = await supabase.from('users').select('id').limit(1);

    if (!error) {
      setRemoteTableStatus('ready');
      return {
        connected: true,
        tableExists: true,
        message: 'public.users table is active on Supabase database.'
      };
    }

    const errMsg = error.message || '';
    const errCode = (error as any).code || '';

    // Check if table missing error (PGRST205 or "does not exist")
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
        message: 'public.users table does not exist in Supabase database yet. Please run the SQL setup script.',
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

/**
 * Batch-append / upsert ALL users into the remote Supabase public.users table.
 * Called automatically when table is confirmed ready, or when user clicks Verify & Sync.
 */
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

/**
 * Synchronize a user record into both Supabase public.users table and local persistent storage.
 * Ensures the record is ALWAYS saved locally first and the user can proceed without interruption.
 */
export async function syncUserToDatabase(profile: UserProfile): Promise<{
  success: boolean;
  syncedRemote: boolean;
  error?: string;
}> {
  // 1. Always save to local fallback cache immediately
  saveLocalFallbackProfile(profile);

  // 2. If remote table is known to be missing, do NOT fire a failing HTTP query
  if (remoteTableStatus === 'missing') {
    return { success: true, syncedRemote: false, error: 'Table public.users not yet created on remote database.' };
  }

  // 3. If Supabase is configured and table may exist, upsert into public.users table
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

/**
 * Check whether a user email already exists in the database.
 * Explicitly verifies if the user has an existing account before login access.
 */
export async function checkUserExistsInDatabase(email: string): Promise<{
  exists: boolean;
  user: UserProfile | null;
  source: 'supabase' | 'local' | 'none';
}> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    return { exists: false, user: null, source: 'none' };
  }

  // 1. If Supabase is configured and table is not marked missing, query live Supabase database
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
        // Definitely does not exist in Supabase!
        return { exists: false, user: null, source: 'none' };
      }

      if (error && (error.message?.includes('could not find the table') || (error as any).code === 'PGRST205')) {
        setRemoteTableStatus('missing');
      }
    } catch {
      // Proceed to local check only if network or error
    }
  }

  // 2. Only if Supabase is completely unreachable or table missing, check local fallback
  const local = getLocalFallbackProfile(cleanEmail);
  if (local) {
    return { exists: true, user: local, source: 'local' };
  }

  return { exists: false, user: null, source: 'none' };
}

/**
 * Fetch a user profile by authenticated user ID from Supabase public.users table.
 * Used after successful authentication to retrieve the exact user profile.
 */
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

  // Fallback: search local users by ID
  const localUsers = getStoredUsers();
  const found = localUsers.find(u => u.id === userId);
  return found || null;
}

/**
 * Update the user profile ID in public.users to match authenticated Supabase Auth UUID.
 */
export async function updateUserProfileId(email: string, newId: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !newId) return;

  if (isSupabaseConfigured && remoteTableStatus !== 'missing') {
    try {
      await supabase
        .from('users')
        .update({ id: newId, updated_at: new Date().toISOString() })
        .eq('email', cleanEmail);
    } catch {}
  }

  // Also update local storage
  const localUsers = getStoredUsers();
  const idx = localUsers.findIndex(u => u.email.toLowerCase() === cleanEmail);
  if (idx >= 0) {
    localUsers[idx].id = newId;
    saveStoredUsers(localUsers);
  }
}

/**
 * Fetch a user profile by email with local fallback.
 * Avoids sending failing 404 queries if remote table is known to be missing.
 */
export async function fetchUserFromDatabase(email: string): Promise<UserProfile | null> {
  const cleanEmail = email.trim().toLowerCase();

  // If table is known to not exist remotely, return from local storage without network call
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

/**
 * Get all users merged from Supabase public.users table and local storage.
 */
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
