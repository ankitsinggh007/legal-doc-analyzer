import { Routes, Route } from "react-router-dom";
import { AnalyzePage } from "@/features/analyze/AnalyzePage";
import { ViewerPage } from "@/features/viewer/ViewerPage";
import { AnalyzeProvider } from "@/context/AnalyzeContext";

export default function App() {
  return (
    <AnalyzeProvider>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route path="/analyze" element={<AnalyzePage />} />
        <Route path="/viewer" element={<ViewerPage />} />
        <Route path="*" element={<div>404 – Not Found</div>} />
      </Routes>
    </AnalyzeProvider>
  );
}
