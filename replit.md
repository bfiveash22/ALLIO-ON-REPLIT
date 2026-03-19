# Workspace

## Overview
Allio v1 (Forgotten Formula PMA) is a full-stack health and wellness platform designed to empower individuals on their healing journeys. It leverages AI-powered tools to create personalized healing protocols, manage member data, and streamline administrative tasks for practitioners. The platform's core purpose is to provide a comprehensive, integrated solution for holistic health management, from member intake and AI-driven analysis to protocol generation, educational content, and ongoing support. The business vision is to become a leading platform in personalized wellness, offering advanced AI capabilities and a seamless user experience for both members and practitioners.

### PMA Language Compliance
All user-facing content uses PMA-compliant terminology. DB columns (patient_name etc.) are kept for backward compatibility but are aliased in API responses. The shared module `lib/shared/src/pma-language.ts` provides term constants and sanitization utilities. API routes use `/api/doctor/members` (primary) with `/api/doctor/patients` as backward-compatible aliases. Key mappings: patient→member, treatment→protocol, diagnosis→assessment, prescribe→suggest, cure→restore, medical advice→wellness guidance, doctor-patient→trustee-member.

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
- **Process**: Analyzes call transcripts, extracts structured member profiles, generates protocols with 5R framework (Remove, Restore, Replenish, Regenerate, Rebalance).
- **4-Deliverable Pipeline**: On protocol approval, auto-generates: (1) Full Protocol PDF, (2) Daily Schedule PDF, (3) Peptide Schedule PDF, (4) PPTX Presentation (30+ slides). All files upload to Google Drive with links stored in DB.
- **Full Modality Coverage**: All deliverables render 12+ modality types: injectable peptides, oral peptides, bioregulators, IV/IM therapies, supplements, detox protocols, parasite/antiviral, ECS protocol (suppositories + tincture + targeted ratios), sirtuin/MitoSTAC stack, liposomals, nebulization, topicals, exosomes, and dietary protocol with phases.
- **Resource Engine** (`protocol-resources.ts`): Condition-based mapping engine that auto-selects books, research links, Drive library resources, and YouTube channels based on member conditions (cancer, amalgam, parasite, gut, hormone, metabolic, heart, autoimmune, mold).
- **PPTX Generator** (`protocol-pptx-template.ts`): Template-based approach using `TrusteeTemplate_1773918667874.pptx` as base (stored at `artifacts/api-server/assets/protocol-template.pptx`). Uses JSZip to load the 37-slide template with all 244 embedded images and replaces placeholders with patient data. Color theme: Navy (#1A2440/#0A0E1A) + Gold (#C9A54E) + Lavender (#E8EDF5/#C8CFE0). Fonts: Playfair Display (headers) + Source Sans 3 (body). 37-slide structure with placeholders on slides 1 and 36 (patient name, selected peptides, modalities, HBOT chamber, trustee, notes). Legacy `protocol-pptx.ts` (3100+ lines pptxgenjs generation) preserved as fallback.
- **PDF Branding**: Deep blue/cyan/gold color scheme with FF PMA branding. Generated via PDFKit in `protocol-pdf.ts`. Includes dynamic resource sections (books, research, Drive links, YouTube) and Trustee commitment page.
- **Presentation**: 30-slide interactive slideshow at `/protocol-presentation/` with narration, slide navigation, and share functionality. Built as separate Vite artifact.
- **Kathryn Smith Rebuild**: `kathryn-smith-protocol.ts` rebuilds the reference protocol from timeline data in `docs/operational/KATHRYN-SMITH-TIMELINE.md`. Enforces all modalities (ECS, suppositories, sirtuin, liposomals, nebulization, topicals, exosomes, dietary) with gold-standard data. Generates all 4 deliverables and uploads to Drive.
- **Agent QA**: `validateProtocolWithAgents()` runs HIPPOCRATES/PARACELSUS/ORACLE persona validation post-generation.
- **DB Columns**: `pdf_drive_file_id`, `daily_schedule_pdf_file_id`, `peptide_schedule_pdf_file_id`, `slides_presentation_id` (for PPTX), `slides_web_view_link`.
- **AI Engines**: Abacus AI (gpt-4.1-mini) primary, OpenAI (gpt-4o) fallback. 12000-token JSON schema with all modalities.
- **Lipo-B**: IM ONLY formulation (216mg/mL total). Never in IV sections.

### Google Drive Library Sync
- **Source**: Google Drive "Library" folder (ID: `1s6EdFtZ7dZY7utr8J843CFxyAjuuwHPX`) with 50 category folders containing 361+ PDFs/documents.
- **Sync Service**: `drive-library-sync.ts` — crawls all subfolders, inserts/updates `library_items` table with Drive metadata (file ID, webViewLink, mime type, file size).
- **Sync Endpoint**: `POST /api/library/sync-drive` (admin only). Frontend "Sync Drive" button on Library page.
- **Schema**: `library_items` table has `drive_file_id`, `drive_web_view_link`, `drive_folder_id`, `file_mime_type`, `file_size` columns.
- **Frontend**: Library page shows Drive documents with "Open" button linking to Google Drive viewer. Category filters use formatted folder names. File sizes displayed.
- **Categories**: 50 folders including Alternative Medicine, Cancer, Cannabinoid, Chinese Herbal Medicine, Constitutional Health Freedom, DMSO, Epigenetics, Frequency/Chakra Healing, Herbal Medicine, IV Therapy, Nutrition, Parasite, Stem Cell, etc.

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
- **Gemini CLI (v0.34.0)**: Installed globally (`npm install -g @google/gemini-cli@latest`). All agents have Gemini-powered tools: `gemini_deep_analysis`, `gemini_summarize`, `gemini_research`, `gemini_code_review`, `gemini_transform`. Service: `gemini-provider.ts`.
- **NotebookLM Integration**: Source-grounded analysis tools powered by Gemini, replicating Google NotebookLM capabilities. Tools: `notebook_source_query` (source-cited Q&A), `notebook_study_guide` (study guides), `notebook_briefing_doc` (briefing documents), `notebook_multi_doc_synthesis` (multi-document synthesis), `notebook_audio_script` (podcast-style audio scripts). Automatically gathers sources from knowledge base, Google Drive, and research APIs. Service: `notebooklm-provider.ts`.
- **OpenRouter Integration**: Universal AI fallback provider with 200+ models. Economy tier: DeepSeek V3, Llama 4 Maverick. Standard tier: Qwen 3.5 122B, Mistral Large. Premium tier: Grok 4 Fast. Provider chain: Abacus → OpenAI → Claude → Gemini → OpenRouter → Self-hosted. 13 agents routed through OpenRouter for cost optimization (HERMES, MUSE, NEXUS, ARACHNE, ARCHITECT, SERPENS, DIANE, PETE, SAM, PAT, MAX-MINERAL, ALLIO-SUPPORT). Streaming support included. Secret: `OPENROUTER_API_KEY`.

### Legal Division & Constitutional Law Framework
- **Agents**: JURIS (Chief Legal AI), LEXICON (Contract Specialist), AEGIS (PMA Sovereignty Guardian), SCRIBE (Document Automation). All trained on 1st/14th Amendment constitutional law foundations.
- **Constitutional Framework**: Comprehensive legal document (`getConstitutionalLawFramework()`) covering First/Fourteenth/Ninth/Tenth Amendment protections, regulatory jurisdiction analysis, case law library (NAACP v. Alabama, Roberts v. Jaycees, Boy Scouts v. Dale, Griswold v. Connecticut, etc.), PMA structural requirements, and operational guidelines.
- **Drive Structure**: `ALLIO/Legal Compliance/{Constitutional Law, Case Law, Reference Materials, PMA Formation Documents}` and `ALLIO/Member Contracts/{MemberName}/`.
- **API Endpoint**: `/api/legal/documents/constitutional-law-framework` (auth required).
- **Scripts**: `legal-drive-audit.ts` (folder audit + reorganization), `upload-constitutional-framework.ts` (uploads framework + PMA formation checklist to Drive).

### PMA Filing Manager (In-House)
- **Replaced**: External app at `ffpmaclinicpmacreation.replit.app` — now fully integrated into the ALLIO platform.
- **Backend**: `pma-filing-routes.ts` with 12 endpoints under `/api/pma-filing/*`. AI document generation via `pma-document-generator.ts`.
- **Frontend**: `pma-filing-manager.tsx` — 8-step filing wizard embedded in the PMA Network page's "PMA Filing Manager" tab.
- **DB Tables**: `pma_officers` (clinic officers), `pma_filing_documents` (generated legal documents). Filing status tracked on existing `clinics` table fields (`articlesStatus`, `bylawsStatus`, `einStatus`, `form8832Status`, `form1120Status`).
- **Features**: Clinic registration, officer management (Trustee/Secretary/Treasurer), AI-generated Articles of Association + Bylaws, fixed-template UMC + NAA contracts, EIN application guidance, Form 8832 + Form 1120 guidance, banking setup tips, PMA Defender AI legal guidance chat.
- **Security**: HMAC portal tokens (7-day expiry) using `CORE_API_KEY` — fail-closed if env var missing. All admin endpoints require `admin` role.
- **Key Endpoints**: `POST /clinics`, `GET /clinics/:id/filing-steps`, `PUT /clinics/:id/filing-steps/:step`, `POST /clinics/:id/generate-documents`, `POST /clinics/:id/officers`, `GET /clinics/:id/portal-token`, `GET /portal/:token`, `POST /defender/chat`, `GET /tax-guidance`.

### Clinic Node Infrastructure & Global Expansion
- **Architecture**: Distributed network of autonomous clinic nodes, each running the full FFPMA stack (PostgreSQL, Node.js, React, Redis, Nginx).
- **Failover**: 60-second heartbeat protocol with automatic failover. Nodes missing 5min of heartbeats trigger traffic rerouting to nearest online node.
- **Replication**: PostgreSQL streaming replication (WAL-based) with 11 core tables replicated. Target lag <5 seconds.
- **Health Dashboard**: Admin page at `/admin/clinic-nodes` showing node status, metrics (CPU/RAM/disk), events, and global jurisdictions.
- **Global Jurisdictions**: 10 common law countries mapped with constitutional basis, health freedom scores (0-100), PMA viability assessment, and risk factors. US (92), Canada (78), NZ (76), India (75), Jamaica (74), UK (72), Ireland (71), Australia (70), South Africa (68), Kenya (65).
- **API**: `GET/POST /api/clinic-nodes/*`, `POST /api/clinic-nodes/heartbeat` (no auth), `GET/POST /api/jurisdictions`, `POST /api/clinic-nodes/seed`.
- **Schema**: `clinic_nodes`, `clinic_node_events`, `global_jurisdictions`, `node_replication_logs` tables.
- **Deployment**: 10-step provisioning checklist from infrastructure through Trustee go-live approval.
- **Documentation**: `docs/architecture/clinic-node-architecture.md`.

## External Dependencies

- **AI Services**: OpenAI, Anthropic, Google Gemini, HuggingFace, OpenRouter (200+ models via single API)
- **Payments**: Stripe (Checkout Sessions, webhooks)
- **E-commerce**: WooCommerce (product sync)
- **Database**: PostgreSQL
- **Authentication**: WordPress OAuth
- **Document Signing**: SignNow
- **Cloud Storage/Productivity**: Google Drive, Google Slides API
- **Communication**: Telegram (via OpenClaw integration)
- **External Data**: PubMed (for research links), TheCandidaDiet.com