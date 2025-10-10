import { useAnalyze } from "@/context/AnalyzeContext";
import { useNavigate } from "react-router-dom";
import { Container } from "@/components/layout/Container";
import { useEffect } from "react";

export function ViewerPage() {
  const { uploadedFile } = useAnalyze();
  const navigate = useNavigate();

  useEffect(() => {
    if (!uploadedFile) navigate("/analyze");
  }, [uploadedFile, navigate]);

  if (!uploadedFile) return null;

  return (
    <Container className="py-12 sm:py-16 text-center">
      <h1 className="text-2xl sm:text-3xl font-semibold mb-4">
        Document Viewer
      </h1>
      <p className="text-slate-700 dark:text-slate-300">{uploadedFile.name}</p>
      <p className="text-sm text-slate-500">
        Size: {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
      </p>
      <button
        className="mt-6 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        onClick={() => navigate("/analyze")}
      >
        Upload Another
      </button>
    </Container>
  );
}
