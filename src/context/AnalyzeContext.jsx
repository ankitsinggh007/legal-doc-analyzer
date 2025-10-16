import { createContext, useContext, useState } from "react";
import PropTypes from "prop-types";
const AnalyzeContext = createContext();

export const AnalyzeProvider = ({ children }) => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [parsedText, setParsedText] = useState(null);
  const [warning, setWarning] = useState(null);
  const [clauses, setClauses] = useState([]);
  const [summary, setSummary] = useState("");
  const resetAnalysis = () => {
    setUploadedFile(null);
    setParsedText(null);
    setWarning(null);
    setClauses([]);
    setSummary("");
  };
  return (
    <AnalyzeContext.Provider
      value={{
        uploadedFile,
        parsedText,
        warning,
        clauses,
        summary,
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
