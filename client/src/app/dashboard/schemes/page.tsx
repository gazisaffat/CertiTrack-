'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { api } from '@/lib/api';
import { Spinner } from '@/components/Spinner';
import { Alert } from '@/components/Alert';
import { useAuth } from '@/context/AuthContext';
import type { Paged, Scheme } from '@/lib/types';

const CATEGORIES = [
  'Textile',
  'Food & Agriculture',
  'Environmental',
  'Social Compliance',
  'Traceability'
];

const BLANK = {
  code: '',
  name: '',
  category: CATEGORIES[0],
  standardBody: '',
  summary: '',
  description: '',
  durationMonths: '12',
  feeUSD: '',
  requirements: ''
};

export default function ManageSchemesPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) router.replace('/dashboard');
  }, [authLoading, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;
    const controller = new AbortController();

    api
      .get<Paged<Scheme>>('/api/schemes?limit=50', false, controller.signal)
      .then((data) => setSchemes(data.items))
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [isAdmin]);

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const startEdit = (scheme: Scheme) => {
    setEditingId(scheme._id);
    setForm({
      code: scheme.code,
      name: scheme.name,
      category: scheme.category,
      standardBody: scheme.standardBody,
      summary: scheme.summary,
      description: scheme.description,
      durationMonths: String(scheme.durationMonths),
      feeUSD: String(scheme.feeUSD),
      requirements: scheme.requirements.join('\n')
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const reset = () => {
    setEditingId(null);
    setForm(BLANK);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);

    const payload = {
      ...form,
      durationMonths: Number(form.durationMonths),
      feeUSD: Number(form.feeUSD),
      requirements: form.requirements
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
    };

    try {
      if (editingId) {
        const updated = await api.patch<Scheme>(`/api/schemes/${editingId}`, payload);
        setSchemes((prev) => prev.map((s) => (s._id === editingId ? updated : s)));
        setNotice(`${updated.code} updated.`);
      } else {
        const created = await api.post<Scheme>('/api/schemes', payload, true);
        setSchemes((prev) => [created, ...prev]);
        setNotice(`${created.code} added to the registry.`);
      }
      reset();
      router.refresh(); // the public scheme list is server-rendered
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (scheme: Scheme) => {
    if (!window.confirm(`Remove ${scheme.code} from the registry?`)) return;

    setError('');
    setNotice('');
    try {
      const result = await api.del<{ deleted: boolean; archived: boolean; applications?: number }>(
        `/api/schemes/${scheme._id}`
      );
      setSchemes((prev) => prev.filter((s) => s._id !== scheme._id));
      setNotice(
        result.archived
          ? `${scheme.code} has ${result.applications} applications, so it was archived rather than deleted.`
          : `${scheme.code} deleted.`
      );
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (authLoading || !isAdmin) return <Spinner label="Checking your access" />;

  return (
    <div className="space-y-10">
      <form onSubmit={handleSubmit} className="card space-y-5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">
            {editingId ? 'Edit scheme' : 'Add a scheme'}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={reset}
              className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate2 hover:text-ink"
            >
              Cancel edit
            </button>
          )}
        </div>

        {error && <Alert>{error}</Alert>}
        {notice && <Alert tone="success">{notice}</Alert>}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="code">
              Scheme code
            </label>
            <input
              id="code"
              required
              className="field font-mono uppercase"
              placeholder="GOTS"
              value={form.code}
              onChange={(e) => set('code', e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="category">
              Category
            </label>
            <select
              id="category"
              className="field"
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="name">
            Full name
          </label>
          <input
            id="name"
            required
            className="field"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="standardBody">
            Standard body
          </label>
          <input
            id="standardBody"
            required
            className="field"
            value={form.standardBody}
            onChange={(e) => set('standardBody', e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="summary">
            Summary (shown on the card)
          </label>
          <textarea
            id="summary"
            rows={2}
            maxLength={400}
            required
            className="field resize-y"
            value={form.summary}
            onChange={(e) => set('summary', e.target.value)}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="durationMonths">
              Cycle length (months)
            </label>
            <input
              id="durationMonths"
              type="number"
              min={1}
              max={60}
              required
              className="field"
              value={form.durationMonths}
              onChange={(e) => set('durationMonths', e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="feeUSD">
              Indicative fee (USD)
            </label>
            <input
              id="feeUSD"
              type="number"
              min={0}
              required
              className="field"
              value={form.feeUSD}
              onChange={(e) => set('feeUSD', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="requirements">
            Required documents — one per line
          </label>
          <textarea
            id="requirements"
            rows={4}
            className="field resize-y font-mono text-xs"
            value={form.requirements}
            onChange={(e) => set('requirements', e.target.value)}
          />
        </div>

        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Saving…' : editingId ? 'Save changes' : 'Add scheme'}
        </button>
      </form>

      {loading ? (
        <Spinner label="Loading schemes" />
      ) : (
        <div className="overflow-x-auto border border-ink/12 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/12 font-mono text-[10px] uppercase tracking-[0.14em] text-slate2">
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Fee</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {schemes.map((scheme) => (
                <tr key={scheme._id}>
                  <td className="px-4 py-3">
                    <span className="plate">{scheme.code}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-ink">{scheme.name}</p>
                    <p className="text-xs text-slate2">{scheme.category}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink">
                    ${scheme.feeUSD.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn-ghost !px-3 !py-1.5 !text-[10px]"
                        onClick={() => startEdit(scheme)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-ghost !px-3 !py-1.5 !text-[10px]"
                        onClick={() => void remove(scheme)}
                      >
                        Remove
                      </button>
                    </div>
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
