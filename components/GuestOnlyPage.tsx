
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/AuthContext';

import { ReactNode } from 'react';

interface GuestOnlyPageProps {
  children: ReactNode;
}

export default function GuestOnlyPage({ children }: GuestOnlyPageProps) {
  const router = useRouter();
  const { token, role, authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push('/login');
    } else if (role !== 'invitado') {
      router.push('/dashboard');
    }
  }, [token, role, router, authLoading]);

  if (authLoading) return <div>Cargando...</div>;
  return <>{children}</>;
}
