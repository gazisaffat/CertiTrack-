'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { api } from '@/lib/api';
import { Alert } from '@/components/Alert';
import { useAuth } from '@/context/AuthContext';
import type { Application, Scheme } from '@/lib/types';

export function ApplyForm({ scheme }: { scheme: Scheme }) {
  const { user } = useAuth();
  const router = useRouter();

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    country: 'Bangladesh',
    employeeCount: '',
    contactPhone: '',
    notes: ''
  });

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      await api.post<Application>(
        '/api/applications',
        {
          schemeId: scheme._id,
          applicantName: user?.name ?? '',
          ...form,
          employeeCount: Number(form.employeeCount)
        },
        true
      );
      router.push('/dashboard/applications');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit the application.');
      setBusy(false);
    }
  };

  return (
    <>
      <p className="mt-2 text-sm leading-relaxed text-slate2">
        Submitted as <span className="font-mono text-ink">{user?.email ?? '…'}</span>. The fee
        recorded on this application will be ${scheme.feeUSD.toLocaleString()}, fixed at submission.
      </p>

      <form onSubmit={handleSubmit} className="card mt-8 space-y-5 p-6">
        {error && <Alert>{error}</Alert>}

        <div>
          <label className="label" htmlFor="companyName">
            Legal company name
          </label>
          <input
            id="companyName"
            required
            className="field"
            value={form.companyName}
            onChange={(e) => set('companyName', e.target.value)}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="country">
              Country of operation
            </label>
            <input
              id="country"
              required
              className="field"
              value={form.country}
              onChange={(e) => set('country', e.target.value)}
            />
          </div>

          <div>
            <label className="label" htmlFor="employeeCount">
              Employees on site
            </label>
            <input
              id="employeeCount"
              type="number"
              min={1}
              required
              className="field"
              value={form.employeeCount}
              onChange={(e) => set('employeeCount', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="contactPhone">
            Contact number
          </label>
          <input
            id="contactPhone"
            required
            className="field"
            placeholder="+880 …"
            value={form.contactPhone}
            onChange={(e) => set('contactPhone', e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="notes">
            Anything the reviewer should know
          </label>
          <textarea
            id="notes"
            rows={4}
            maxLength={1000}
            className="field resize-y"
            placeholder="Previous certifications, planned audit window, sub-contracted units…"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </div>

        <div className="rule-perf pt-5">
          <p className="mb-4 text-xs leading-relaxed text-slate2">
            You will need {scheme.requirements.length} supporting documents at the audit stage. The
            list is on the scheme page.
          </p>
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? 'Submitting…' : `Submit application for ${scheme.code}`}
          </button>
        </div>
      </form>
    </>
  );
}
