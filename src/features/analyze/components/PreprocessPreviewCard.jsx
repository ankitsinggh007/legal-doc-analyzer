import PropTypes from "prop-types";

function getQualityStyles(quality) {
  if (quality === "warning") {
    return {
      badge: "bg-amber-100 text-amber-800 border-amber-200",
      card: "border-amber-300 bg-amber-50/60",
    };
  }

  return {
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    card: "border-emerald-300 bg-emerald-50/60",
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
      className={`w-full max-w-4xl rounded-2xl border p-5 text-left shadow-sm ${styles.card}`}
      aria-label="Document preprocessing preview"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">Preprocessing complete</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">
            {fileName}
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Review the extracted clause-like blocks before running AI analysis.
          </p>
        </div>

        <div
          className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${styles.badge}`}
        >
          {quality}
        </div>
      </div>

      {qualityReason && (
        <p className="mt-4 rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700">
          {qualityReason}
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white/80 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Block count
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {blockCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white/80 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Quality
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 capitalize">
            {quality}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white/80 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Review
          </p>
          <p className="mt-1 text-sm text-slate-700">
            Confirm the extracted sections look clause-like before continuing.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-900">
            Extracted blocks
          </h4>
          {blockCount > visibleBlocks.length && (
            <span className="text-xs text-slate-500">
              Previewing first {visibleBlocks.length} of {blockCount}
            </span>
          )}
        </div>
        {blockCount > visibleBlocks.length && (
          <p className="text-xs text-slate-500">
            Only a preview is shown here. Review the visible blocks, then
            continue if they look clause-like.
          </p>
        )}

        <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
          {visibleBlocks.map((block) => (
            <article
              key={block.blockId}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">
                  {block.sectionLabel}
                </p>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                  {block.blockId}
                </span>
              </div>
              <p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-700">
                {block.text}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
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
