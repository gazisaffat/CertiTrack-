'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';

function navClass(active: boolean) {
  return `font-mono text-[11px] uppercase tracking-[0.14em] transition ${
    active ? 'text-seal' : 'text-slate2 hover:text-ink'
  }`;
}

export function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    router.push('/');
    router.refresh(); // drop any server-rendered output that assumed a session
  };

  const links = (
    <>
      <Link
        href="/schemes"
        className={navClass(pathname.startsWith('/schemes'))}
        onClick={() => setOpen(false)}
      >
        Schemes
      </Link>
      {user && (
        <Link
          href="/dashboard"
          className={navClass(pathname === '/dashboard')}
          onClick={() => setOpen(false)}
        >
          Dashboard
        </Link>
      )}
      {isAdmin && (
        <Link
          href="/dashboard/review"
          className={navClass(pathname.startsWith('/dashboard/review'))}
          onClick={() => setOpen(false)}
        >
          Review queue
        </Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-20 border-b border-ink/12 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display text-lg font-bold tracking-tight text-ink">CertiTrack</span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-slate2 sm:inline">
            registry
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">{links}</nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <span className="font-mono text-[11px] text-slate2">{user.email}</span>
              <button type="button" onClick={handleLogout} className="btn-ghost !py-2">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost !py-2">
                Sign in
              </Link>
              <Link href="/register" className="btn-primary !py-2">
                Create account
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="btn-ghost !px-3 !py-2 md:hidden"
          aria-expanded={open}
          aria-label="Toggle navigation"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </div>

      {open && (
        <div className="border-t border-ink/12 px-5 py-4 md:hidden">
          <nav className="flex flex-col gap-4">{links}</nav>
          <div className="mt-5 flex flex-col gap-2">
            {user ? (
              <button type="button" onClick={handleLogout} className="btn-ghost">
                Sign out
              </button>
            ) : (
              <>
                <Link href="/login" className="btn-ghost" onClick={() => setOpen(false)}>
                  Sign in
                </Link>
                <Link href="/register" className="btn-primary" onClick={() => setOpen(false)}>
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
