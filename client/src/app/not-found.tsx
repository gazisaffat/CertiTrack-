import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="mx-auto max-w-xl px-5 py-28 text-center">
      <span className="plate">404</span>
      <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-ink">
        No record at this address
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-slate2">
        The page you asked for is not in the registry. It may have been archived, or the link may be
        mistyped.
      </p>
      <Link href="/schemes" className="btn-primary mt-8">
        Browse schemes
      </Link>
    </section>
  );
}
