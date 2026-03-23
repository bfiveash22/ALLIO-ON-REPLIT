# Completion Verification Rule (MANDATORY)

## Purpose
This rule ensures that NO task, feature, fix, or implementation is ever marked as
"complete" or "done" unless it has been fully verified end-to-end. Half-implemented
work wastes the Trustee's time and resources. This rule is non-negotiable.

## Mandatory Checklist — Every Task MUST Pass ALL Items

### 1. Visual Verification
- [ ] Every modified or new page loads without blank screens or rendering errors
- [ ] Navigate to each affected page in the browser and confirm it displays correctly
- [ ] No missing imports, broken components, or undefined data errors in the browser console

### 2. API Verification
- [ ] Every modified or new API endpoint returns the correct HTTP status code
- [ ] Protected endpoints return 401 (not 500) when called without authentication
- [ ] All error responses include meaningful error messages (not generic "Internal Server Error")
- [ ] No "fire and forget" patterns without error handling on critical operations

### 3. TypeScript Verification
- [ ] `pnpm run typecheck` passes with zero new errors
- [ ] No `any` type workarounds that hide real bugs
- [ ] All new functions have proper parameter and return types

### 4. Database Verification
- [ ] Schema changes sync without destructive prompts (no data loss)
- [ ] No duplicate table definitions for the same concept
- [ ] All foreign key references point to valid tables and columns
- [ ] New tables have proper indexes on frequently queried columns

### 5. Integration Verification
- [ ] External service calls (WordPress, Google Drive, SignNow, Stripe, OpenClaw) fail gracefully
- [ ] Missing API keys or credentials produce clear log messages, not unhandled exceptions
- [ ] Webhook endpoints validate payloads before processing

### 6. Error Handling Verification
- [ ] Every route handler has try/catch or async error middleware
- [ ] Database queries handle connection failures gracefully
- [ ] Frontend components wrapped in error boundaries where appropriate
- [ ] Loading states displayed while data is being fetched (no blank screens during loading)

### 7. Sidebar & Navigation Verification
- [ ] Every sidebar link points to a route that exists and renders a page
- [ ] Role-based menu items only appear for authorized roles
- [ ] No dead links in any navigation element

## Enforcement

1. **Before marking any task complete**, the developer/agent MUST run through this checklist
2. **The post-merge script** (`scripts/post-merge.sh`) will run automated checks
3. **Any task reported as "complete" that fails this checklist** must be immediately reopened and fixed
4. **No exceptions** — partial implementations are NOT acceptable

## Quick Verification Commands

```bash
# TypeScript check
pnpm run typecheck

# Health check
curl -s http://localhost:5000/api/health | jq .

# Check for 500 errors (should return 0)
curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health/details

# Frontend build check
pnpm --filter @workspace/ffpma run build
```
