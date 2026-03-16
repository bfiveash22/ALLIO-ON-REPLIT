# Workspace

## Overview

Allio v1 (Forgotten Formula PMA) — a full-stack health/wellness platform migrated into a pnpm workspace monorepo. React+Vite frontend with 62 pages and 83+ components, Express+Drizzle backend with 51 services.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.6
- **Frontend**: React 19 + Vite 7 + Tailwind CSS v4 + shadcn/ui (New York style)
- **Backend**: Express 4 + Drizzle ORM 0.39
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod v3, `drizzle-zod` v0.7
- **Auth**: WordPress OAuth + session-based auth
- **AI**: OpenAI, Anthropic, Google Gemini, HuggingFace
- **Payments**: Stripe (Checkout Sessions + webhooks), WooCommerce (product sync)
- **Build**: Vite (frontend), esbuild/tsx (backend)

## Structure

```text
workspace/
├── artifacts/                    # Deployable applications
│   ├── ffpma/                    # React+Vite frontend (62 pages, 83+ components)
│   │   ├── src/
│   │   │   ├── pages/            # 62 route pages
│   │   │   ├── components/       # 83+ UI and feature components
│   │   │   │   ├── ui/           # shadcn/ui components
│   │   │   │   ├── intake/       # Intake form step components
│   │   │   │   └── dashboard/    # Dashboard widget components
│   │   │   ├── hooks/            # use-auth, use-toast, use-mobile
│   │   │   ├── lib/              # queryClient, i18n, utils, auth-utils
│   │   │   ├── locales/          # en/es translations
│   │   │   └── assets/           # Brand images + 9 Allio 1080p videos
│   │   ├── public/               # Static assets (favicon, opengraph, videos)
│   │   ├── vite.config.ts        # Vite config with @shared alias
│   │   └── index.html
│   ├── api-server/               # Express API server (51 services)
│   │   ├── src/
│   │   │   ├── index.ts          # Server entry point with rate limiting, helmet, graceful shutdown
│   │   │   ├── routes.ts         # 7,300+ line route definitions
│   │   │   ├── db.ts             # Drizzle database connection
│   │   │   ├── storage.ts        # Storage abstraction layer
│   │   │   ├── services/         # 55 service modules (AI, payments, sync, automation, library-ingestion, etc.)
│   │   │   ├── middleware/       # Auth middleware
│   │   │   ├── seeds/            # 19 database seed files (incl. LBA certification course)
│   │   │   ├── scripts/          # Utility scripts
│   │   │   └── reports/          # Generated reports
│   │   ├── drizzle.config.ts     # Drizzle Kit configuration
│   │   └── build.ts              # esbuild production bundle config
│   └── mockup-sandbox/           # Component preview server (design tool)
├── lib/                          # Shared libraries
│   ├── shared/                   # Shared code (schema, agents, types)
│   │   └── src/
│   │       ├── schema.ts         # Main Drizzle schema (tables, relations, insert schemas)
│   │       ├── schema/           # Additional schema modules (intake)
│   │       ├── models/           # Auth and chat models
│   │       ├── types/            # TypeScript types (protocol-assembly)
│   │       ├── agents.ts         # Agent definitions and FFPMA creed
│   │       ├── allio-identity.ts # Brand identity constants
│   │       ├── ecs-data.ts       # Endocannabinoid system data
│   │       ├── ligand-pathway-data.ts # Ligand pathway reference data
│   │       ├── security.ts       # Security utilities
│   │       └── training-knowledge-checks.ts # Training content
│   ├── api-spec/                 # OpenAPI spec + Orval codegen config
│   ├── api-client-react/         # Generated React Query hooks
│   ├── api-zod/                  # Generated Zod schemas from OpenAPI
│   └── db/                       # Drizzle ORM schema + DB connection (template)
├── tests/                        # Test suite (Vitest, 89 tests)
│   ├── helpers.ts                # Typed mock factories (Request, Response, Pool, Storage)
│   ├── auth-middleware.test.ts   # Auth & RBAC middleware tests (22 tests)
│   ├── schema-validation.test.ts # Zod insert schema validation tests (28 tests)
│   ├── protocol-generation.test.ts # Protocol type contracts & schema tests (12 tests)
│   └── doctor-member-routes.test.ts # Doctor/member route auth & data validation (27 tests)
├── vitest.config.ts              # Vitest configuration
├── .alliorules.md                # Project rules and conventions
├── CLAUDE-HANDOFF.md             # Handoff documentation
├── ANNETTE-GOMER-PROTOCOL-FF-PMA-MODEL.md  # Protocol model documentation
├── pnpm-workspace.yaml           # Workspace config with catalog versions
├── tsconfig.base.json            # Shared TS options
└── package.json                  # Root package
```

## Import Aliases

- `@/*` → `./src/*` (within each artifact)
- `@shared/*` → `lib/shared/src/*` (shared code package)
- `@assets/*` → `./src/assets/*` (frontend assets)

## Deployment

- **Target**: Autoscale (Replit deployment)
- **Build**: `pnpm run build` (typecheck + build ffpma + build api-server)
- **Run**: `node artifacts/api-server/dist/index.cjs`
- **Frontend**: In production, API server serves the SPA static files from `artifacts/ffpma/dist/public` with a catch-all for client-side routing
- **API Server**: Express with esbuild-bundled production server at `artifacts/api-server/dist/index.cjs`
- **Health Check**: `/api/healthz` returns `{"status":"ok"}`
- **SPA Fallback**: All non-`/api/` GET requests fall through to `index.html` for client-side routing (production only)
- **Excluded from production**: mockup-sandbox, doctor-pitch-deck, protocol-presentation (dev-only artifacts)
- **Sensitive values**: Stored in Replit Secrets (WP_APPLICATION_PASSWORD, PUBMED_API_KEY, CORE_API_KEY, SIGNNOW_APP_ID, PREVIEW_TOKEN_SECRET, DATABASE_URL, SESSION_SECRET, etc.)
- **Custom domain**: Ready for ffpma.com — user connects via Replit deployment settings

## Key Commands

- `pnpm --filter @workspace/ffpma run dev` — Start frontend dev server
- `pnpm --filter @workspace/api-server run dev` — Start API server
- `pnpm --filter @workspace/ffpma run build` — Build frontend for production
- `pnpm --filter @workspace/api-server run db:push` — Push schema to database
- `pnpm install` — Install all dependencies

## Environment Variables

The API server requires:
- `DATABASE_URL` — PostgreSQL connection string
- `PORT` — Server port
- Various API keys for AI services (OpenAI, Anthropic, Google, HuggingFace)
- WordPress/WooCommerce credentials for auth sync
- `STRIPE_SECRET_KEY` — Stripe API secret key (sk_test_ or sk_live_)
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook endpoint secret for signature verification
- Google OAuth credentials
- `ENABLE_SCHEDULERS` — Enable background agent schedulers

## Protocol Assembly System

AI-powered pipeline in `artifacts/api-server/src/services/protocol-assembly.ts` that:
- Analyzes call transcripts via OpenAI to extract structured patient profiles
- Generates comprehensive 90-day healing protocols
- Creates Google Slides presentations via the Slides API
- Stores generated protocols in the `generated_protocols` database table

Key files:
- `artifacts/api-server/src/services/protocol-assembly.ts` — Core service
- `lib/shared/src/types/protocol-assembly.ts` — PatientProfile and HealingProtocol types
- `artifacts/ffpma/src/pages/protocol-assembly.tsx` — UI page

API Routes (all require auth + admin/trustee/doctor role):
- `POST /api/protocol-assembly/generate` — Generate from transcript
- `POST /api/protocol-assembly/generate-from-intake/:id` — Generate from intake form
- `GET /api/protocol-assembly/protocols` — List protocols
- `GET /api/protocol-assembly/protocols/:id` — Get protocol detail
- `POST /api/protocol-assembly/protocols/:id/slides` — Generate slides for existing protocol
- `POST /api/protocol-assembly/annette-gomer-slides` — Generate branded Annette Gomer protocol slides (20 slides with FF PMA branding, research links, product references)
- `POST /api/protocol-assembly/automation-test` — Run full AI engine comparison test (Abacus AI vs Gemini vs OpenAI)
- `POST /api/protocol-assembly/automation-test/abacus` — Test Abacus AI only
- `POST /api/protocol-assembly/automation-test/gemini` — Test Gemini 1.5 Pro + RAG only
- `POST /api/protocol-assembly/automation-test/openai` — Test OpenAI GPT-4o only

### Protocol Transcript Source

Protocol transcripts are stored in a canonical Google Drive folder (ID: `10BqHP7hXwBGskvoNePMuvFuTNspKy0ur`). The constant `PROTOCOL_TRANSCRIPTS_FOLDER_ID` is exported from `artifacts/api-server/src/services/drive.ts`.

### Trustee & Admin Patient Access

Trustees and Admins have superset access to all patient management features. The `trustee` role is accepted on all doctor/clinical API endpoints in `doctor-routes.ts`. Both the trustee dashboard (`trustee-dashboard.tsx`) and admin backoffice (`admin-backoffice.tsx`) include inline patient management panels with patient roster, enrollment, protocol overview, clinical tools, and messaging. The admin dashboard (`admin-dashboard.tsx`) also includes a patient management tab linking to these tools.

### Protocol Slide Generator

`artifacts/api-server/src/services/protocol-slide-generator.ts` generates a branded 20-slide Google Slides presentation from the Annette Gomer protocol. Slides include FF PMA / Allio branding (deep blue, teal, cyan, gold), accent bars, section dividers for each of the 5 Rs, and embedded research links (PubMed, TheCandidaDiet.com). Presentation is moved to the ALLIO/Protocols folder in Google Drive.

### Protocol Automation Test Harness

`artifacts/api-server/src/services/protocol-automation-test.ts` tests AI engines for protocol generation quality. Sends a simulated Annette Gomer transcript through Abacus AI (gpt-4.1-mini), Gemini 1.5 Pro + RAG, and OpenAI Direct (gpt-4o). Scores output on 7 criteria (therapy selection, dosing detail, research citations, daily schedule, 5 Rs adherence, personalization, completeness). Generates a comparison report saved to the knowledge base.

### SignNow Unified Contract Migration

All signing workflows now use the Unified Contract template from SignNow. Key env vars:
- `SIGNNOW_UNIFIED_CONTRACT_TEMPLATE_ID` — The unified template ID (takes precedence)
- `SIGNNOW_DOCTOR_ONBOARDING_TEMPLATE_ID` — Falls back from unified, then hardcoded default
- `SIGNNOW_MEMBER_TEMPLATE_ID` — Falls back from unified
- `FFPMA_ADMIN_EMAIL` — Admin email for CC notifications on signing completion

Document naming: `Unified Contract - [Name] - [DoctorCode] - [Date]`

Admin endpoints:
- `POST /api/admin/migrate-clinic-links` — Bulk update all clinic SignNow links
- `POST /api/admin/import-clinic-signnow-links` — Import per-clinic links from spreadsheet data
- `GET /api/admin/signnow/templates` — List available SignNow templates and current config

Webhook CC notifications: On `document_complete`, emails are sent to the signer with CC to admin, referring doctor, and clinic email.

WordPress sync: `syncClinics()` reads `signnow_link`, `signnow_member_link`, `signnow_doctor_link` ACF fields and preserves local values when WP fields are empty.

Reference data: The clinic-to-SignNow link mappings from the master spreadsheet are preserved in git history (formerly `ffpma-app/data/clinic-signnow-links.csv`).

### `scripts` (`@workspace/scripts`)

Operational utility scripts for managing the agent ecosystem and database. Located in `scripts/operational/`.

Run from workspace root: `pnpm tsx scripts/operational/<name>.ts`

49 operational scripts. Key categories:

Agent management: `register-all-agents`, `reseed-agents`, `cleanup-agents`, `cleanup-fake-agents`, `cleanup-ghosts`, `wipe-agent-registry`, `check-db-agents`, `fix-db-agents`

Task operations: `audit-tasks`, `cancel-tasks`, `check-and-create-tasks`, `create-uncompleted-tasks`, `force-execute`, `force-drformula`, `insert_marketing_task`, `reassign-fake-tasks`

DB/Schema: `check_enums`, `compare_enums`, `check-roles`, `check-sessions`, `clear-db`, `fix-schema`

Google Drive/Auth: `audit-drive`, `audit-drive-assets`, `check-drive-structure`, `auth`, `auth-gmail`, `exchange-token`, `get-auth-url`, `generate-refresh-token`

Media: `assemble-launch-video`, `upload-launch-video`, `generate-allio-voiceover`, `generate-pptx`, `manual-slides`

## Video Production System (PRISM)

The Marketing Studio includes a functional video generation pipeline:
- **Frontend**: `artifacts/ffpma/src/pages/marketing-studio.tsx` — Template selector, title input, voice style picker, production progress display with Drive link output
- **Backend Services**: `auto-video-producer.ts` (automated pipeline), `video-production.ts` (ffmpeg operations), `video-templates.ts` (6 templates), `marketing-orchestrator.ts` (orchestration)
- **Templates**: ALLIO Launch, Training Module Intro, ECS Foundations Promo, Peptide Therapy Overview, Ozonated Glycerin Educational, New Member Welcome
- **Pipeline**: Template/custom scenes → TTS narration per scene → image matching from Drive → background music from FORGE folder → ffmpeg slideshow assembly → Google Drive upload
- **API Endpoints**: `GET /api/video/templates`, `POST /api/video/auto-produce`, `POST /api/video/produce-premium`, `POST /api/video/render`, `POST /api/video/assemble`, `GET /api/video/status`
- **Dashboard**: Inline video player with `<video>` element for assets with `videoUrl`, Drive link button for assets with `driveLink`
- **Video generation flag**: `checkMediaStatus()` now detects ffmpeg availability and sets `videoGeneration: true` dynamically

Infrastructure: `deploy-vps`, `build`, `fetch-openclaw`, `ls-openclaw`, `test-openclaw`, `test-locks`, `test-auto-implementer`, `test-ui-proposal`, `run-auto`, `trigger-daily-enhancement`, `cleanup`

Convenience scripts in `scripts/package.json`: `pnpm --filter @workspace/scripts run <name>`

## LBA Blood Analysis & Certification System

The FFPMA Live Blood Analysis (LBA) system includes:
- **AI Blood Analysis**: Enhanced system prompt in `huggingface-blood-analysis.ts` integrating pleomorphism, cyclogeny, biological terrain (pH/rH2/resistivity), zeta potential, dry layer oxidative stress testing, and Dumrese/Haefeli dark field methods
- **Blood Sample Library**: 14 pleomorphic/terrain entries (protits, spermatids, chondrites, dioecotecitas, tecitas, cistaces, rod/spindle forms, crystals, Mucor/Aspergillus endobionts, dry layer patterns, zeta potential markers, fibrin polymerization) in `seeds/lba-blood-samples-seed.ts`
- **17-Module Certification Course**: Complete LBA Practitioner Certification in `seeds/lba-certification-seed.ts` with sections, key points, and quizzes for each module
- **100-Question Certification Exam**: Comprehensive final exam in `seeds/lba-certification-exam-seed.ts` (80% passing, 3 attempts max, 2-hour limit)
- **9 Achievement Badges**: From "Microscopy Initiate" to "LBA Practitioner Certified"
- **Certification Flow**: `POST /api/certifications/lba/complete` issues numbered FFPMA-LBA certificates with verification codes
- **Admin Seed Route**: `POST /api/admin/seed/lba-certification` seeds the entire course
- **Knowledge Base**: Dumrese/Haefeli manual and Biomedx training program in `knowledge-base/`

## Agent Network

The platform includes an AI agent network with:
- 51 backend services covering AI, payments, content, marketing, and more
- Agent scheduler for automated tasks
- Sentinel monitoring system
- Diane AI assistant for member support

## OpenClaw Telegram Integration

The OpenClaw system bridges AI agent communication to the Trustee via Telegram (migrated from WhatsApp).

- **VPS Gateway**: OpenClaw gateway on VPS (130.49.160.73) handles Telegram bot `@AllioFFPMA_bot` via `channels.telegram.botToken`
- **Bot Token**: Stored in `TELEGRAM_BOT_TOKEN` secret and in VPS OpenClaw config (`channels.telegram.botToken`)
- **Chat ID**: Stored in `TELEGRAM_CHAT_ID` secret
- **Outbound flow**: Agents queue messages to `openclaw_messages` table -> OpenClaw gateway polls DB and sends via Telegram
- **Inbound flow**: Trustee messages bot on Telegram -> OpenClaw POSTs to `localhost:5000/api/webhooks/openclaw` -> creates high-priority task for target agent
- **Standalone bot**: `artifacts/api-server/src/openclaw-telegram-bot.ts` - alternative relay service that polls `/api/openclaw/outbox` and sends via Telegram API directly. Set `TELEGRAM_ENABLE_INCOMING=false` when running alongside OpenClaw gateway.
- **Test script**: `pnpm --filter @workspace/scripts run test-telegram` validates bot connectivity and sends a test message
- **VPS config**: `/root/.openclaw/openclaw.json` - WhatsApp disabled, Telegram enabled with `botToken`
