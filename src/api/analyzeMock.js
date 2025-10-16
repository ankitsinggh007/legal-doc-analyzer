export async function analyzeMock(text) {
  console.log("🧠 Mock AI analyzing text...", text);
  // Simulate processing delay
  await new Promise((res) => setTimeout(res, 1200));
  // Return mock analysis results
  return {
    clauses: [
      { type: "Termination", start: 40, end: 110 },
      { type: "Penalty", start: 230, end: 300 },
      { type: "Confidentiality", start: 400, end: 480 },
    ],
    summary: "Detected 3 clauses: Termination, Penalty, Confidentiality.",
  };
}
