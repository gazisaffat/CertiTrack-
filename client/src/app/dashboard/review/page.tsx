'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { api } from '@/lib/api';
import { Spinner } from '@/components/Spinner';
import { Alert } from '@/components/Alert';
import { EmptyState } from '@/components/EmptyState';
import { StatusStamp } from '@/components/StatusStamp';
import { useAuth } from '@/context/AuthContext';
import type { Application, ApplicationStatus } from '@/lib/types';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' }
];

const DECISIONS: { status: ApplicationStatus; label: string }[] = [
  { status: 'under_review', label: 'Move to review' },
  { status: 'approved', label: 'Approve' },
  { status: 'rejected', label: 'Reject' }
];

export default function ReviewQueuePage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<Application[]>([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [pending, setPending] = useState(false);

  // Middleware cannot read the role (it is inside the signed JWT), so the
  // admin-only redirect happens here. The API is still the real gate.
  useEffect(() => {
    if (!authLoading && !isAdmin) router.replace('/dashboard');
  }, [authLoading, isAdmin, router]);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      try {
        const query = new URLSearchParams({ status, search });
        setItems(await api.get<Application[]>(`/api/applications?${query}`, true, signal));
        setError('');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [status, search]
  );

  useEffect(() => {
    if (!isAdmin) return;
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, isAdmin]);

  const decide = async (id: string, next: ApplicationStatus) => {
    setPending(true);
    try {
      const updated = await api.patch<Application>(`/api/applications/${id}/status`, {
        status: next,
        reviewerNote: note
      });
      setItems((prev) => prev.map((item) => (item._id === id ? updated : item)));
      setOpenId(null);
      setNote('');
      setError('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  };

  if (authLoading || !isAdmin) return <Spinner label="Checking your access" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          className="field flex-1"
          placeholder="Search company, email or scheme"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search applications"
        />
        <select
          className="field sm:w-48"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
        >
          {FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Spinner label="Loading the review queue" />
      ) : items.length === 0 ? (
        <EmptyState
          title="Nothing in this queue"
          body="No application matches the current filter. Clear the search or switch the status filter to see more."
        />
      ) : (
        <div className="overflow-x-auto border border-ink/12 bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/12 font-mono text-[10px] uppercase tracking-[0.14em] text-slate2">
                <th className="px-4 py-3 font-medium">Scheme</th>
                <th className="px-4 py-3 font-medium">Applicant</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {items.map((item) => (
                <tr key={item._id} className="align-top">
                  <td className="px-4 py-4">
                    <span className="plate">{item.schemeCode}</span>
                    <p className="mt-2 text-xs text-slate2">{item.schemeName}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-ink">{item.companyName}</p>
                    <p className="font-mono text-xs text-slate2">{item.applicantEmail}</p>
                    <p className="mt-1 text-xs text-slate2">
                      {item.country} · {item.employeeCount} staff
                    </p>
                  </td>
                  <td className="px-4 py-4 font-mono text-xs text-slate2">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4">
                    <StatusStamp status={item.status} />
                    {item.reviewedBy && (
                      <p className="mt-2 font-mono text-[10px] text-slate2">by {item.reviewedBy}</p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {openId === item._id ? (
                      <div className="w-64 space-y-2">
                        <textarea
                          rows={3}
                          className="field text-xs"
                          placeholder="Note shown to the applicant"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                        />
                        <div className="flex flex-wrap gap-2">
                          {DECISIONS.map((d) => (
                            <button
                              key={d.status}
                              type="button"
                              disabled={pending}
                              onClick={() => void decide(item._id, d.status)}
                              className="btn-ghost !px-2.5 !py-1.5 !text-[10px]"
                            >
                              {d.label}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenId(null);
                              setNote('');
                            }}
                            className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate2 hover:text-ink"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn-ghost !px-3 !py-1.5 !text-[10px]"
                        disabled={item.status === 'withdrawn'}
                        onClick={() => {
                          setOpenId(item._id);
                          setNote(item.reviewerNote);
                        }}
                      >
                        Record decision
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
