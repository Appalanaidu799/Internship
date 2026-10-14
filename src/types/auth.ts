export type Role = 'admin' | 'management' | 'customer';
export type UserRole = Role; // Alias for backward compatibility

export type UserStatus = 'active' | 'inactive' | 'blocked';

export type GenderOption = 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say';

export interface CustomerProfileData {
  id: string; // auth.users.id UUID
  customer_code: string; // unique human-readable code e.g. CUS-A8B9C0D1
  full_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string; // YYYY-MM-DD
  gender?: GenderOption | string;
  address_line?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Calculates current age dynamically from a YYYY-MM-DD date of birth string.
 * Never stores a static age in the database.
 */
export function calculateAge(dateOfBirth?: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: Role;
  status: UserStatus;
  profile_image?: string;
  created_at?: string;
  updated_at?: string;
}

// User representation for frontend components
export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  status: UserStatus;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  userProfile: UserProfile | null;
  customerProfile: CustomerProfileData | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdminConfigured: boolean;
}
