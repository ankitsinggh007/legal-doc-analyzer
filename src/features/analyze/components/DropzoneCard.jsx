import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
export default function DropzoneCard({ onFileAccepted }) {
  const inputRef = useRef();
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const dropzoneRef = useRef();

  useEffect(() => {
    dropzoneRef?.current?.focus();
  }, []);
  const handleFiles = (files) => {
    const selected = files[0];
    if (!selected) return;

    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    const maxSize = 2 * 1024 * 1024;

    if (!validTypes.includes(selected.type))
      return setError("Only PDF, DOCX, or TXT files are allowed.");

    if (selected.size > maxSize)
      return setError(
        "This document is too large to process. Please upload a shorter contract."
      );

    setError("");
    setFile(selected);
    onFileAccepted?.(selected);
  };

  return (
    <div
      ref={dropzoneRef}
      role="button"
      tabIndex={0}
      aria-label="Upload file"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click(); // open file dialog
        }
      }}
      className={`w-full max-w-content rounded-md border-2 border-dashed
              py-12 sm:py-16 px-4 sm:px-8 text-center cursor-pointer
              transition-transform hover:scale-[1.01]
              ${
                dragActive
                  ? "border-primary-500 bg-slate-50 dark:bg-slate-800"
                  : "border-slate-300 dark:border-slate-600"
              }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current.click()}
    >
      {!file && (
        <p className="text-slate-500">📄 Drag & drop or click to upload</p>
      )}
      {file && (
        <div className="text-slate-700 dark:text-slate-300">
          <p>{file.name}</p>
          <p className="text-sm text-slate-500">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFile(null);
              setError("");
            }}
            className="text-primary-600 hover:underline text-sm mt-1"
          >
            Remove
          </button>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && (
        <p className="text-error text-sm mt-2" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
DropzoneCard.propTypes = {
  onFileAccepted: PropTypes.func, // ✅ add this
};
