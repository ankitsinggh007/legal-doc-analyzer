// src/features/home/HomePage.jsx
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-between bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors"
      aria-label="Landing Page"
    >
      {/* 🔹 Top Bar */}
      <header className="w-full flex justify-end p-4">
        <ThemeToggle />
      </header>

      {/* 🔹 Hero Section */}
      <section className="flex flex-col items-center text-center px-6">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
          AI-powered{" "}
          <span className="text-primary-600">Legal Document Analyzer</span>
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mb-8">
          Upload any contract, highlight key clauses, and get instant risk
          summaries — all powered by AI.
        </p>
        <button
          onClick={() => navigate("/analyze")}
          className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-md text-lg font-medium transition-all shadow-md hover:shadow-lg"
        >
          Get Started
        </button>
      </section>

      {/* 🔹 Feature Row */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center px-8 py-16 max-w-4xl">
        <div className="p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="text-3xl mb-2">🧠</div>
          <h3 className="font-semibold text-lg mb-1">AI Clause Detection</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Automatically identify and highlight key clauses.
          </p>
        </div>
        <div className="p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="text-3xl mb-2">⚖️</div>
          <h3 className="font-semibold text-lg mb-1">Risk Summary</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Instantly assess potential risks and obligations.
          </p>
        </div>
        <div className="p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="text-3xl mb-2">📄</div>
          <h3 className="font-semibold text-lg mb-1">Export PDF</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Save professional, color-coded reports instantly.
          </p>
        </div>
      </section>

      {/* 🔹 Footer */}
      <footer className="w-full text-center py-4 text-sm border-t border-slate-200 dark:border-slate-700">
        <p>
          © {new Date().getFullYear()} Legal Document Analyzer —{" "}
          <a
            href="https://github.com/ankitsinggh007/legal-doc-analyzer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:underline"
          >
            GitHub
          </a>
        </p>
      </footer>
    </main>
  );
}
