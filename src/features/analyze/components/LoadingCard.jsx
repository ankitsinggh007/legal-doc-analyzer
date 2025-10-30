export default function LoadingCard() {
  return (
    <div
      className="w-full max-w-content rounded-md border-2 border-dashed
             border-indigo-500 bg-slate-50 dark:bg-slate-800
             py-12 sm:py-16 text-center animate-pulse"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <p className="text-indigo-600 font-medium">Analyzing document…</p>
      <p className="text-slate-500 text-sm mt-2">Please wait a few seconds</p>
      <span className="sr-only">Analyzing document, please wait</span>
    </div>
  );
}
