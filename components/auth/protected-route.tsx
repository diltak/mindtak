'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { getDemoUser } from '@/lib/demo-data';
import type { User } from '@/types/index';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireAuth?: boolean;
  fallbackRole?: string;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles = [], 
  requireAuth = true,
  fallbackRole = 'employee'
}: ProtectedRouteProps) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        // For demo purposes, we'll allow access with demo user
        // In production, redirect to login
        console.log('No authenticated user, using demo mode');
        return;
      }

      if (user && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // User doesn't have required role, redirect to appropriate dashboard
        switch (user.role) {
          case 'employee':
            router.push('/employee/dashboard');
            break;
          case 'manager':
            router.push('/manager/dashboard');
            break;
          case 'employer':
            router.push('/employer/dashboard');
            break;
          case 'hr':
          case 'admin':
            router.push('/employer/analytics');
            break;
          default:
            router.push('/');
        }
        return;
      }
    }
  }, [user, loading, router, allowedRoles, requireAuth]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // For demo mode, provide a demo user if no real user exists
  const currentUser = user || (requireAuth ? null : getDemoUser(fallbackRole));

  return <>{children}</>;
}

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    allowedRoles?: string[];
    requireAuth?: boolean;
    fallbackRole?: string;
  } = {}
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
