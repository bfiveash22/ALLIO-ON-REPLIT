import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      "@shared/": path.resolve(__dirname, "lib/shared/src/"),
      "@shared": path.resolve(__dirname, "lib/shared/src"),
      "@server/": path.resolve(__dirname, "ffpma-app/server/"),
      "@db": path.resolve(__dirname, "ffpma-app/server/db.ts"),
    },
  },
});
