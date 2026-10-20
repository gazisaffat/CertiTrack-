'use client';

import { Suspense, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import { Alert } from '@/components/Alert';
import { Spinner } from '@/components/Spinner';
import { readableAuthError } from '@/lib/authErrors';

function LoginForm() {
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get('from') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setError('');
    setBusy(true);
    try {
      await action();
      router.replace(redirectTo);
      router.refresh();
    } catch (err) {
      setError(readableAuthError(err));
      setBusy(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void run(() => signInWithEmail(email, password));
  };

  return (
    <section className="mx-auto max-w-md px-5 py-20">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate2">Registry access</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">Sign in</h1>

      <form onSubmit={handleSubmit} className="card mt-8 space-y-4 p-6">
        {error && <Alert>{error}</Alert>}

        <div>
          <label className="label" htmlFor="email">
            Work email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className="field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            className="field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <div className="rule-perf pt-4">
          <button
            type="button"
            className="btn-ghost w-full"
            disabled={busy}
            onClick={() => void run(signInWithGoogle)}
          >
            Continue with Google
          </button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-slate2">
        No account yet?{' '}
        <Link href="/register" className="text-seal hover:underline">
          Create one
        </Link>
      </p>
    </section>
  );
}

export default function LoginPage() {
  // useSearchParams needs a Suspense boundary in the App Router.
  return (
    <Suspense fallback={<Spinner label="Loading" />}>
      <LoginForm />
    </Suspense>
  );
}
