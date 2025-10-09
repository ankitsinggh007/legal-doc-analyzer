import { createContext, useContext, useState } from "react";
import PropTypes from "prop-types";
const AnalyzeContext = createContext();

export const AnalyzeProvider = ({ children }) => {
  const [uploadedFile, setUploadedFile] = useState(null);

  return (
    <AnalyzeContext.Provider value={{ uploadedFile, setUploadedFile }}>
      {children}
    </AnalyzeContext.Provider>
  );
};

export const useAnalyze = () => useContext(AnalyzeContext);

AnalyzeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
