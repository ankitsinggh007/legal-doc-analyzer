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
import ErrorCard from "./components/ErrorCard";
import PreprocessPreviewCard from "./components/PreprocessPreviewCard";
import parseDocument from "../../utils/parseDocument";
import {
  createDocumentId,
  PREPROCESS_QUALITY,
} from "@/lib/document-processing/preprocessResult";
import { evaluateDocumentQuality } from "@/lib/document-processing/qualityGate";
import { extractBlocks } from "@/lib/document-processing/extractBlocks";
import {
  buildSampleAnalysis,
  SAMPLE_CONTRACT_FILE,
  SAMPLE_CONTRACT_TEXT,
} from "./sampleContractDemo";

function mergeWarnings(...messages) {
  return Array.from(
    new Set(messages.map((message) => message?.trim()).filter(Boolean))
  ).join(" ");
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
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
  const activeFile = lastFile || uploadedFile;

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
    if (file?.isDemo) {
      await wait(1100);
      return;
    }

    const cacheKey = file ? getCacheKey(file) : null;
    const cached = cacheKey ? getCachedResult(cacheKey) : null;

    if (cached && Array.isArray(cached.clauses)) {
      setClauses(cached.clauses);
      setSummary(cached.summary || "");
      return;
    }

    if (!documentId || !Array.isArray(blocks) || !blocks.length) {
      throw new Error(
        "Missing preprocessed document state. Please upload the document again."
      );
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
    if (cacheKey) {
      setCachedResult(cacheKey, {
        clauses: analysis.clauses || [],
        summary: analysis.summary || "",
      });
    }
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

  const handleSampleSelected = async () => {
    resetAnalysis();
    setStatus("preprocessing");
    setErrorMsg("");
    setErrorPhase(null);
    setTurnstileError("");
    setTurnstileToken("");

    try {
      await wait(900);
      const documentId = createDocumentId();
      const blocks = extractBlocks(SAMPLE_CONTRACT_TEXT);
      const nextPreprocessResult = evaluateDocumentQuality({
        text: SAMPLE_CONTRACT_TEXT,
        pages: [SAMPLE_CONTRACT_TEXT],
        documentId,
        blocks,
      });
      const sampleAnalysis = buildSampleAnalysis(nextPreprocessResult);

      setLastFile(SAMPLE_CONTRACT_FILE);
      setUploadedFile(SAMPLE_CONTRACT_FILE);
      setParsedText(SAMPLE_CONTRACT_TEXT);
      setWarning(null);
      setPreprocessResult(nextPreprocessResult);
      setClauses(sampleAnalysis.clauses);
      setSummary(sampleAnalysis.summary);
      setStatus("ready");
    } catch (err) {
      setErrorPhase("preprocess");
      setErrorMsg(err.message || "Unexpected sample document error.");
      setStatus("error");
    }
  };

  const handleContinue = async () => {
    if (!parsedText || !preprocessResult?.documentId) {
      reset();
      return;
    }
    setStatus("analyzing");
    setErrorMsg("");
    setErrorPhase(null);
    try {
      await runAnalysis({
        file: lastFile || uploadedFile,
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
          {status === "idle" && <UploadHeader />}
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
            <DropzoneCard
              onFileAccepted={handleFileAccepted}
              onSampleSelected={handleSampleSelected}
            />
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
              disabled={
                !activeFile?.isDemo &&
                !useMock &&
                requiresTurnstile &&
                !turnstileToken
              }
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
            !activeFile?.isDemo &&
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
