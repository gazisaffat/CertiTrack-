import type { ApplicationStatus } from '@/lib/types';

const STYLES: Record<ApplicationStatus, { label: string; className: string }> = {
  submitted: { label: 'submitted', className: 'border-ink/30 text-ink bg-white' },
  under_review: { label: 'under review', className: 'border-flag/50 text-flag bg-flag/5' },
  approved: { label: 'approved', className: 'border-seal text-seal bg-sealSoft' },
  rejected: { label: 'rejected', className: 'border-red-700/40 text-red-800 bg-red-50' },
  withdrawn: { label: 'withdrawn', className: 'border-ink/20 text-slate2 bg-ink/5' }
};

export function StatusStamp({ status }: { status: ApplicationStatus }) {
  const { label, className } = STYLES[status];
  return <span className={`stamp ${className}`}>{label}</span>;
}
