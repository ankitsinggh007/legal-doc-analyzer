import { createContext, useContext, useState } from "react";
import PropTypes from "prop-types";
const AnalyzeContext = createContext();

export const AnalyzeProvider = ({ children }) => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [parsedText, setParsedText] = useState(null);
  const [warning, setWarning] = useState(null);
  const resetAnalysis = () => {
    setUploadedFile(null);
    setParsedText(null);
    setWarning(null);
  };
  return (
    <AnalyzeContext.Provider
      value={{
        uploadedFile,
        parsedText,
        warning,
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
