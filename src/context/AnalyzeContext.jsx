import { createContext, useContext, useState, useEffect } from "react";
import { saveState, loadState, clearState } from "@/utils/storage";
import PropTypes from "prop-types";

const STORAGE_KEY = "legalDocAnalyzerState";
const AnalyzeContext = createContext();

export const AnalyzeProvider = ({ children }) => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [parsedText, setParsedText] = useState(null);
  const [warning, setWarning] = useState(null);
  const [clauses, setClauses] = useState([]);
  const [summary, setSummary] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);

  // ✅ Rehydrate from localStorage (on mount)
  useEffect(() => {
    const saved = loadState(STORAGE_KEY);
    if (saved && saved.parsedText) {
      if (saved.uploadedFile) setUploadedFile(saved.uploadedFile);
      setParsedText(saved.parsedText);
      setWarning(saved.warning);
      setClauses(saved.clauses || []);
      setSummary(saved.summary || "");
    }
    setIsHydrated(true);
  }, []);

  // ✅ Auto-save whenever state changes
  useEffect(() => {
    if (parsedText || clauses.length > 0) {
      // ✅ store file info safely (not the full File object)
      const safeFileInfo = uploadedFile
        ? {
            name: uploadedFile.name,
            size: uploadedFile.size,
            type: uploadedFile.type,
          }
        : null;

      saveState(STORAGE_KEY, {
        uploadedFile: safeFileInfo,
        parsedText,
        warning,
        clauses,
        summary,
      });
    }
  }, [uploadedFile, parsedText, warning, clauses, summary]);

  // ✅ Reset + clear
  const resetAnalysis = () => {
    setUploadedFile(null);
    setParsedText(null);
    setWarning(null);
    setClauses([]);
    setSummary("");
    clearState(STORAGE_KEY);
  };

  return (
    <AnalyzeContext.Provider
      value={{
        uploadedFile,
        parsedText,
        warning,
        clauses,
        summary,
        isHydrated,
        setClauses,
        setSummary,
        setUploadedFile,
        setParsedText,
        resetAnalysis,
        setWarning,
      }}
    >
      {children}
    </AnalyzeContext.Provider>
  );
};

export const useAnalyze = () => useContext(AnalyzeContext);

AnalyzeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
