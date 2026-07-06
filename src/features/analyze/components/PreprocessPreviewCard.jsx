import PropTypes from "prop-types";

function getQualityStyles(quality) {
  if (quality === "warning") {
    return {
      badge:
        "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200",
      accent: "bg-amber-500",
    };
  }

  return {
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-200",
    accent: "bg-emerald-500",
  };
}

export default function PreprocessPreviewCard({
  fileName,
  quality,
  qualityReason,
  blockCount,
  blocks,
  onContinue,
  onReset,
  disabled,
}) {
  const styles = getQualityStyles(quality);
  const visibleBlocks = blocks.slice(0, 6);

  return (
    <section
      className="w-full max-w-4xl overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-sm dark:border-slate-800 dark:bg-slate-900"
      aria-label="Document preprocessing preview"
    >
      <div className={`h-1 w-full ${styles.accent}`} />

      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Preprocessing complete
          </p>
          <h3 className="mt-1 break-words text-lg font-semibold text-slate-900 dark:text-slate-100">
            {fileName}
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            Review the extracted clause-like blocks before running AI analysis.
          </p>
        </div>

        <div
          className={`inline-flex w-fit items-center rounded-md border px-2.5 py-1 text-xs font-semibold uppercase ${styles.badge}`}
        >
          {quality}
        </div>
      </div>

      {qualityReason && (
        <p className="mx-5 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
          {qualityReason}
        </p>
      )}

      <div className="mx-5 mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
          <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
            Block count
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {blockCount}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
          <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
            Quality
          </p>
          <p className="mt-1 text-2xl font-semibold capitalize text-slate-900 dark:text-slate-100">
            {quality}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
          <p className="text-xs uppercase text-slate-500 dark:text-slate-400">
            Review
          </p>
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
            Confirm the extracted sections look clause-like before continuing.
          </p>
        </div>
      </div>

      <div className="mx-5 mt-5 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Extracted blocks
          </h4>
          {blockCount > visibleBlocks.length && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Previewing first {visibleBlocks.length} of {blockCount}
            </span>
          )}
        </div>
        {blockCount > visibleBlocks.length && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Only a preview is shown here. Review the visible blocks, then
            continue if they look clause-like.
          </p>
        )}

        <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
          {visibleBlocks.map((block) => (
            <article
              key={block.blockId}
              className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {block.sectionLabel}
                </p>
                <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {block.blockId}
                </span>
              </div>
              <p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-700 dark:text-slate-300">
                {block.text}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-950/70">
        <button
          onClick={onContinue}
          disabled={disabled}
          className="rounded-md bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Continue to analysis
        </button>
        <button
          onClick={onReset}
          className="text-sm text-indigo-700 hover:underline"
        >
          Upload another document
        </button>
      </div>
    </section>
  );
}

PreprocessPreviewCard.propTypes = {
  fileName: PropTypes.string,
  quality: PropTypes.oneOf(["good", "warning"]).isRequired,
  qualityReason: PropTypes.string,
  blockCount: PropTypes.number.isRequired,
  blocks: PropTypes.arrayOf(
    PropTypes.shape({
      blockId: PropTypes.string.isRequired,
      sectionLabel: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
    })
  ).isRequired,
  onContinue: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

PreprocessPreviewCard.defaultProps = {
  fileName: "Uploaded document",
  qualityReason: "",
  disabled: false,
};
