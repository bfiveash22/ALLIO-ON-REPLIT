# Overview
Allio v1 (Forgotten Formula PMA) is a full-stack health and wellness platform designed to empower individuals on their healing journeys. It provides a comprehensive, integrated solution for holistic health management, from member intake and AI-driven analysis to personalized protocol generation, educational content, and ongoing support. The platform's core purpose is to leverage AI-powered tools to create personalized healing protocols, manage member data, and streamline administrative tasks for practitioners. The business vision is to become a leading platform in personalized wellness, offering advanced AI capabilities and a seamless user experience for both members and practitioners. All user-facing content adheres to PMA language compliance standards.

# User Preferences
I want iterative development, with a focus on delivering small, functional increments. Please ask clarifying questions and propose alternative solutions when appropriate, especially before making significant architectural changes or implementing complex features. I prefer clear, concise explanations and well-structured code. Do not make changes to files outside the `artifacts/ffpma/` and `artifacts/api-server/` directories unless explicitly instructed.

# System Architecture

## Monorepo Structure
The project is organized as a pnpm monorepo using workspaces for efficient management of shared code and distinct applications.

## Technology Stack
- **Node.js**: v24
- **TypeScript**: v5.6
- **Package Manager**: pnpm
- **Frontend**: React 19, Vite 7, Tailwind CSS v4, shadcn/ui (New York style)
- **Backend**: Express 4, Drizzle ORM 0.39
- **Database**: PostgreSQL
- **Validation**: Zod v3, `drizzle-zod` v0.7
- **Authentication**: WordPress OAuth, session-based auth
- **Build**: Vite (frontend), esbuild/tsx (backend)

## Core Applications
- **`ffpma` (Frontend)**: A React/Vite application with forms, dashboards, and UI components.
- **`api-server` (Backend)**: An Express API server handling routing, database interactions, storage, and business logic, including security features.
- **`mockup-sandbox`**: A development-only component preview server for UI development.

## Shared Libraries (`lib/`)
- **`shared`**: Common code including Drizzle schemas, AI agent definitions, TypeScript types, and utilities.
- **`api-spec`**: OpenAPI specification and codegen configuration.
- **`api-client-react`**: Generated React Query hooks for API interaction.
- **`api-zod`**: Generated Zod schemas from the OpenAPI spec.

## Deployment & Environment
The platform targets autoscale Replit deployment. The backend serves static frontend assets in production. Sensitive data is managed via Replit Secrets.

## Protocol Assembly System
An AI-powered pipeline generates personalized 90-day healing protocols based on member data. It produces four deliverables (Full Protocol PDF, Daily Schedule PDF, Peptide Schedule PDF, PPTX Presentation) covering various modality types and automatically uploads them to Google Drive. A resource engine dynamically selects educational materials. The system utilizes template-based generation for PPTX (with a specific brand theme and fonts) and PDF documents (with FF PMA branding). A presentation component provides an interactive slideshow. The system includes an AI agent QA step for validation. AI engines used are Abacus AI (primary) and OpenAI (fallback).

## Google Drive Library Sync
A service synchronizes a Google Drive "Library" folder (containing 50 categories and over 361 documents) with the platform's database, making resources accessible to users with category filters and document viewers.

## SignNow Unified Contract Migration
Integrates with SignNow for electronic document signing, managing doctor onboarding and member agreements, with webhook notifications for completion.

## Video Production System (PRISM)
A marketing studio feature for generating videos with template selection, voice styling, and automated production pipelines, including TTS, image matching, music, ffmpeg assembly, and Google Drive upload.

## LBA Blood Analysis & Certification System
Features AI-powered blood analysis and a 17-module certification course with quizzes and a final exam, awarding "LBA Practitioner Certified" status upon completion.

## Completion Verification Rule
All tasks must pass a completion verification rule enforced via an internal agent rules system.

## Agent Network
An AI agent network includes 47 agents, a scheduler, and a Sentinel monitoring system. Agents utilize Gemini CLI tools (deep analysis, summarization, research, code review, transform) and NotebookLM integration for source-grounded analysis (Q&A, study guides, briefing documents, multi-document synthesis, audio scripts). OpenRouter provides a universal AI fallback with a wide range of models for cost optimization across 13 agents.

## Legal Division & Constitutional Law Framework
The platform incorporates a legal division with dedicated AI agents (JURIS, LEXICON, AEGIS, SCRIBE) trained on constitutional law, covering First, Fourteenth, Ninth, and Tenth Amendment protections, regulatory analysis, and case law. A comprehensive constitutional law framework is accessible, with scripts for Drive audits and framework uploads.

## PMA Filing Manager (In-House)
This system integrates PMA filing capabilities directly into the platform, replacing an external application. It features an 8-step filing wizard, AI-generated legal documents (Articles of Association, Bylaws), fixed-template contracts, and guidance for EIN, Form 8832, and Form 1120. It also includes an AI legal guidance chat (PMA Defender). Security is managed via HMAC portal tokens and role-based access.

## Clinic Node Infrastructure & Global Expansion
A distributed network of autonomous clinic nodes runs the full FFPMA stack with a 60-second heartbeat protocol for failover and PostgreSQL streaming replication. An admin dashboard monitors node status and metrics. The system supports global expansion with mapping of 10 common law countries, including health freedom scores and PMA viability assessments.

# External Dependencies

- **AI Services**: OpenAI, Anthropic, Google Gemini, HuggingFace, OpenRouter
- **Payments**: Stripe
- **E-commerce**: WooCommerce
- **Database**: PostgreSQL
- **Authentication**: WordPress OAuth
- **Document Signing**: SignNow
- **Cloud Storage/Productivity**: Google Drive, Google Slides API
- **Communication**: Telegram (via OpenClaw)
- **External Data**: PubMed, TheCandidaDiet.com