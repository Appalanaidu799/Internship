export type Role = 'admin' | 'management' | 'customer';
export type UserRole = Role; // Alias for backward compatibility

export type UserStatus = 'active' | 'inactive' | 'blocked';

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
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdminConfigured: boolean;
}
