import { useAnalyze } from "@/context/AnalyzeContext";
import { useNavigate } from "react-router-dom";
import { Container } from "@/components/layout/Container";
import { useEffect } from "react";

export function ViewerPage() {
  const { parsedText, warning, resetAnalysis } = useAnalyze();
  const navigate = useNavigate();

  useEffect(() => {
    if (!parsedText) navigate("/analyze");
  }, [parsedText, navigate]);

  if (!parsedText) return null;

  return (
    <main className="py-12 sm:py-16 text-center" aria-label="Contract Viewer">
      <Container className="">
        <h1 className="text-2xl sm:text-3xl font-semibold mb-4 text-center">
          Document Viewer
        </h1>
        {warning && <p className="text-amber-600 mb-4">⚠ {warning}</p>}
        <div
          tabIndex={0}
          className="bg-slate-50 dark:bg-slate-800 p-4 rounded-md border
                   border-slate-200 dark:border-slate-700 text-left
                   whitespace-pre-wrap overflow-y-auto max-h-[70vh]"
        >
          {parsedText}
        </div>
        <button
          onClick={() => {
            resetAnalysis();
            navigate("/analyze");
          }}
          className="mt-6 text-primary-600 hover:underline"
        >
          Upload Another
        </button>
      </Container>
    </main>
  );
}
