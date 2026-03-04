const CLAUSE_COLOR_MAP = {
  Termination: { bg: "#fee2e2", text: "#7f1d1d", border: "#fecaca" },
  Indemnity: { bg: "#fef3c7", text: "#92400e", border: "#fde68a" },
  Liability: { bg: "#dbeafe", text: "#1e3a8a", border: "#bfdbfe" },
  Confidentiality: { bg: "#e0e7ff", text: "#3730a3", border: "#c7d2fe" },
  Penalty: { bg: "#fef3c7", text: "#92400e", border: "#fde68a" },
  Payment: { bg: "#dcfce7", text: "#166534", border: "#bbf7d0" },
  "Governing Law": { bg: "#fce7f3", text: "#9d174d", border: "#fbcfe8" },
  Assignment: { bg: "#cffafe", text: "#155e75", border: "#a5f3fc" },
  Warranty: { bg: "#ede9fe", text: "#5b21b6", border: "#ddd6fe" },
  "Limitation of Liability": {
    bg: "#ffedd5",
    text: "#9a3412",
    border: "#fed7aa",
  },
};

const FALLBACK_PALETTE = [
  { bg: "#e2e8f0", text: "#1f2937", border: "#cbd5e1" },
  { bg: "#d1fae5", text: "#065f46", border: "#a7f3d0" },
  { bg: "#fae8ff", text: "#6b21a8", border: "#f5d0fe" },
  { bg: "#fef9c3", text: "#854d0e", border: "#fde68a" },
  { bg: "#ffe4e6", text: "#9f1239", border: "#fecdd3" },
  { bg: "#e0f2fe", text: "#075985", border: "#bae6fd" },
];

export function getClauseColor(type = "") {
  if (CLAUSE_COLOR_MAP[type]) return CLAUSE_COLOR_MAP[type];
  const sum = type.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return FALLBACK_PALETTE[sum % FALLBACK_PALETTE.length];
}

export function getRiskStyle(risk = "medium") {
  const key = typeof risk === "string" ? risk.toLowerCase() : "medium";
  if (key === "low") {
    return { bg: "#dcfce7", text: "#166534", border: "#bbf7d0" };
  }
  if (key === "high") {
    return { bg: "#fee2e2", text: "#991b1b", border: "#fecaca" };
  }
  return { bg: "#fef3c7", text: "#92400e", border: "#fde68a" };
}

export const DEFAULT_CLAUSE_TYPES = [
  "Termination",
  "Indemnity",
  "Liability",
  "Confidentiality",
  "Penalty",
  "Payment",
  "Governing Law",
  "Assignment",
  "Warranty",
  "Limitation of Liability",
];
