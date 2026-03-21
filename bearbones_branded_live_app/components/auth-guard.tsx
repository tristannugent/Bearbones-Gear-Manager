'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getSession } from '@/lib/queries';
import { isSupabaseConfigured } from '@/lib/supabase';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function check() {
      if (!isSupabaseConfigured) {
        setReady(true);
        return;
      }
      try {
        const session = await getSession();
        const publicPath = pathname === '/' || pathname === '/login';
        if (!session && !publicPath) router.replace('/login');
        if (session && publicPath) router.replace('/inventory');
      } catch {
        if (pathname !== '/login') router.replace('/login');
      } finally {
        setReady(true);
      }
    }
    void check();
  }, [pathname, router]);

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted">Loading Bearbones Gear Manager…</div>;
  }
  return <>{children}</>;
}
