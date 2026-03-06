import { analyzeMock } from "@/api/analyzeMock";
import { analyzeDocument } from "@/api/analyzeDocument";
import { getCacheKey, getCachedResult, setCachedResult } from "@/utils/cache";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalyze } from "../../context/AnalyzeContext";
import { Container } from "../../components/layout/Container";
import UploadHeader from "./components/UploadHeader";
import DropzoneCard from "./components/DropzoneCard";
import LoadingCard from "./components/LoadingCard";
import SuccessCard from "./components/SuccessCard";
import ErrorCard from "./components/ErrorCard"; //
import parseDocument from "../../utils/parseDocument";
import Disclaimer from "@/components/Disclaimer";
import { segmentText } from "@/utils/segmentText";

export default function AnalyzePage() {
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileError, setTurnstileError] = useState("");
  const [lastFile, setLastFile] = useState(null);
  const turnstileRef = useRef(null);
  const turnstileWidgetId = useRef(null);
  const navigate = useNavigate();
  const {
    setUploadedFile,
    setParsedText,
    setSegments,
    setWarning,
    setClauses,
    setSummary,
    resetAnalysis,
    warning,
    parsedText,
    segments,
  } = useAnalyze();

  const useMock = import.meta.env.VITE_USE_MOCK_ANALYZER === "true";
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const requiresTurnstile = Boolean(turnstileSiteKey);
  const showTurnstile =
    !useMock && requiresTurnstile && (status === "idle" || status === "error");

  useEffect(() => {
    if (!requiresTurnstile) return;

    if (!showTurnstile) {
      if (turnstileWidgetId.current && window.turnstile?.remove) {
        window.turnstile.remove(turnstileWidgetId.current);
        turnstileWidgetId.current = null;
      }
      return;
    }

    if (!turnstileRef.current || !window.turnstile?.render) return;
    if (turnstileWidgetId.current) return;

    turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
      sitekey: turnstileSiteKey,
      callback: (token) => {
        setTurnstileToken(token);
        setTurnstileError("");
      },
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": () =>
        setTurnstileError("Turnstile verification failed. Try again."),
    });

    return () => {
      if (turnstileWidgetId.current && window.turnstile?.remove) {
        window.turnstile.remove(turnstileWidgetId.current);
        turnstileWidgetId.current = null;
      }
    };
  }, [requiresTurnstile, showTurnstile, turnstileSiteKey]);

  const runAnalysis = async ({ file, text, segments: nextSegments }) => {
    const cacheKey = getCacheKey(file);
    const cached = getCachedResult(cacheKey);

    if (cached && Array.isArray(cached.clauses)) {
      setClauses(cached.clauses);
      setSummary(cached.summary || "");
      setSegments(cached.segments || nextSegments || []);
      return;
    }

    if (!useMock && !turnstileToken) {
      throw new Error("Please complete the Turnstile verification.");
    }

    const analysis = useMock
      ? await analyzeMock(text, nextSegments)
      : await analyzeDocument({
          text,
          segments: nextSegments,
          turnstileToken,
        });

    setClauses(analysis.clauses || []);
    setSummary(analysis.summary || "");
    setCachedResult(cacheKey, {
      clauses: analysis.clauses || [],
      summary: analysis.summary || "",
      segments: nextSegments || [],
    });
  };

  const handleFileAccepted = async (file) => {
    setStatus("loading");
    setErrorMsg("");
    setTurnstileError("");
    setLastFile(file);

    try {
      const { text, warning } = await parseDocument(file);
      const nextSegments = segmentText(text);

      setUploadedFile(file);
      setParsedText(text);
      setSegments(nextSegments);
      setWarning(warning);

      await runAnalysis({ file, text, segments: nextSegments });

      setResult({
        filename: file.name,
        size: (file.size / 1024 / 1024).toFixed(2),
      });
      setStatus("success");
      if (turnstileWidgetId.current && window.turnstile?.reset) {
        window.turnstile.reset(turnstileWidgetId.current);
      }
      setTurnstileToken("");
    } catch (err) {
      if (turnstileWidgetId.current && window.turnstile?.reset) {
        window.turnstile.reset(turnstileWidgetId.current);
      }
      setTurnstileToken("");
      setErrorMsg(err.message || "Unexpected parsing error.");
      setStatus("error");
    }
  };

  const retry = async () => {
    if (!lastFile || !parsedText) {
      reset();
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      const nextSegments = segments?.length
        ? segments
        : segmentText(parsedText);
      await runAnalysis({
        file: lastFile,
        text: parsedText,
        segments: nextSegments,
      });
      setResult({
        filename: lastFile.name,
        size: (lastFile.size / 1024 / 1024).toFixed(2),
      });
      setStatus("success");
      if (turnstileWidgetId.current && window.turnstile?.reset) {
        window.turnstile.reset(turnstileWidgetId.current);
      }
      setTurnstileToken("");
    } catch (err) {
      if (turnstileWidgetId.current && window.turnstile?.reset) {
        window.turnstile.reset(turnstileWidgetId.current);
      }
      setTurnstileToken("");
      setErrorMsg(err.message || "Unexpected parsing error.");
      setStatus("error");
    }
  };

  const reset = () => {
    resetAnalysis();
    setStatus("idle");
    setResult(null);
    setErrorMsg("");
    setTurnstileError("");
    setTurnstileToken("");
  };

  return (
    <main className="min-h-[85vh] flex flex-col justify-center px-4 sm:px-6 md:px-8">
      <Container>
        <section className="flex flex-col items-center gap-8 text-center">
          <UploadHeader />
          <Disclaimer className="max-w-lg" />
          {showTurnstile && (
            <div className="w-full max-w-md">
              <div ref={turnstileRef} />
              {turnstileError && (
                <p className="text-rose-600 text-sm mt-2" role="alert">
                  {turnstileError}
                </p>
              )}
            </div>
          )}
          {status === "idle" && (
            <DropzoneCard onFileAccepted={handleFileAccepted} />
          )}
          {warning && status !== "error" && (
            <p className="text-amber-600 text-sm" role="status">
              {warning}
            </p>
          )}
          {status === "loading" && <LoadingCard />}
          {status === "success" && (
            <SuccessCard
              result={result}
              onReset={reset}
              onView={() => navigate("/viewer")}
            />
          )}
          {status === "error" && (
            <ErrorCard message={errorMsg} onRetry={retry} onReset={reset} />
          )}
        </section>
      </Container>
    </main>
  );
}
