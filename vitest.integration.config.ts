import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Integration tests run in Node against the real local Supabase backend.
 * The service-role key is read only from process.env / local .env.local
 * (§18 C15); it is never bundled into app code, logs or CI.
 */
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/integration/**/*.int.test.ts"],
    setupFiles: ["./tests/integration/setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
