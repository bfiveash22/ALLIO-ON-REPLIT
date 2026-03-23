import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

const ffpmaReact = path.resolve(__dirname, "artifacts/ffpma/node_modules/react");
const ffpmaReactDom = path.resolve(__dirname, "artifacts/ffpma/node_modules/react-dom");
const ffpmaReactQuery = path.resolve(__dirname, "artifacts/ffpma/node_modules/@tanstack/react-query");

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    testTimeout: 10000,
    environmentMatchGlobs: [
      ["tests/components/**/*.test.tsx", "jsdom"],
    ],
    setupFiles: ["tests/setup.ts"],
    coverage: {
      provider: "v8",
      include: [
        "artifacts/api-server/src/**/*.ts",
        "lib/shared/src/**/*.ts",
        "artifacts/ffpma/src/**/*.tsx",
        "artifacts/ffpma/src/**/*.ts",
      ],
      exclude: [
        "**/*.d.ts",
        "**/node_modules/**",
        "**/seeds/**",
        "**/migrations/**",
        "**/db.ts",
        "**/*.config.*",
        "**/dist/**",
      ],
      reporter: ["text", "json", "html"],
      thresholds: {
        lines: 4,
        functions: 10,
        branches: 10,
        statements: 4,
      },
    },
  },
  resolve: {
    alias: [
      { find: "@tanstack/react-query", replacement: ffpmaReactQuery },
      { find: "react-dom", replacement: ffpmaReactDom },
      { find: "react", replacement: ffpmaReact },
      { find: "@shared/", replacement: path.resolve(__dirname, "lib/shared/src/") },
      { find: "@shared", replacement: path.resolve(__dirname, "lib/shared/src") },
      { find: "@server/", replacement: path.resolve(__dirname, "ffpma-app/server/") },
      { find: "@db", replacement: path.resolve(__dirname, "ffpma-app/server/db.ts") },
      { find: "@", replacement: path.resolve(__dirname, "artifacts/ffpma/src") },
      { find: "@assets", replacement: path.resolve(__dirname, "artifacts/ffpma/src/assets") },
    ],
    dedupe: ["react", "react-dom", "@tanstack/react-query"],
  },
});
