import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-6xl font-bold text-emerald-500 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Page Not Found</h2>
      <p className="text-zinc-600 dark:text-zinc-400 max-w-md mb-8">
        The requested resource or model could not be found. Please return to the homepage to explore available free LLMs.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-all shadow-sm"
      >
        Return to Home
      </Link>
    </div>
  );
}
