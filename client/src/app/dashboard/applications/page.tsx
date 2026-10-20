'use client';

import { useEffect, useState } from 'react';

import { api } from '@/lib/api';
import { Spinner } from '@/components/Spinner';
import { Alert } from '@/components/Alert';
import { EmptyState } from '@/components/EmptyState';
import { StatusStamp } from '@/components/StatusStamp';
import type { Application } from '@/lib/types';

const WITHDRAWABLE = ['submitted', 'under_review'];

export default function MyApplicationsPage() {
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    api
      .get<Application[]>('/api/applications/mine', true, controller.signal)
      .then(setItems)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const withdraw = async (id: string) => {
    setError('');
    setPendingId(id);
    try {
      const updated = await api.patch<Application>(`/api/applications/${id}/withdraw`, {});
      setItems((prev) => prev.map((item) => (item._id === id ? updated : item)));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPendingId(null);
    }
  };

  if (loading) return <Spinner label="Loading your applications" />;

  if (items.length === 0) {
    return (
      <EmptyState
        title="No applications yet"
        body="Pick a certification scheme and submit your first application. It will appear here with its review status."
        actionLabel="Browse schemes"
        actionHref="/schemes"
      />
    );
  }

  return (
    <div className="space-y-4">
      {error && <Alert>{error}</Alert>}

      {items.map((item) => (
        <article key={item._id} className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="plate">{item.schemeCode}</span>
                <StatusStamp status={item.status} />
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold text-ink">
                {item.schemeName}
              </h3>
              <p className="mt-1 text-sm text-slate2">
                {item.companyName} · {item.country} · {item.employeeCount} employees
              </p>
            </div>

            <div className="text-right">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate2">
                Submitted
              </p>
              <p className="font-mono text-sm text-ink">
                {new Date(item.createdAt).toLocaleDateString()}
              </p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-slate2">
                Fee
              </p>
              <p className="font-mono text-sm text-ink">${item.feeAtSubmission.toLocaleString()}</p>
            </div>
          </div>

          {item.reviewerNote && (
            <div className="rule-perf mt-4 pt-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate2">
                Reviewer note
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate2">{item.reviewerNote}</p>
            </div>
          )}

          {WITHDRAWABLE.includes(item.status) && (
            <div className="rule-perf mt-4 pt-4">
              <button
                type="button"
                className="btn-ghost"
                disabled={pendingId === item._id}
                onClick={() => void withdraw(item._id)}
              >
                {pendingId === item._id ? 'Withdrawing…' : 'Withdraw application'}
              </button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
