export default function UploadHeader() {
  const maxUploadMb = Number.parseFloat(
    import.meta.env.VITE_MAX_UPLOAD_MB || "5"
  );

  return (
    <header>
      <h1 className="text-2xl sm:text-3xl font-semibold mb-2">
        Upload your contract
      </h1>
      <div className="space-y-1 text-sm sm:text-base text-slate-600 dark:text-slate-400">
        <p>Supports PDF, DOCX, and TXT up to {maxUploadMb} MB.</p>
        <p>
          Best with digitally generated, structured agreements such as NDAs,
          service agreements, consulting agreements, and rental agreements.
        </p>
      </div>
    </header>
  );
}
