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
import ErrorCard from "./components/ErrorCard"; //
import PreprocessPreviewCard from "./components/PreprocessPreviewCard";
import parseDocument from "../../utils/parseDocument";
import Disclaimer from "@/components/Disclaimer";
import {
  createDocumentId,
  PREPROCESS_QUALITY,
} from "@/lib/document-processing/preprocessResult";
import { evaluateDocumentQuality } from "@/lib/document-processing/qualityGate";
import { extractBlocks } from "@/lib/document-processing/extractBlocks";

function mergeWarnings(...messages) {
  return Array.from(
    new Set(messages.map((message) => message?.trim()).filter(Boolean))
  ).join(" ");
}

export default function AnalyzePage() {
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [errorPhase, setErrorPhase] = useState(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileError, setTurnstileError] = useState("");
  const [lastFile, setLastFile] = useState(null);
  const turnstileRef = useRef(null);
  const turnstileWidgetId = useRef(null);
  const navigate = useNavigate();
  const {
    uploadedFile,
    setUploadedFile,
    setParsedText,
    setWarning,
    setPreprocessResult,
    setClauses,
    setSummary,
    resetAnalysis,
    warning,
    parsedText,
    preprocessResult,
  } = useAnalyze();

  const useMock = import.meta.env.VITE_USE_MOCK_ANALYZER === "true";
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const requiresTurnstile = Boolean(turnstileSiteKey);
  const showTurnstile =
    !useMock &&
    requiresTurnstile &&
    (status === "ready" || (status === "error" && errorPhase === "analysis"));

  useEffect(() => {
    if (status === "idle" && preprocessResult && parsedText) {
      setStatus("ready");
    }
  }, [parsedText, preprocessResult, status]);

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

  const runAnalysis = async ({ file, documentId, blocks }) => {
    const cacheKey = getCacheKey(file);
    const cached = getCachedResult(cacheKey);

    if (cached && Array.isArray(cached.clauses)) {
      setClauses(cached.clauses);
      setSummary(cached.summary || "");
      return;
    }

    if (!useMock && !turnstileToken) {
      throw new Error("Please complete the Turnstile verification.");
    }

    const analysis = useMock
      ? await analyzeMock({
          documentId,
          blocks,
        })
      : await analyzeDocument({
          documentId,
          blocks,
          turnstileToken,
        });

    setClauses(analysis.clauses || []);
    setSummary(analysis.summary || "");
    setCachedResult(cacheKey, {
      clauses: analysis.clauses || [],
      summary: analysis.summary || "",
    });
  };

  const handleFileAccepted = async (file) => {
    resetAnalysis();
    setStatus("preprocessing");
    setErrorMsg("");
    setErrorPhase(null);
    setTurnstileError("");
    setTurnstileToken("");
    setLastFile(file);

    try {
      const { text, warning: parseWarning, pages } = await parseDocument(file);
      const documentId = createDocumentId();
      const blocks = extractBlocks(text);
      const nextPreprocessResult = evaluateDocumentQuality({
        text,
        pages,
        documentId,
        blocks,
      });

      if (nextPreprocessResult.quality === PREPROCESS_QUALITY.BAD) {
        setPreprocessResult(nextPreprocessResult);
        setErrorPhase("preprocess");
        throw new Error(nextPreprocessResult.qualityReason);
      }

      const nextWarning = mergeWarnings(
        parseWarning,
        nextPreprocessResult.quality === PREPROCESS_QUALITY.WARNING
          ? nextPreprocessResult.qualityReason
          : ""
      );

      setUploadedFile(file);
      setParsedText(text);
      setWarning(nextWarning || null);
      setPreprocessResult(nextPreprocessResult);
      setStatus("ready");
    } catch (err) {
      if (turnstileWidgetId.current && window.turnstile?.reset) {
        window.turnstile.reset(turnstileWidgetId.current);
      }
      setTurnstileToken("");
      setErrorMsg(err.message || "Unexpected parsing error.");
      setStatus("error");
    }
  };

  const handleContinue = async () => {
    if (!lastFile || !parsedText) {
      reset();
      return;
    }
    setStatus("analyzing");
    setErrorMsg("");
    setErrorPhase(null);
    try {
      await runAnalysis({
        file: lastFile,
        documentId: preprocessResult?.documentId,
        blocks: preprocessResult?.blocks || [],
      });
      if (turnstileWidgetId.current && window.turnstile?.reset) {
        window.turnstile.reset(turnstileWidgetId.current);
      }
      setTurnstileToken("");
      navigate("/viewer");
    } catch (err) {
      if (turnstileWidgetId.current && window.turnstile?.reset) {
        window.turnstile.reset(turnstileWidgetId.current);
      }
      setTurnstileToken("");
      setErrorPhase("analysis");
      setErrorMsg(err.message || "Unexpected parsing error.");
      setStatus("error");
    }
  };

  const reset = () => {
    resetAnalysis();
    setStatus("idle");
    setErrorMsg("");
    setErrorPhase(null);
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
          {warning &&
            preprocessResult &&
            status !== "idle" &&
            status !== "error" && (
              <p className="text-amber-600 text-sm" role="status">
                {warning}
              </p>
            )}
          {status === "preprocessing" && (
            <LoadingCard
              title="Preprocessing document…"
              message="Checking structure and extracting clause-like blocks."
            />
          )}
          {status === "ready" && preprocessResult && (
            <PreprocessPreviewCard
              fileName={uploadedFile?.name}
              quality={preprocessResult.quality}
              qualityReason={preprocessResult.qualityReason}
              blockCount={preprocessResult.blocks.length}
              blocks={preprocessResult.blocks}
              onContinue={handleContinue}
              onReset={reset}
              disabled={!useMock && requiresTurnstile && !turnstileToken}
            />
          )}
          {status === "analyzing" && (
            <LoadingCard
              title="Analyzing extracted blocks…"
              message="Sending preprocessed content for AI classification."
            />
          )}
          {status === "error" && (
            <ErrorCard
              message={errorMsg}
              onRetry={errorPhase === "analysis" ? handleContinue : undefined}
              onReset={reset}
            />
          )}
          {status === "ready" &&
            !useMock &&
            requiresTurnstile &&
            !turnstileToken && (
              <p className="text-sm text-slate-500" role="status">
                Complete Turnstile verification to continue to AI analysis.
              </p>
            )}
        </section>
      </Container>
    </main>
  );
}
