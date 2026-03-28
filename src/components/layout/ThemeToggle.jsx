import { useTheme } from "@/context/ThemeContext";

export const ThemeToggle = () => {
  const { isDark, setIsDark } = useTheme();

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="p-2 rounded-md border border-slate-300 dark:border-slate-700
             hover:bg-slate-100 dark:hover:bg-slate-800
             focus-visible:ring-2 focus-visible:ring-primary-500 transition"
      aria-label="Toggle theme"
    >
      {isDark ? "🌙" : "☀️"}
    </button>
  );
};
