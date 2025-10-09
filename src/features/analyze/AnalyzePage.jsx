import { useState } from "react";
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

  const handleFileAccepted = (file) => {
    console.log("✅ File ready:", file.name);
    setStatus("loading");

    // ⏳ simulate API call with 20% random failure fo((testing purposes))
    setTimeout(() => {
      const failed = Math.random() < 0.2;
      if (failed) {
        setErrorMsg("Server timeout. Please retry.");
        setStatus("error");
        return;
      }

      setResult({
        filename: file.name,
        size: (file.size / 1024 / 1024).toFixed(2),
      });
      console.log("🎉 Analysis complete:", file.name);
      setStatus("success");
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
