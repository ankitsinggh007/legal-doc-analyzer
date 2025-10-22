import { Routes, Route } from "react-router-dom";
import { AnalyzePage } from "@/features/analyze/AnalyzePage";
import { ViewerPage } from "@/features/viewer/ViewerPage";
import { AnalyzeProvider } from "@/context/AnalyzeContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { HomePage } from "../features/home/HomePage";
import { NotFoundPage } from "../features/misc/NotFoundPage";

export default function App() {
  return (
    <ThemeProvider>
      <AnalyzeProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/analyze" element={<AnalyzePage />} />
          <Route path="/viewer" element={<ViewerPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AnalyzeProvider>
    </ThemeProvider>
  );
}
