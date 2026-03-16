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
│   │   │   ├── services/         # 54 service modules (AI, payments, sync, automation, etc.)
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
