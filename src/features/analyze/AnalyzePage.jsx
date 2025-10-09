import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalyze } from "../../context/AnalyzeContext";
import { Container } from "../../components/layout/Container";
import UploadHeader from "./components/UploadHeader";
import DropzoneCard from "./components/DropzoneCard";
import LoadingCard from "./components/LoadingCard";
import SuccessCard from "./components/SuccessCard";
import ErrorCard from "./components/ErrorCard"; //
import FooterHint from "./components/FooterHint";

export function AnalyzePage() {
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const { setUploadedFile } = useAnalyze();

  const handleFileAccepted = (file) => {
    console.log("✅ File ready:", file.name);
    setStatus("loading");

    setTimeout(() => {
      const failed = Math.random() < 0.2;
      if (failed) {
        setErrorMsg("Server timeout. Please retry.");
        setStatus("error");
        return;
      }

      setUploadedFile(file); // store in context
      setResult({
        // still keep local result
        filename: file.name,
        size: (file.size / 1024 / 1024).toFixed(2),
      });
      setStatus("success");

      // redirect after short delay
      setTimeout(() => navigate("/viewer"), 800);
    }, 2000);
  };

  const reset = () => {
    setStatus("idle");
    setResult(null);
    setErrorMsg("");
  };

  return (
    <main className="min-h-[80vh] flex flex-col justify-center">
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
