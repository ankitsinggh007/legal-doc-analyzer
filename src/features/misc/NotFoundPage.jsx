// src/features/misc/NotFoundPage.jsx
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900
                 text-slate-800 dark:text-slate-100 text-center px-6 transition-colors"
      aria-label="404 Page"
    >
      {/* 🔹 Top Bar */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* 🔹 Content */}
      <h1 className="text-5xl font-bold mb-4">🚫 404 – Page Not Found</h1>
      <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md mb-8">
        Looks like this clause doesn’t exist. Please go back to safety.
      </p>
      <button
        onClick={() => navigate("/")}
        className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-md text-lg font-medium transition-all shadow-md hover:shadow-lg"
      >
        Go Back Home
      </button>
    </main>
  );
}
