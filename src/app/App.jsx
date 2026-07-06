import { Routes, Route } from "react-router-dom";
import { AnalyzeProvider } from "@/context/AnalyzeContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Suspense, lazy } from "react";
import Disclaimer from "@/components/Disclaimer";

// 🔹 Lazy imports
const HomePage = lazy(() => import("@/features/home/HomePage"));
const AnalyzePage = lazy(() => import("@/features/analyze/AnalyzePage"));
const ViewerPage = lazy(() => import("@/features/viewer/ViewerPage"));
const NotFoundPage = lazy(() => import("@/features/misc/NotFoundPage"));

export default function App() {
  return (
    <ThemeProvider>
      <AnalyzeProvider>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
          <div className="flex-1">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-screen text-slate-500 dark:text-slate-400">
                  <p className="animate-pulse">Loading…</p>
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/analyze" element={<AnalyzePage />} />
                <Route path="/viewer" element={<ViewerPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </div>
          <footer className="w-full border-t border-slate-200 bg-white/70 px-4 py-3 text-center dark:border-slate-800 dark:bg-slate-950/40">
            <Disclaimer />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              © {new Date().getFullYear()} Legal Document Analyzer ·{" "}
              <a
                href="https://github.com/ankitsinggh007/legal-doc-analyzer"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline"
              >
                GitHub
              </a>
            </p>
          </footer>
        </div>
      </AnalyzeProvider>
    </ThemeProvider>
  );
}
