import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { pdfExportPlugin } from "./server/pdfExportPlugin";

export default defineConfig({
  plugins: [react(), pdfExportPlugin()],
});
