import PropTypes from "prop-types";
import { useEffect, useRef } from "react";
export default function SuccessCard({ result, onReset, onView }) {
  const viewRef = useRef();
  useEffect(() => {
    viewRef.current?.focus();
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full max-w-md rounded-md border border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 py-10 text-center shadow-md"
    >
      <p className="text-3xl" aria-hidden="true">
        ✅
      </p>
      <h3 className="text-emerald-600 font-semibold mt-2">
        Analysis Complete!
      </h3>
      <p className="text-slate-600 dark:text-slate-300 mt-1 text-sm">
        {result.filename} ({result.size} MB)
      </p>

      <div className="mt-6 flex flex-col items-center gap-3">
        <button
          ref={viewRef}
          autoFocus
          onClick={onView}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md
                   hover:bg-indigo-700 focus-visible:ring-2
                   focus-visible:ring-primary-500"
        >
          View Insights
        </button>
        <button
          onClick={onReset}
          className="text-indigo-600 hover:underline text-sm"
        >
          Upload Again
        </button>
      </div>
    </div>
  );
}

SuccessCard.propTypes = {
  result: PropTypes.object.isRequired,
  onReset: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
};
