import { useAnalyze } from "@/context/AnalyzeContext";
import { useNavigate } from "react-router-dom";
import { Container } from "@/components/layout/Container";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useEffect } from "react";

export function ViewerPage() {
  const { uploadedFile, parsedText, resetAnalysis } = useAnalyze();
  const navigate = useNavigate();

  useEffect(() => {
    if (!parsedText) navigate("/analyze");
  }, [parsedText, navigate]);

  if (!parsedText) return null;

  return (
    <main
      className="min-h-screen bg-white border-blue-500  dark:bg-slate-900 text-slate-800 dark:text-slate-100"
      aria-label="Document Viewer Page"
    >
      {/* <Container className=""> */}
      <Container className="max-w-[90%] lg:max-w-[85%] xl:max-w-[80%] py-6 space-y-6">
        {/* 🔹 Top Bar */}
        <header className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-4">
          <div className="flex items-center gap-3">
            <h1
              className="font-semibold text-sm sm:text-lg max-w-[150px] sm:max-w-[300px] truncate"
              title={uploadedFile?.name || "Untitled Document"}
            >
              {uploadedFile?.name || "Untitled Document"}
            </h1>

            <button
              onClick={() => {
                resetAnalysis();
                navigate("/analyze");
              }}
              className="text-primary-600 hover:underline text-sm"
            >
              Re-upload
            </button>
          </div>
          <ThemeToggle />
        </header>

        {/* 🔹 Dual Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel: Contract Viewer */}
          <section
            className="lg:col-span-2 p-4 rounded-md   dark:border-slate-700 border border-slate-200
                        dark:bg-slate-800 overflow-y-auto max-h-[85vh]"
            aria-label="Contract Text Viewer"
          >
            <p className="whitespace-pre-wrap text-left leading-relaxed">
              {/* Dummy text for now */}
              {parsedText?.slice(0, 2000) ||
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ac orci quis tortor ultrices condimentum..."}
            </p>
          </section>

          {/* Right Panel: Insights Sidebar */}
          <aside
            className="p-4 rounded-md border border-slate-200 dark:border-slate-700
                       bg-slate-50 dark:bg-slate-800 sticky top-4 h-fit"
            aria-label="Insights Sidebar"
          >
            <h2 className="font-semibold text-lg mb-3">Insights</h2>
            <nav className="flex flex-wrap gap-2 mb-4" role="tablist">
              {["Termination", "Penalties", "Others"].map((tab) => (
                <button
                  key={tab}
                  className="px-3 py-1 text-sm rounded-md border border-slate-300 dark:border-slate-600
                             hover:bg-primary-50 dark:hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-primary-500"
                  role="tab"
                >
                  {tab}
                </button>
              ))}
            </nav>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Click a clause in the document to view details here.
            </p>
          </aside>
        </div>
      </Container>
    </main>
  );
}
