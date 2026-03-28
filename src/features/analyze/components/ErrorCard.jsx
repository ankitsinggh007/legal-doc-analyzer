import PropTypes from "prop-types";

export default function ErrorCard({ message, onRetry, onReset }) {
  return (
    <div
      role="alert"
      className="w-full max-w-content rounded-md border border-error
             bg-rose-50 dark:bg-rose-900/20
             py-12 text-center shadow-md"
    >
      <p className="text-3xl">❌</p>
      <h3 className="text-rose-600 font-semibold mt-2">Analysis Failed</h3>
      <p className="text-slate-600 dark:text-slate-300 mt-1 text-sm">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 bg-rose-600 text-white px-4 py-2 rounded-md hover:bg-rose-700"
        >
          Retry
        </button>
      )}
      {onReset && (
        <button
          onClick={onReset}
          className={`block mx-auto text-rose-700 hover:underline text-sm ${
            onRetry ? "mt-3" : "mt-4"
          }`}
        >
          Upload another document
        </button>
      )}
    </div>
  );
}

ErrorCard.propTypes = {
  message: PropTypes.string.isRequired,
  onRetry: PropTypes.func,
  onReset: PropTypes.func,
};
