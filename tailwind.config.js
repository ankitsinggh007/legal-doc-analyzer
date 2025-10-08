export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui"] },
      colors: {
        primary: { 500: "#6366f1", 600: "#4f46e5" },
        success: "#10b981",
        warning: "#f59e0b",
        error: "#f43f5e",
      },
      borderRadius: { sm: "4px", md: "8px", lg: "12px" },
      boxShadow: {
        sm: "0 1px 2px rgba(0,0,0,0.05)",
        md: "0 4px 6px rgba(0,0,0,0.1)",
        lg: "0 10px 15px rgba(0,0,0,0.15)",
      },
    },
  },
};
