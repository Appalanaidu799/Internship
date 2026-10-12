import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types/auth';

interface ProtectedRouteProps {
  allowedRole: Role;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRole, children }) => {
  const { role, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-white">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Verifying authorization clearance...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, the parent router should show login
  if (!isAuthenticated || !role) {
    return null;
  }

  // If user has a different role, they must NOT be permitted to see this route
  if (role !== allowedRole) {
    // The main router handles redirecting them to their respective dashboard
    return null;
  }

  return <>{children}</>;
};
