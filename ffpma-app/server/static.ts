import express, { type Express } from "express";
import fs from "fs";
import path from "path";

import { fileURLToPath } from 'url';

let currentDir = "";
try {
  // ESM environment 
  if (typeof import.meta !== 'undefined' && import.meta.url) {
    currentDir = path.dirname(fileURLToPath(import.meta.url));
  } else {
    // CommonJS environment
    currentDir = __dirname;
  }
} catch (e) {
  // Fallback if import.meta.url is undefined but transpiled
  currentDir = __dirname;
}

export function serveStatic(app: Express) {
  // If we are running the compiled dist/index.cjs, __dirname is 'dist'.
  // If we are running via tsx, __dirname is 'server'.
  let distPath;
  if (currentDir.endsWith('dist') || currentDir.endsWith(`dist${path.sep}`)) {
    distPath = path.resolve(currentDir, "public");
  } else {
    distPath = path.resolve(currentDir, "..", "dist", "public");
  }

  if (!fs.existsSync(distPath)) {
    console.warn(`Could not find the build directory: ${distPath}, make sure to build the client first`);
  }

  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  }));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
