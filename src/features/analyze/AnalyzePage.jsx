import { analyzeMock } from "@/api/analyzeMock";
import { getCacheKey, getCachedResult, setCachedResult } from "@/utils/cache";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalyze } from "../../context/AnalyzeContext";
import { Container } from "../../components/layout/Container";
import UploadHeader from "./components/UploadHeader";
import DropzoneCard from "./components/DropzoneCard";
import LoadingCard from "./components/LoadingCard";
import SuccessCard from "./components/SuccessCard";
import ErrorCard from "./components/ErrorCard"; //
import FooterHint from "./components/FooterHint";
import parseDocument from "../../utils/parseDocument";

export function AnalyzePage() {
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const {
    setUploadedFile,
    setParsedText,
    setWarning,
    setClauses,
    setSummary,
    resetAnalysis,
  } = useAnalyze();

  useEffect(() => {
    if (status === "success") {
      const id = setTimeout(() => navigate("/viewer"), 600);
      return () => clearTimeout(id);
    }
  }, [status, navigate]);

  const handleFileAccepted = async (file) => {
    console.log("✅ File ready:", file.name, file.type);
    setStatus("loading");

    try {
      // 🔹 Step 1: Parse document
      const { text, warning } = await parseDocument(file);
      console.log("📄 Parsed text length:", text.length);

      if (warning) console.warn(warning);

      setUploadedFile(file);
      setParsedText(text);
      setWarning(warning);

      // 🔹 Step 2: Check cache
      const cacheKey = getCacheKey(file);
      const cached = getCachedResult(cacheKey);

      if (cached) {
        console.log(`⚡ Using cached analysis for ${file.name}`);
        setClauses(cached.clauses);
        setSummary(cached.summary);
      } else {
        // 🔹 Step 3: Run mock AI analysis
        const result = await analyzeMock(text);
        console.log("🧠 AI result:", result);

        setClauses(result.clauses);
        setSummary(result.summary);
        setCachedResult(cacheKey, result);
      }

      // 🔹 Step 4: Update UI
      setResult({
        filename: file.name,
        size: (file.size / 1024 / 1024).toFixed(2),
      });
      setStatus("success");
    } catch (err) {
      console.error("❌ Parser error:", err.message);
      setErrorMsg(err.message || "Unexpected parsing error.");
      setStatus("error");
    }
  };

  const reset = () => {
    resetAnalysis();
    setStatus("idle");
    setResult(null);
    setErrorMsg("");
  };

  return (
    <main className="min-h-[80vh] flex flex-col justify-center px-4 sm:px-6 md:px-8">
      <Container>
        <div className="flex flex-col items-center gap-8 text-center">
          <UploadHeader />
          {status === "idle" && (
            <DropzoneCard onFileAccepted={handleFileAccepted} />
          )}
          {status === "loading" && <LoadingCard />}
          {status === "success" && (
            <SuccessCard result={result} onReset={reset} />
          )}
          {status === "error" && (
            <ErrorCard message={errorMsg} onRetry={reset} />
          )}
          <FooterHint />
        </div>
      </Container>
    </main>
  );
}
