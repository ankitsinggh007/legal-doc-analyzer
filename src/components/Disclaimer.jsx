export default function Disclaimer({ className = "" }) {
  return (
    <p className={`text-xs text-slate-500 dark:text-slate-400 ${className}`}>
      AI-assisted, may be inaccurate, not legal advice.
    </p>
  );
}
