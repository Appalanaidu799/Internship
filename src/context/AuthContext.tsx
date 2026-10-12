import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  supabase,
  saveLocalFallbackProfile,
  getLocalFallbackProfile,
  STORAGE_KEY_SESSION,
  syncUserToDatabase,
  fetchUserFromDatabase,
  checkDatabaseUsersTableStatus,
  getRemoteTableStatus,
  isSupabaseConfigured
} from '../lib/supabase';
import { UserProfile, Role, UserStatus, AuthState } from '../types/auth';

export const DEFAULT_ADMIN_EMAIL = 'appalanaidu.dev@gmail.com';
export const STORAGE_ADMIN_CONFIGURED = 'naidu_admin_setup_completed';

interface AuthContextType extends AuthState {
  authenticatedUser: any | null;
  isAdminConfigured: boolean;
  setIsAdminConfigured: (configured: boolean) => void;
  setupAdmin: (fullName: string, phone: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; isEmailUnconfirmed?: boolean; notFound?: boolean; role?: Role }>;
  resendConfirmationEmail: (email: string) => Promise<{ success: boolean; message: string; error?: string }>;
  verifyEmailConfirmation: (email: string, token: string) => Promise<{ success: boolean; error?: string; role?: Role }>;
  signInWithGoogle: (customGoogleEmail?: string, customGoogleName?: string) => Promise<{ success: boolean; error?: string; notFound?: boolean; role?: Role }>;
  register: (
    fullName: string,
    email: string,
    phone: string,
    password?: string
  ) => Promise<{
    success: boolean;
    error?: string;
    isEmailUnconfirmed?: boolean;
    alreadyExists?: boolean;
    isRateLimited?: boolean;
  }>;
  registerWithGoogle: (googleEmail: string, fullName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  databaseStatus: { connected: boolean; tableExists: boolean; message: string };
  checkDatabaseStatus: (force?: boolean) => Promise<{ connected: boolean; tableExists: boolean; message: string }>;
  appendUsersToRemoteDb: () => Promise<{ success: boolean; count: number; message: string; error?: string }>;
  isTableMissing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authenticatedUser, setAuthenticatedUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdminConfigured, setIsAdminConfigured] = useState<boolean>(true);
  const [databaseStatus, setDatabaseStatus] = useState<{ connected: boolean; tableExists: boolean; message: string }>({
    connected: true,
    tableExists: getRemoteTableStatus() !== 'missing',
    message: 'Supabase database connection configured.'
  });

  const isTableMissing = databaseStatus.connected && !databaseStatus.tableExists;

  // Check and update database status
  const checkDatabaseStatus = useCallback(async (force = false) => {
    try {
      const status = await checkDatabaseUsersTableStatus(force);
      setDatabaseStatus(status);
      return status;
    } catch {
      const fallback = {
        connected: false,
        tableExists: false,
        message: 'Unable to query Supabase status'
      };
      setDatabaseStatus(fallback);
      return fallback;
    }
  }, []);

  const appendUsersToRemoteDb = useCallback(async () => {
    return { success: true, count: 0, message: 'Ready' };
  }, []);

  // Fetch fresh profile directly from public.users table in Supabase
  const refreshProfile = useCallback(async () => {
    const targetEmail = userProfile?.email || authenticatedUser?.email;
    if (!targetEmail) return;

    try {
      const cleanEmail = targetEmail.trim().toLowerCase();
      if (isSupabaseConfigured) {
        const { data: dbData, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (!error && dbData) {
          const dynamicRole = ((dbData.role || 'customer') as string).toLowerCase().trim() as Role;
          const freshProfile: UserProfile = {
            id: dbData.id,
            full_name: dbData.full_name || '',
            email: dbData.email,
            phone: dbData.phone || '',
            role: dynamicRole,
            status: (dbData.status || 'active') as UserStatus,
            profile_image: dbData.profile_image || '',
            created_at: dbData.created_at,
            updated_at: dbData.updated_at
          };

          saveLocalFallbackProfile(freshProfile);
          setUserProfile(freshProfile);
          localStorage.setItem(
            STORAGE_KEY_SESSION,
            JSON.stringify({
              id: freshProfile.id,
              email: freshProfile.email,
              role: freshProfile.role,
              timestamp: Date.now()
            })
          );
        }
      }
    } catch (e) {
      console.warn('Error refreshing profile from Supabase:', e);
    }
  }, [userProfile?.email, authenticatedUser?.email]);

  // Sync profile when window is refocused or becomes visible (e.g. after changing role in Supabase dashboard)
  useEffect(() => {
    const handleSyncOnTabFocus = () => {
      if (document.visibilityState === 'visible') {
        refreshProfile();
      }
    };

    window.addEventListener('focus', handleSyncOnTabFocus);
    document.addEventListener('visibilitychange', handleSyncOnTabFocus);
    return () => {
      window.removeEventListener('focus', handleSyncOnTabFocus);
      document.removeEventListener('visibilitychange', handleSyncOnTabFocus);
    };
  }, [refreshProfile]);

  // Initialize session on startup
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        await checkDatabaseStatus();

        let targetEmail: string | null = null;
        let sessionUser: any = null;

        // 1. Try Supabase Auth getSession()
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.email) {
            targetEmail = session.user.email.toLowerCase();
            sessionUser = session.user;
          }
        } catch {
          // ignore
        }

        // 2. If no active Auth session, check persistent session in localStorage
        if (!targetEmail) {
          try {
            const storedRaw = localStorage.getItem(STORAGE_KEY_SESSION);
            if (storedRaw) {
              const parsed = JSON.parse(storedRaw);
              if (parsed?.email) {
                targetEmail = parsed.email.toLowerCase();
                sessionUser = { id: parsed.id, email: parsed.email };
              }
            }
          } catch {}
        }

        // 3. If an authenticated email exists, query public.users table from Supabase for fresh role
        if (targetEmail) {
          const cleanEmail = targetEmail.trim().toLowerCase();
          let profile: UserProfile | null = null;

          if (isSupabaseConfigured) {
            try {
              const { data: dbData } = await supabase
                .from('users')
                .select('*')
                .eq('email', cleanEmail)
                .maybeSingle();

              if (dbData) {
                const dynamicRole = ((dbData.role || 'customer') as string).toLowerCase().trim() as Role;
                profile = {
                  id: dbData.id,
                  full_name: dbData.full_name || '',
                  email: dbData.email,
                  phone: dbData.phone || '',
                  role: dynamicRole,
                  status: (dbData.status || 'active') as UserStatus,
                  profile_image: dbData.profile_image || '',
                  created_at: dbData.created_at,
                  updated_at: dbData.updated_at
                };
              }
            } catch {}
          }

          if (!profile) {
            profile = getLocalFallbackProfile(cleanEmail);
          }

          if (isMounted) {
            if (profile && profile.status === 'active') {
              setAuthenticatedUser(sessionUser || { id: profile.id, email: cleanEmail });
              setUserProfile(profile);
              localStorage.setItem(
                STORAGE_KEY_SESSION,
                JSON.stringify({
                  id: profile.id,
                  email: profile.email,
                  role: profile.role,
                  timestamp: Date.now()
                })
              );
            } else {
              try {
                await supabase.auth.signOut();
              } catch {}
              localStorage.removeItem(STORAGE_KEY_SESSION);
              setAuthenticatedUser(null);
              setUserProfile(null);
            }
          }
        } else {
          if (isMounted) {
            setAuthenticatedUser(null);
            setUserProfile(null);
          }
        }
      } catch (err) {
        console.warn('Session initialization note:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen to Supabase auth state changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setAuthenticatedUser(null);
        setUserProfile(null);
        setIsLoading(false);
      } else if (session?.user?.email) {
        const userEmail = session.user.email.toLowerCase();

        // Query fresh from public.users table in Supabase
        let profile: UserProfile | null = null;
        try {
          const { data: dbData } = await supabase
            .from('users')
            .select('*')
            .eq('email', userEmail)
            .maybeSingle();

          if (dbData) {
            const dynamicRole = ((dbData.role || 'customer') as string).toLowerCase().trim() as Role;
            profile = {
              id: dbData.id,
              full_name: dbData.full_name || '',
              email: dbData.email,
              phone: dbData.phone || '',
              role: dynamicRole,
              status: (dbData.status || 'active') as UserStatus,
              profile_image: dbData.profile_image || '',
              created_at: dbData.created_at,
              updated_at: dbData.updated_at
            };
          }
        } catch {}

        if (!profile) {
          profile = getLocalFallbackProfile(userEmail);
        }

        if (profile && profile.status === 'active') {
          setAuthenticatedUser(session.user);
          setUserProfile(profile);
          localStorage.setItem(
            STORAGE_KEY_SESSION,
            JSON.stringify({
              id: profile.id,
              email: profile.email,
              role: profile.role,
              timestamp: Date.now()
            })
          );
        }
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [checkDatabaseStatus]);

  // Login handler
  const login = async (
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    error?: string;
    isEmailUnconfirmed?: boolean;
    notFound?: boolean;
    role?: Role;
  }> => {
    setIsLoading(true);

    try {
      const cleanEmail = email ? email.trim().toLowerCase() : '';
      const cleanPassword = typeof password === 'string' ? password.trim() : '';

      if (!cleanEmail) {
        setIsLoading(false);
        return { success: false, error: 'Please enter your email address.' };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        setIsLoading(false);
        return { success: false, error: 'Please enter a valid email address.' };
      }

      if (!cleanPassword) {
        setIsLoading(false);
        return { success: false, error: 'Please enter your password.' };
      }

      // 1. Supabase Authentication
      if (isSupabaseConfigured) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword
        });

        if (authError) {
          setIsLoading(false);

          // Email unconfirmed check
          const isEmailUnconfirmedError =
            authError.code === 'email_not_confirmed' ||
            (authError as any).error_code === 'email_not_confirmed' ||
            authError.message?.toLowerCase().includes('email not confirmed') ||
            authError.message?.toLowerCase().includes('unconfirmed');

          if (isEmailUnconfirmedError) {
            return {
              success: false,
              isEmailUnconfirmed: true,
              error: 'Your email address has not been confirmed yet. Please verify your email via the confirmation link sent to your inbox.'
            };
          }

          // Invalid credentials
          const isInvalidCredentialsError =
            authError.code === 'invalid_credentials' ||
            (authError as any).error_code === 'invalid_credentials' ||
            authError.message?.toLowerCase().includes('invalid login credentials') ||
            authError.message?.toLowerCase().includes('invalid credentials');

          if (isInvalidCredentialsError) {
            return {
              success: false,
              error: 'Invalid email or password. Please verify your credentials and try again.'
            };
          }

          // Rate limit
          if (authError.status === 429 || authError.message?.toLowerCase().includes('rate limit')) {
            return {
              success: false,
              error: 'Too many login attempts (HTTP 429). Please wait a moment and try again.'
            };
          }

          return {
            success: false,
            error: authError.message || 'Authentication failed. Please verify your credentials.'
          };
        }

        // 2. Authentication succeeded! Fetch the user's current role directly from public.users table in Supabase
        if (authData?.user) {
          const authUserId = authData.user.id;

          // Fetch fresh from Supabase database
          const { data: dbData } = await supabase
            .from('users')
            .select('*')
            .eq('email', cleanEmail)
            .maybeSingle();

          let profile: UserProfile;

          if (dbData) {
            const dynamicRole = ((dbData.role || 'customer') as string).toLowerCase().trim() as Role;
            profile = {
              id: dbData.id,
              full_name: dbData.full_name || authData.user.user_metadata?.full_name || cleanEmail.split('@')[0],
              email: dbData.email,
              phone: dbData.phone || '',
              role: dynamicRole,
              status: (dbData.status || 'active') as UserStatus,
              profile_image: dbData.profile_image || '',
              created_at: dbData.created_at,
              updated_at: dbData.updated_at
            };

            // Keep ID synced to Auth user id if different
            if (dbData.id !== authUserId) {
              await supabase.from('users').update({ id: authUserId, updated_at: new Date().toISOString() }).eq('email', cleanEmail);
              profile.id = authUserId;
            }
          } else {
            // If row does not exist yet in public.users, create it with role: customer
            profile = {
              id: authUserId,
              full_name: authData.user.user_metadata?.full_name || cleanEmail.split('@')[0],
              email: cleanEmail,
              phone: authData.user.user_metadata?.phone || '',
              role: 'customer',
              status: 'active',
              profile_image: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanEmail)}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            await supabase.from('users').upsert({
              id: profile.id,
              full_name: profile.full_name,
              email: profile.email,
              phone: profile.phone,
              role: profile.role,
              status: profile.status,
              profile_image: profile.profile_image,
              created_at: profile.created_at,
              updated_at: profile.updated_at
            }, { onConflict: 'email' });
          }

          if (profile.status === 'blocked') {
            await supabase.auth.signOut();
            localStorage.removeItem(STORAGE_KEY_SESSION);
            setIsLoading(false);
            return {
              success: false,
              error: 'Your account has been suspended by system administration.'
            };
          }

          saveLocalFallbackProfile(profile);

          localStorage.setItem(
            STORAGE_KEY_SESSION,
            JSON.stringify({
              id: profile.id,
              email: profile.email,
              role: profile.role,
              timestamp: Date.now()
            })
          );

          setAuthenticatedUser(authData.user);
          setUserProfile(profile);
          setIsLoading(false);

          return {
            success: true,
            role: profile.role
          };
        }
      }

      setIsLoading(false);
      return { success: false, error: 'Authentication service unavailable.' };
    } catch (err: any) {
      setIsLoading(false);
      return {
        success: false,
        error: err?.message || 'An unexpected error occurred during sign-in.'
      };
    }
  };

  // Resend confirmation email handler
  const resendConfirmationEmail = async (
    email: string
  ): Promise<{ success: boolean; message: string; error?: string }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail) {
        return { success: false, message: 'Please provide a valid email address.' };
      }
      if (!isSupabaseConfigured) {
        return { success: false, message: 'Supabase is not configured.' };
      }
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail
      });
      if (error) {
        if (error.status === 429 || error.message?.toLowerCase().includes('rate limit')) {
          return {
            success: false,
            message: 'A confirmation email was already sent recently. Please check your inbox or wait a moment before trying again.',
            error: error.message
          };
        }
        return {
          success: false,
          message: error.message || 'Failed to resend confirmation email.',
          error: error.message
        };
      }
      return {
        success: true,
        message: `Confirmation email has been sent to ${cleanEmail}. Please check your inbox and click the verification link.`
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to resend confirmation email.', error: err?.message };
    }
  };

  // Verify email confirmation via OTP
  const verifyEmailConfirmation = async (
    email: string,
    token: string
  ): Promise<{ success: boolean; error?: string; role?: Role }> => {
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanToken = token.trim();
      if (!cleanEmail || !cleanToken) {
        setIsLoading(false);
        return { success: false, error: 'Email and verification code are required.' };
      }
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'signup'
      });
      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message || 'Invalid or expired confirmation code.' };
      }
      if (data?.user) {
        const { data: dbData } = await supabase
          .from('users')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();

        const role = ((dbData?.role || 'customer') as string).toLowerCase().trim() as Role;
        const profile: UserProfile = {
          id: data.user.id,
          full_name: dbData?.full_name || cleanEmail.split('@')[0],
          email: cleanEmail,
          phone: dbData?.phone || '',
          role,
          status: 'active',
          profile_image: dbData?.profile_image || '',
          created_at: dbData?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        saveLocalFallbackProfile(profile);
        localStorage.setItem(
          STORAGE_KEY_SESSION,
          JSON.stringify({
            id: profile.id,
            email: profile.email,
            role: profile.role,
            timestamp: Date.now()
          })
        );
        setAuthenticatedUser(data.user);
        setUserProfile(profile);
        setIsLoading(false);
        return { success: true, role: profile.role };
      }
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err?.message || 'Verification failed.' };
    }
  };

  // Customer Registration handler
  const register = async (
    fullName: string,
    email: string,
    phone: string,
    password: string = 'password'
  ): Promise<{
    success: boolean;
    error?: string;
    isEmailUnconfirmed?: boolean;
    alreadyExists?: boolean;
    isRateLimited?: boolean;
  }> => {
    setIsLoading(true);

    try {
      const cleanEmail = email ? email.trim().toLowerCase() : '';
      const cleanPassword = typeof password === 'string' ? password.trim() : '';
      const cleanFullName = fullName ? fullName.trim() : '';
      const cleanPhone = phone ? phone.trim() : '';

      if (!cleanEmail) {
        setIsLoading(false);
        return { success: false, error: 'Email address is required.' };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        setIsLoading(false);
        return { success: false, error: 'Please enter a valid email address.' };
      }

      if (!cleanPassword || cleanPassword.length < 6) {
        setIsLoading(false);
        return { success: false, error: 'Password must be at least 6 characters long.' };
      }

      if (isSupabaseConfigured) {
        // 1. Sign up with Supabase Authentication
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            data: {
              full_name: cleanFullName,
              phone: cleanPhone,
              role: 'customer'
            }
          }
        });

        if (signUpError) {
          setIsLoading(false);

          const isRateLimit =
            signUpError.status === 429 ||
            (signUpError as any).error_code === 'over_email_send_rate_limit' ||
            signUpError.message?.toLowerCase().includes('rate limit') ||
            signUpError.message?.toLowerCase().includes('too many requests');

          if (isRateLimit) {
            return {
              success: false,
              isRateLimited: true,
              error: 'Supabase Rate Limit (HTTP 429): Please wait a moment before trying again.'
            };
          }

          const isUserAlreadyExists =
            signUpError.code === 'user_already_exists' ||
            (signUpError as any).error_code === 'user_already_exists' ||
            signUpError.message?.toLowerCase().includes('already registered') ||
            signUpError.message?.toLowerCase().includes('already exists') ||
            signUpError.message?.toLowerCase().includes('already been registered');

          if (isUserAlreadyExists) {
            // Reconcile into public.users so the profile is definitely in the Supabase Table Editor
            try {
              const { data: existingDb } = await supabase
                .from('users')
                .select('*')
                .eq('email', cleanEmail)
                .maybeSingle();

              if (!existingDb) {
                await supabase.from('users').upsert({
                  id: `u-${Date.now()}`,
                  full_name: cleanFullName || cleanEmail.split('@')[0],
                  email: cleanEmail,
                  phone: cleanPhone || '',
                  role: 'customer',
                  status: 'active',
                  profile_image: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanFullName || cleanEmail)}`,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }, { onConflict: 'email' });
              }
            } catch {}

            return {
              success: false,
              alreadyExists: true,
              error: `The email "${cleanEmail}" is already registered. Please sign in with your password.`
            };
          }

          return {
            success: false,
            error: signUpError.message || 'Registration failed.'
          };
        }

        // 2. Obtain user UUID and IMMEDIATELY insert/upsert into public.users table in Supabase
        const authUser = signUpData?.user;
        const authUserId = authUser?.id || `u-${Date.now()}`;

        const profilePayload: UserProfile = {
          id: authUserId,
          full_name: cleanFullName,
          email: cleanEmail,
          phone: cleanPhone,
          role: 'customer', // strictly customer for self-registration
          status: 'active',
          profile_image: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanFullName)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error: insertError } = await supabase
          .from('users')
          .upsert({
            id: profilePayload.id,
            full_name: profilePayload.full_name,
            email: profilePayload.email,
            phone: profilePayload.phone,
            role: profilePayload.role,
            status: profilePayload.status,
            profile_image: profilePayload.profile_image,
            created_at: profilePayload.created_at,
            updated_at: profilePayload.updated_at
          }, { onConflict: 'email' });

        if (insertError) {
          console.warn('Notice saving to public.users:', insertError);
        }

        saveLocalFallbackProfile(profilePayload);

        // 3. If session returned immediately (email confirmation disabled or auto-confirmed)
        if (signUpData?.session) {
          localStorage.setItem(
            STORAGE_KEY_SESSION,
            JSON.stringify({
              id: profilePayload.id,
              email: profilePayload.email,
              role: profilePayload.role,
              timestamp: Date.now()
            })
          );

          setAuthenticatedUser(authUser);
          setUserProfile(profilePayload);
          setIsLoading(false);

          return {
            success: true,
            isEmailUnconfirmed: false
          };
        } else {
          // Session is null -> Email confirmation required by Supabase project
          setIsLoading(false);
          return {
            success: true,
            isEmailUnconfirmed: true
          };
        }
      }

      setIsLoading(false);
      return { success: false, error: 'Supabase is not configured.' };
    } catch (err: any) {
      setIsLoading(false);
      return {
        success: false,
        error: err?.message || 'Failed to complete registration.'
      };
    }
  };

  // Google Sign-In placeholder for interface compatibility
  const signInWithGoogle = async () => {
    return { success: false, error: 'Google sign-in is disabled. Please sign in with email and password.' };
  };

  // Google Register placeholder for interface compatibility
  const registerWithGoogle = async () => {
    return { success: false, error: 'Google sign-up is disabled. Please register with email and password.' };
  };

  // Master Admin Setup handler
  const setupAdmin = async (
    fullName: string,
    phone: string,
    password: string = 'password'
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      const cleanEmail = DEFAULT_ADMIN_EMAIL;
      let authUser: any = null;

      if (isSupabaseConfigured) {
        try {
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              data: {
                full_name: fullName.trim() || 'Appala Naidu',
                role: 'admin'
              }
            }
          });

          if (authError) {
            const { data: signInData } = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password
            });
            authUser = signInData?.user || { id: `8ef2e174-d93f-4961-8259-94ce37e202a8`, email: cleanEmail };
          } else {
            authUser = authData?.user || { id: `8ef2e174-d93f-4961-8259-94ce37e202a8`, email: cleanEmail };
          }
        } catch {
          authUser = { id: `8ef2e174-d93f-4961-8259-94ce37e202a8`, email: cleanEmail };
        }
      }

      const adminProfile: UserProfile = {
        id: authUser?.id || '8ef2e174-d93f-4961-8259-94ce37e202a8',
        full_name: fullName.trim() || 'Appala Naidu',
        email: cleanEmail,
        phone: phone.trim() || '+91 99000 11223',
        role: 'admin',
        status: 'active',
        profile_image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await syncUserToDatabase(adminProfile);

      localStorage.setItem(STORAGE_ADMIN_CONFIGURED, 'true');
      localStorage.setItem(
        STORAGE_KEY_SESSION,
        JSON.stringify({
          id: adminProfile.id,
          email: adminProfile.email,
          role: adminProfile.role,
          timestamp: Date.now()
        })
      );

      setAuthenticatedUser(authUser || { id: adminProfile.id, email: adminProfile.email });
      setUserProfile(adminProfile);
      setIsAdminConfigured(true);
      setIsLoading(false);

      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return {
        success: false,
        error: err?.message || 'An unexpected error occurred during Admin setup.'
      };
    }
  };

  // Logout handler
  const logout = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch {}

    localStorage.removeItem(STORAGE_KEY_SESSION);
    setAuthenticatedUser(null);
    setUserProfile(null);
    setIsLoading(false);
  };

  const value: AuthContextType = {
    isAuthenticated: Boolean(authenticatedUser && userProfile && userProfile.status === 'active'),
    user: userProfile
      ? {
          id: userProfile.id,
          email: userProfile.email,
          fullName: userProfile.full_name,
          role: userProfile.role,
          phone: userProfile.phone,
          status: userProfile.status,
          avatarUrl: userProfile.profile_image,
          createdAt: userProfile.created_at || new Date().toISOString()
        }
      : null,
    userProfile,
    role: userProfile?.role || null,
    isLoading,
    authenticatedUser,
    isAdminConfigured,
    setIsAdminConfigured,
    setupAdmin,
    login,
    resendConfirmationEmail,
    verifyEmailConfirmation,
    signInWithGoogle,
    register,
    registerWithGoogle,
    logout,
    refreshProfile,
    databaseStatus,
    checkDatabaseStatus,
    appendUsersToRemoteDb,
    isTableMissing
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
