/* global process */

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const maxDocChars = env.MAX_DOC_CHARS || "60000";
  const maxUploadMb = env.MAX_UPLOAD_MB || "5";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      "import.meta.env.VITE_MAX_DOC_CHARS": JSON.stringify(maxDocChars),
      "import.meta.env.VITE_MAX_UPLOAD_MB": JSON.stringify(maxUploadMb),
    },
  };
});
