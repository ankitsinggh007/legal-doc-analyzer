import { useState } from "react";
import { Container } from "../../components/layout/Container";
import UploadHeader from "./components/UploadHeader";
import DropzoneCard from "./components/DropzoneCard";
import LoadingCard from "./components/LoadingCard";
import SuccessCard from "./components/SuccessCard";
import FooterHint from "./components/FooterHint";

export function AnalyzePage() {
  const [status, setStatus] = useState("idle"); // idle | loading | success
  const [result, setResult] = useState(null);

  const handleFileAccepted = (file) => {
    console.log("✅ File ready:", file.name);
    setStatus("loading");

    // simulate AI analysis (replace with API later)
    setTimeout(() => {
      setResult({
        filename: file.name,
        size: (file.size / 1024 / 1024).toFixed(2),
      });
      setStatus("success");
    }, 2000);
  };

  const reset = () => {
    setStatus("idle");
    setResult(null);
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
          <FooterHint />
        </div>
      </Container>
    </main>
  );
}
