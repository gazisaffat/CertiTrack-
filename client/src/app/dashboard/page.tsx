'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { api } from '@/lib/api';
import { Spinner } from '@/components/Spinner';
import { Alert } from '@/components/Alert';
import { useAuth } from '@/context/AuthContext';
import type { ApplicationStatus, OverviewStats } from '@/lib/types';

const ORDER: ApplicationStatus[] = [
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'withdrawn'
];

const LABELS: Record<ApplicationStatus, string> = {
  submitted: 'Submitted',
  under_review: 'Under review',
  approved: 'Approved',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn'
};

export default function DashboardOverview() {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    api
      .get<OverviewStats>('/api/stats/overview', true, controller.signal)
      .then(setStats)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  if (loading) return <Spinner label="Loading your overview" />;
  if (error) return <Alert>{error}</Alert>;
  if (!stats) return null;

  const max = Math.max(1, ...ORDER.map((s) => stats.statusCounts[s]));

  return (
    <div className="space-y-10">
      <div className="grid gap-px border border-ink/12 bg-ink/10 sm:grid-cols-3">
        <div className="bg-white px-5 py-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate2">
            {stats.scope === 'platform' ? 'All applications' : 'Your applications'}
          </p>
          <p className="mt-1 font-display text-3xl font-bold text-ink">{stats.total}</p>
        </div>
        <div className="bg-white px-5 py-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate2">
            Awaiting a decision
          </p>
          <p className="mt-1 font-display text-3xl font-bold text-ink">
            {stats.statusCounts.submitted + stats.statusCounts.under_review}
          </p>
        </div>
        <div className="bg-white px-5 py-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate2">
            {stats.scope === 'platform' ? 'Active schemes' : 'Approved'}
          </p>
          <p className="mt-1 font-display text-3xl font-bold text-ink">
            {stats.scope === 'platform' ? (stats.schemeCount ?? 0) : stats.statusCounts.approved}
          </p>
        </div>
      </div>

      <section>
        <h2 className="font-display text-xl font-semibold text-ink">By status</h2>
        <ul className="mt-5 space-y-3">
          {ORDER.map((status) => {
            const count = stats.statusCounts[status];
            return (
              <li key={status} className="flex items-center gap-4">
                <span className="w-32 shrink-0 font-mono text-[11px] uppercase tracking-[0.12em] text-slate2">
                  {LABELS[status]}
                </span>
                <span className="h-3 flex-1 bg-ink/5">
                  <span
                    className="block h-full bg-seal"
                    style={{ width: `${(count / max) * 100}%` }}
                  />
                </span>
                <span className="w-8 text-right font-mono text-sm text-ink">{count}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="rule-perf flex flex-wrap gap-3 pt-6">
        <Link href="/schemes" className="btn-primary">
          Start a new application
        </Link>
        <Link href="/dashboard/applications" className="btn-ghost">
          {isAdmin ? 'My own applications' : 'View my applications'}
        </Link>
      </div>
    </div>
  );
}
