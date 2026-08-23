import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 py-24 text-center">
      <p className="font-display text-6xl font-extrabold gradient-text">404</p>
      <h1 className="font-display text-xl font-semibold">This page wandered off</h1>
      <p className="max-w-sm text-sm text-muted">
        The page you&rsquo;re looking for doesn&rsquo;t exist. Head back and paste your link again.
      </p>
      <Link href="/" className="btn-gradient mt-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white">
        Back to Snapgrab
      </Link>
    </div>
  );
}
