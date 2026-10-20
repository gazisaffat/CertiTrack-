'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/Spinner';

function tabClass(active: boolean) {
  return `border-b-2 px-1 pb-2 font-mono text-[11px] uppercase tracking-[0.14em] transition ${
    active ? 'border-seal text-seal' : 'border-transparent text-slate2 hover:text-ink'
  }`;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  const pathname = usePathname();

  // Middleware already blocked visitors without a session cookie; this only
  // covers the moment before Firebase has restored the user object.
  if (loading || !user) return <Spinner label="Checking your session" />;

  return (
    <div>
      <div className="mx-auto max-w-6xl px-5 pt-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate2">
          {isAdmin ? 'Administrator' : 'Applicant'}
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">
          {user.name || user.email}
        </h1>

        <nav className="mt-8 flex gap-6 overflow-x-auto border-b border-ink/12">
          <Link href="/dashboard" className={tabClass(pathname === '/dashboard')}>
            Overview
          </Link>
          <Link
            href="/dashboard/applications"
            className={tabClass(pathname === '/dashboard/applications')}
          >
            My applications
          </Link>
          {isAdmin && (
            <>
              <Link href="/dashboard/review" className={tabClass(pathname === '/dashboard/review')}>
                Review queue
              </Link>
              <Link
                href="/dashboard/schemes"
                className={tabClass(pathname === '/dashboard/schemes')}
              >
                Manage schemes
              </Link>
            </>
          )}
        </nav>
      </div>

      <main className="mx-auto max-w-6xl px-5 pb-24 pt-8">{children}</main>
    </div>
  );
}
