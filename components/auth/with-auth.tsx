
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles: string[]
) {
  const WithAuth: React.FC<P> = (props) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.push('/auth/login');
      }

      if (!loading && user && !allowedRoles.includes(user.role)) {
        router.push('/unauthorized');
      }
    }, [user, loading, router]);

    if (loading || !user || !allowedRoles.includes(user.role)) {
      return <div>Loading...</div>; // Or a proper loading spinner
    }

    return <WrappedComponent {...props} />;
  };

  return WithAuth;
}
