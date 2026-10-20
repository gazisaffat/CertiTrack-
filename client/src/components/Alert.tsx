export function Alert({
  tone = 'error',
  children
}: {
  tone?: 'error' | 'success';
  children: React.ReactNode;
}) {
  const className =
    tone === 'error'
      ? 'border-red-700/30 bg-red-50 text-red-900'
      : 'border-seal/40 bg-sealSoft text-seal';

  return (
    <p className={`border px-3 py-2.5 text-sm ${className}`} role="alert">
      {children}
    </p>
  );
}
