# Task #119: Full Ecosystem Audit Report
Date: 2026-03-23

## Phase 1: Audit Findings

### 1.1 API Endpoint Verification (21 endpoints tested)

| Endpoint | Expected | Actual | Status |
|----------|----------|--------|--------|
| `/api/health` | 200 | 200 | PASS |
| `/api/health/details` | 401 | 401 | PASS (was 500 — fixed) |
| `/api/catalog` | 200 | 200 | PASS |
| `/api/products` | 200 | 200 | PASS (was 404 — route added) |
| `/api/categories` | 200 | 200 | PASS (was 404 — route added) |
| `/api/orders` | 401 | 401 | PASS (was 404 — route added) |
| `/api/programs` | 200 | 200 | PASS |
| `/api/training/modules` | 200 | 200 | PASS |
| `/api/training/tracks` | 200 | 200 | PASS |
| `/api/sentinel/agents` | 200 | 200 | PASS |
| `/api/frequencies` | 200 | 200 | PASS |
| `/api/peptide-catalog` | 200 | 200 | PASS |
| `/api/canva/status` | 200 | 200 | PASS |
| `/api/library` | 401 | 401 | PASS |
| `/api/admin/members` | 401 | 401 | PASS (was 404 — route added) |
| `/api/admin/member-stats` | 401 | 401 | PASS (was 404 — route added) |
| `/api/admin/contracts` | 401 | 401 | PASS (was 404 — route added) |
| `/api/chat/rooms` | 401 | 401 | PASS (was 404 — route added) |
| `/api/clinic-nodes` | 401 | 401 | PASS |
| `/api/athena/inbox` | 401 | 401 | PASS |
| `/api/agent-network/stats` | 401 | 401 | PASS |

### 1.2 Sidebar Navigation Verification (35 links tested)

All 35 sidebar links verified against App.tsx routes: **35/35 PASS**

### 1.3 Schema Conflict Audit

#### Chat/Messaging Systems (5 systems identified)

| System | Tables | ID Type | Purpose | Status |
|--------|--------|---------|---------|--------|
| General Chat | `chat_rooms`, `chat_participants`, `chat_messages` | UUID | Member-to-member messaging | ACTIVE — primary system |
| Diane AI | `diane_conversations`, `diane_messages` | Serial | AI chat with Diane agent | ACTIVE — purpose-specific |
| Support Agents | `support_conversations`, `support_messages` | Serial | Multi-agent support (Pete, Sam, Pat) | ACTIVE — generalizes Diane |
| Legacy | `chat_threads`, `messages` (models/chat.ts) | Serial | Global Agent Chat (legacy) | DEPRECATED — marked in schema |
| Doctor-Patient | `doctor_patient_messages`, `conversations` | UUID | Clinical messaging | ACTIVE — clinical use |

**Resolution**: Systems serve distinct purposes (member chat, AI agents, clinical). Unification would be a major
refactor outside audit scope. Legacy `chat_threads`/`messages` marked as DEPRECATED in schema.ts with guidance
pointing to the correct system for each use case.

#### Drive Columns on library_items

| Column | Used In | Decision |
|--------|---------|----------|
| `driveFileId` | drive-routes, doctor-routes, member-routes, library-routes, media-routes, protocol-slide-generator | KEEP |
| `driveWebViewLink` | library-routes | KEEP |
| `driveFolderId` | (available for folder-level queries) | KEEP |
| `fileMimeType` | (file type tracking) | KEEP |
| `fileSize` | (file size tracking) | KEEP |

**Resolution**: Task #115 proposed deleting these columns, but they are actively referenced by 20+ code
locations across 6 route/service files. Deletion would break Drive sync, protocol generation, and library
serving. Columns RETAINED. Task #115's scope was incorrectly scoped.

### 1.4 Integration Audit

| Integration | Status | Issue | Resolution |
|-------------|--------|-------|------------|
| WordPress Sync | FIXED | 400 on page 2 of library content | Graceful error handling for pagination |
| MCP Fetch Server | DEGRADED | npm package unavailable | Enabled with graceful failure — client manager logs and continues |
| MCP GitHub | CONNECTED | Working | 26 tools discovered |
| MCP Filesystem | CONNECTED | Working | 14 tools discovered |
| Google Drive | WORKING | Active uploads confirmed | Documents uploading to Drive |
| OpenClaw | WORKING | Flush complete | No pending messages |

## Phase 2: Fixes Applied

1. **Auth ordering bug** — `registerHealthRoutes(app)` moved after `setupWorkingAuth(app)` in index.ts
2. **Auth safety guards** — `typeof req.isAuthenticated !== 'function'` check in requireAuth/requireRole
3. **7 missing API routes created** — `/api/products`, `/api/categories`, `/api/orders`, `/api/admin/members`,
   `/api/admin/member-stats`, `/api/admin/contracts`, `/api/chat/rooms` + messages endpoints
4. **Global ErrorBoundary** — Wraps entire App and Router in App.tsx with recovery UI
5. **WordPress sync** — Proper error typing for pagination 400s
6. **MCP fetch server** — Re-enabled with graceful degradation
7. **Schema documentation** — Legacy chat models marked DEPRECATED with guidance

## Phase 3: Completion Verification Rule

1. `.agents/rules/completion-verification.md` — 7-point mandatory checklist
2. `.alliorules.md` — Section 5 added (Completion Verification Rule)
3. `scripts/post-merge.sh` — Dependencies + schema sync + TypeScript check + live API endpoint matrix
