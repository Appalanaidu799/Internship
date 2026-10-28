export type Role = 'admin' | 'management' | 'customer';
export type UserRole = Role; // Alias for backward compatibility

export type UserStatus = 'active' | 'inactive' | 'blocked';

export type GenderOption = 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say';

export type IdDocumentType = 'Aadhar Card' | 'PAN Card' | 'Passport' | 'Driving License' | 'Voter ID' | 'Government ID';

export interface CustomerProfileData {
  id: string; // auth.users.id UUID
  customer_code: string; // unique human-readable code e.g. CUS-A8B9C0D1
  full_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string; // YYYY-MM-DD
  age?: number;
  gender?: GenderOption | string;
  address_line?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  aadhar_number?: string;
  id_proof_type?: string;
  id_proof_number?: string;
  id_document_name?: string;
  id_document_size?: string;
  id_document_preview?: string;
  ocr_status?: 'pending' | 'extracted' | 'manual' | 'failed' | 'not_scanned';
  ocr_extracted_at?: string;
  ocr_verified_by_user?: boolean;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Aadhaar number validator: strictly 12 digits
 */
export function validateAadhaarNumber(value: string): { isValid: boolean; error?: string; cleanNumber: string } {
  const clean = value.replace(/[\s-]/g, '');
  if (!clean) {
    return { isValid: false, error: 'Aadhaar number is required.', cleanNumber: '' };
  }
  if (!/^\d+$/.test(clean)) {
    return { isValid: false, error: 'Aadhaar number must contain only numeric digits.', cleanNumber: clean };
  }
  if (!/^\d{12}$/.test(clean)) {
    return { isValid: false, error: 'Aadhaar number must be exactly 12 digits (e.g. 1234 5678 9012).', cleanNumber: clean };
  }
  return { isValid: true, cleanNumber: clean };
}

/**
 * PAN card validator: strictly 5 uppercase letters, 4 digits, 1 uppercase letter
 */
export function validatePanNumber(value: string): { isValid: boolean; error?: string; cleanNumber: string } {
  const clean = value.replace(/[\s-]/g, '').toUpperCase();
  if (!clean) {
    return { isValid: false, error: 'PAN number is required.', cleanNumber: '' };
  }
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(clean)) {
    return { isValid: false, error: 'PAN number must be 10 characters: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).', cleanNumber: clean };
  }
  return { isValid: true, cleanNumber: clean };
}

/**
 * Mask sensitive identity numbers in UI
 */
export function maskIdentityNumber(value?: string | null, type: string = 'Aadhar Card'): string {
  if (!value) return '';
  const clean = value.replace(/[\s-]/g, '');
  if (type === 'Aadhar Card' || type.toLowerCase().includes('aadhar')) {
    if (clean.length === 12) {
      return `•••• •••• ${clean.substring(8)}`;
    }
    return clean.replace(/.(?=.{4})/g, '•');
  }
  if (type === 'PAN Card' || type.toLowerCase().includes('pan')) {
    if (clean.length === 10) {
      return `•••••${clean.substring(5, 9)}${clean.substring(9)}`;
    }
    return clean.replace(/.(?=.{4})/g, '•');
  }
  return clean.replace(/.(?=.{4})/g, '•');
}

/**
 * Format Aadhaar for user-friendly display (1234 5678 9012)
 */
export function formatAadhaarDisplay(value?: string | null): string {
  if (!value) return '';
  const clean = value.replace(/[\s-]/g, '');
  const parts = clean.match(/.{1,4}/g);
  return parts ? parts.join(' ') : clean;
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
