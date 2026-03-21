'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Boxes, Camera, ClipboardCheck, LogOut, PackageOpen, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { signOut } from '@/lib/queries';

const links = [
  { href: '/inventory', label: 'Inventory', icon: Camera },
  { href: '/packages', label: 'Packages', icon: PackageOpen },
  { href: '/checkouts', label: 'Checkouts', icon: ClipboardCheck },
  { href: '/settings', label: 'Settings', icon: Settings2 },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-4 md:flex-row md:px-6">
      <aside className="card h-fit w-full p-4 md:sticky md:top-4 md:w-72">
        <div className="mb-6 flex items-center justify-between md:block">
          <Logo compact />
        </div>
        <nav className="grid gap-2">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition',
                  pathname === link.href ? 'bg-accent text-background' : 'bg-panel2 text-foreground hover:bg-white/5'
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-6 rounded-xl border border-border bg-panel2 p-4 text-sm text-muted">
          <div className="mb-2 flex items-center gap-2 text-foreground">
            <Boxes className="h-4 w-4 text-accent2" />
            Shoot-ready workflow
          </div>
          Track inventory, prep packages, and check out gear across office, studio, and on-set locations.
        </div>
        <button
          type="button"
          className="btn-secondary mt-6 w-full"
          onClick={async () => {
            try {
              await signOut();
              router.push('/login');
            } catch (error) {
              console.error(error);
            }
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </button>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
