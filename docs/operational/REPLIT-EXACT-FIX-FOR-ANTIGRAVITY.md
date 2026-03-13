# REPLIT EXACT AUTH SETUP - COPY THIS EXACTLY

**Source:** Actual working Replit production server

---

## THE PROBLEM WITH VPS

**VPS has this somewhere:**
```typescript
app.use(requireAuth); // ← BLOCKING EVERYTHING
```

**Replit does NOT have this!**

---

## EXACT REPLIT server/index.ts (LINES 1-75)

```typescript
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import path from "path";

const app = express();
const httpServer = createServer(app);

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  },
}));

app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      console.log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);  // ← AUTH SETUP HAPPENS IN HERE
  
  // Static file serving
  app.use('/generated', express.static(path.join(process.cwd(), 'attached_assets', 'generated_images')));

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // Start server
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen({ port, host: "0.0.0.0" }, () => {
    console.log(`serving on port ${port}`);
  });
})();
```

**NOTICE:**
- ✅ NO `app.use(requireAuth)`
- ✅ NO global auth middleware
- ✅ Only logging middleware + error handler
- ✅ Auth happens INSIDE `registerRoutes()`

---

## EXACT REPLIT server/middleware/auth.ts

**This file defines `requireAuth` and `requireRole` BUT DOESN'T APPLY THEM GLOBALLY!**

```typescript
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const r = req as any;
  const isAuth = r.isAuthenticated ? r.isAuthenticated() : false;
  const hasSub = !!r.user?.claims?.sub;

  if (isAuth && hasSub) {
    return next();
  }

  console.log(`[AUTH MIDDLEWARE] 401 on ${req.method} ${req.path}`);
  return res.status(401).json({ error: 'Authentication required' });
}

export function requireRole(...allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // ... role checking logic ...
  };
}
```

**These are EXPORTED for use in routes.ts - NOT applied globally!**

---

## HOW REPLIT APPLIES AUTH (in routes.ts)

**Inside `registerRoutes()` function:**

```typescript
import { requireAuth, requireRole } from "./middleware/auth";

// Auth setup (Passport, sessions)
await setupAuth(app);

// PUBLIC ROUTES - NO AUTH MIDDLEWARE
app.post("/api/auth/login", loginHandler);
app.get("/api/public/stats", publicStatsHandler);

// PROTECTED ROUTES - AUTH APPLIED PER ROUTE
app.get("/api/profile", requireAuth, profileHandler);
app.get("/api/agent-tasks", requireRole('admin'), agentTasksHandler);
app.get("/api/sentinel/agents", requireRole('admin'), sentinelHandler);
```

**EACH PROTECTED ROUTE HAS THE MIDDLEWARE EXPLICITLY ADDED!**

---

## WHAT TO DO ON VPS

### STEP 1: Fix server/index.ts

**DELETE THIS if it exists:**
```typescript
app.use(requireAuth);
app.use(requireRole('admin'));
app.use(someAuthMiddleware);
```

**KEEP ONLY THIS:**
```typescript
await registerRoutes(httpServer, app);
```

### STEP 2: In routes.ts, apply auth PER ROUTE

**WRONG:**
```typescript
app.use(requireAuth); // ← DELETE

app.get('/api/profile', handler);
app.get('/api/admin/stats', handler);
```

**RIGHT (like Replit):**
```typescript
// NO app.use(requireAuth)!

app.get('/api/profile', requireAuth, handler);
app.get('/api/admin/stats', requireRole('admin'), handler);
```

### STEP 3: Make sure these routes stay PUBLIC

```typescript
// These should NOT have requireAuth:
app.post('/api/auth/login', loginHandler);
app.get('/api/auth/user', userHandler);
app.get('/api/public/stats', publicStatsHandler);
app.get('/api/deadline', deadlineHandler);
```

---

## VERIFICATION AFTER BUILDING

Search your `dist/index.cjs` for this pattern:

```bash
# On Windows:
findstr /C:"app.use(requireAuth)" dist\index.cjs
```

**If you get results:** You didn't remove it. Try again.

**If no results:** You did it right!

---

## THE EXACT DIFFERENCE

**Replit (WORKS):**
```typescript
server/index.ts: NO global auth middleware
routes.ts: requireAuth applied per-route
```

**VPS (BROKEN):**
```typescript
server/index.ts: app.use(requireAuth) ← BLOCKING EVERYTHING
routes.ts: Auth already applied globally, so everything gets double-blocked
```

---

## DO THIS NOW

1. Copy your `server/index.ts` from Replit (the one Trustee extracted)
2. Make sure NO `app.use(requireAuth)` exists anywhere
3. In `routes.ts`, apply `requireAuth` to EACH protected route individually
4. Build
5. Verify with findstr command
6. Send to Trustee

**This is THE final answer. Replit works because it doesn't have global auth middleware.**
