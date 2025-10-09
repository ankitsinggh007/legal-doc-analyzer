import PropTypes from "prop-types";

export default function ErrorCard({ message, onRetry }) {
  return (
    <div className="w-full max-w-md rounded-md border border-rose-500 bg-rose-50 dark:bg-rose-900/20 py-10 text-center shadow-md">
      <p className="text-3xl">❌</p>
      <h3 className="text-rose-600 font-semibold mt-2">Analysis Failed</h3>
      <p className="text-slate-600 dark:text-slate-300 mt-1 text-sm">
        {message}
      </p>
      <button
        onClick={onRetry}
        className="mt-4 bg-rose-600 text-white px-4 py-2 rounded-md hover:bg-rose-700"
      >
        Retry
      </button>
    </div>
  );
}

ErrorCard.propTypes = {
  message: PropTypes.string.isRequired,
  onRetry: PropTypes.func.isRequired,
};
