# Workspace

## Overview
Allio v1 (Forgotten Formula PMA) is a full-stack health and wellness platform designed to empower individuals on their healing journeys. It leverages AI-powered tools to create personalized healing protocols, manage patient data, and streamline administrative tasks for practitioners. The platform's core purpose is to provide a comprehensive, integrated solution for holistic health management, from patient intake and AI-driven analysis to protocol generation, educational content, and ongoing support. The business vision is to become a leading platform in personalized wellness, offering advanced AI capabilities and a seamless user experience for both patients and practitioners.

## User Preferences
I want iterative development, with a focus on delivering small, functional increments. Please ask clarifying questions and propose alternative solutions when appropriate, especially before making significant architectural changes or implementing complex features. I prefer clear, concise explanations and well-structured code. Do not make changes to files outside the `artifacts/ffpma/` and `artifacts/api-server/` directories unless explicitly instructed.

## System Architecture

### Monorepo Structure
The project is organized as a pnpm monorepo using workspaces, enabling efficient management of shared code and distinct applications.

### Technology Stack
- **Node.js**: v24
- **TypeScript**: v5.6
- **Package Manager**: pnpm
- **Frontend**: React 19, Vite 7, Tailwind CSS v4, shadcn/ui (New York style)
- **Backend**: Express 4, Drizzle ORM 0.39
- **Database**: PostgreSQL
- **Validation**: Zod v3, `drizzle-zod` v0.7
- **Authentication**: WordPress OAuth, session-based auth
- **Build**: Vite (frontend), esbuild/tsx (backend)

### Core Applications
- **`ffpma` (Frontend)**: A React/Vite application comprising 62 pages and over 83 components, including shadcn/ui elements, intake forms, and dashboard widgets.
- **`api-server` (Backend)**: An Express API server with 51 services, handling routing, database interactions (Drizzle ORM), storage, and business logic. It includes rate limiting, helmet security, and graceful shutdown.
- **`mockup-sandbox`**: A development-only component preview server for design and UI development.

### Shared Libraries (`lib/`)
- **`shared`**: Contains common code such as Drizzle schemas, AI agent definitions, TypeScript types, brand identity constants, and security utilities.
- **`api-spec`**: OpenAPI specification and Orval codegen configuration.
- **`api-client-react`**: Generated React Query hooks for API interaction.
- **`api-zod`**: Generated Zod schemas from the OpenAPI spec.

### Deployment & Environment
- **Target**: Autoscale Replit deployment.
- **Build Process**: `pnpm run build` (typecheck, build frontend, build backend).
- **Runtime**: Backend runs as `node artifacts/api-server/dist/index.cjs`.
- **Frontend Serving**: In production, the API server serves static SPA files from `artifacts/ffpma/dist/public`, with a catch-all for client-side routing.
- **Health Check**: `/api/healthz` returns `{"status":"ok"}`.
- **Sensitive Data**: Managed via Replit Secrets.
- **Custom Domain**: Configured for `ffpma.com`.

### Protocol Assembly System
An AI-powered pipeline (`artifacts/api-server/src/services/protocol-assembly.ts`) for generating personalized 90-day healing protocols.
- **Process**: Analyzes call transcripts, extracts structured patient profiles, generates protocols with 5R framework (Remove, Restore, Replenish, Regenerate, Rebalance).
- **4-Deliverable Pipeline**: On protocol approval, auto-generates: (1) Full Protocol PDF, (2) Daily Schedule PDF, (3) Peptide Schedule PDF, (4) PPTX Presentation (30+ slides). All files upload to Google Drive with links stored in DB.
- **Full Modality Coverage**: All deliverables render 12+ modality types: injectable peptides, oral peptides, bioregulators, IV/IM therapies, supplements, detox protocols, parasite/antiviral, ECS protocol (suppositories + tincture + targeted ratios), sirtuin/MitoSTAC stack, liposomals, nebulization, topicals, exosomes, and dietary protocol with phases.
- **Resource Engine** (`protocol-resources.ts`): Condition-based mapping engine that auto-selects books, research links, Drive library resources, and YouTube channels based on patient conditions (cancer, amalgam, parasite, gut, hormone, metabolic, heart, autoimmune, mold).
- **PPTX Generator** (`protocol-pptx.ts`): Uses `pptxgenjs` to create 30+ slide presentations matching Trustee's format — includes ECS section dividers, suppository slides, sirtuin/mitochondrial slides, liposomal, nebulization, topical, exosome, and dietary protocol slides alongside original sections.
- **PDF Branding**: Deep blue/cyan/gold color scheme with FF PMA branding. Generated via PDFKit in `protocol-pdf.ts`. Includes dynamic resource sections (books, research, Drive links, YouTube) and Trustee commitment page.
- **Presentation**: 30-slide interactive slideshow at `/protocol-presentation/` with narration, slide navigation, and share functionality. Built as separate Vite artifact.
- **Kathryn Smith Rebuild**: `kathryn-smith-protocol.ts` rebuilds the reference protocol from timeline data in `docs/operational/KATHRYN-SMITH-TIMELINE.md`. Enforces all modalities (ECS, suppositories, sirtuin, liposomals, nebulization, topicals, exosomes, dietary) with gold-standard data. Generates all 4 deliverables and uploads to Drive.
- **Agent QA**: `validateProtocolWithAgents()` runs HIPPOCRATES/PARACELSUS/ORACLE persona validation post-generation.
- **DB Columns**: `pdf_drive_file_id`, `daily_schedule_pdf_file_id`, `peptide_schedule_pdf_file_id`, `slides_presentation_id` (for PPTX), `slides_web_view_link`.
- **AI Engines**: Abacus AI (gpt-4.1-mini) primary, OpenAI (gpt-4o) fallback. 12000-token JSON schema with all modalities.
- **Lipo-B**: IM ONLY formulation (216mg/mL total). Never in IV sections.

### SignNow Unified Contract Migration
Integrates with SignNow for electronic document signing, utilizing a unified contract template and supporting doctor onboarding and member agreements. Webhook notifications are configured for signing completion.

### Video Production System (PRISM)
A marketing studio feature enabling video generation:
- **Frontend**: Template selection, title input, voice style picker, and production progress.
- **Backend**: Services for automated video production, ffmpeg operations, template management (6 templates), and orchestration.
- **Pipeline**: Converts templates/scenes to TTS narration, matches images, adds background music, assembles videos with ffmpeg, and uploads to Google Drive.

### LBA Blood Analysis & Certification System
- **AI Blood Analysis**: Utilizes HuggingFace for blood analysis, integrating concepts like pleomorphism, cyclogeny, and biological terrain.
- **Certification Course**: A 17-module LBA Practitioner Certification course with quizzes and a 100-question final exam.
- **Achievement Badges**: Awards badges upon completion, leading to "LBA Practitioner Certified" status.

### Agent Network
Includes an AI agent network with:
- 51 backend services.
- An agent scheduler for automated tasks.
- A Sentinel monitoring system.
- Diane AI assistant for member support.

## External Dependencies

- **AI Services**: OpenAI, Anthropic, Google Gemini, HuggingFace
- **Payments**: Stripe (Checkout Sessions, webhooks)
- **E-commerce**: WooCommerce (product sync)
- **Database**: PostgreSQL
- **Authentication**: WordPress OAuth
- **Document Signing**: SignNow
- **Cloud Storage/Productivity**: Google Drive, Google Slides API
- **Communication**: Telegram (via OpenClaw integration)
- **External Data**: PubMed (for research links), TheCandidaDiet.com