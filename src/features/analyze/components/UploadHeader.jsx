export default function UploadHeader() {
  return (
    <header>
      <h1 className="text-2xl sm:text-3xl font-semibold mb-2">
        Upload your contract
      </h1>
      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
        Supports PDF, DOCX, and TXT up to 10 MB
      </p>
    </header>
  );
}
