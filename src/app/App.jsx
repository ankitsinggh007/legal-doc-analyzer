import { Routes, Route } from "react-router-dom";
import { AnalyzeProvider } from "@/context/AnalyzeContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Suspense, lazy } from "react";

// 🔹 Lazy imports
const HomePage = lazy(() => import("@/features/home/HomePage"));
const AnalyzePage = lazy(() => import("@/features/analyze/AnalyzePage"));
const ViewerPage = lazy(() => import("@/features/viewer/ViewerPage"));
const NotFoundPage = lazy(() => import("@/features/misc/NotFoundPage"));

export default function App() {
  return (
    <ThemeProvider>
      <AnalyzeProvider>
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
      </AnalyzeProvider>
    </ThemeProvider>
  );
}
