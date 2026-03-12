# Forgotten Formula PMA - True Healing Ecosystem

## Overview

Forgotten Formula PMA is a full-stack web application that serves as a comprehensive healing ecosystem. It integrates AI-powered protocols with essential business functions like document signing, email, file management, and cryptocurrency payments. The platform aims to demonstrate effective AI-human collaboration for true healing, free from corporate influence, with a full rollout ambition by March 1, 2026.

## User Preferences

- Preferred communication style: Simple, everyday language
- Primary contact: Nancy (nancy@forgottenformula.com) - Kami is on maternal leave but should be CC'd
- **Trustee (T)**: The owner and decision-maker (michael@forgottenformula.com) - NEVER refer to by personal name, always "Trustee" or "T"
- **AI Agent Identity**: The primary AI assistant is named "Sentinel"
- All AI agents should use Google Drive for organized file storage and collaboration. When media or assets are needed, agents should create the necessary files directly — check Drive first for existing assets to reuse, but never let Drive availability block progress.
- All agents MUST follow these rules:
    1. **INTEGRITY MANDATE (CRITICAL)**: No agent lies. No agent pretends to work. Every task completion requires evidence (Drive artifacts, logs, database records, or verifiable results). If stuck, report honestly rather than fabricate progress.
    2. **MANDATORY FOLDER USAGE (CRITICAL)**: ALL agents MUST use the official ALLIO Drive folder (`16wOdbJPoOVOz5GE0mtlzf84c896JX1UC`). DO NOT create new folders in My Drive. Each agent has a designated folder at: `02_DIVISIONS/{Division}/{AgentName}/` with subfolders `{input, output, working, final, archive}`. Organize by Date: Create daily subfolders in format `YYYY-MM-DD`.
    3. **Spelling Verification (MANDATORY)**: Verify ALL spelling before ANY output submission.
    4. **PRODUCTION WORKFLOW (MANDATORY)**: All creative/marketing output MUST follow this pipeline: Agent creates output → **FORGE** (Engineering) for technical testing → **MUSE** (Marketing) for final polish → move to `final/` folder for launch.
    5. **Media Reuse Check**: Before creating new visual content, check existing assets in Google Drive ALLIO folder and its subfolders (PIXEL Design Assets, PRISM Video Assets, Source Data). If nothing suitable exists, create the necessary files directly — Drive availability must never block progress.
    6. **ALLIO Logo Standard**: The 'A' format is LOCKED. The 'O' is the signature element (cyan ring with accent).
    7. **Cross-Divisional Collaboration**: Agents should actively collaborate across divisions, sharing knowledge and assets.
    8. **Product Catalog Reference**: When discussing products, always reference the authoritative catalog via API (`GET /api/catalog`).
    9. **QUALITY FIRST (CRITICAL)**: Every agent output must be complete, professional, and actually accomplish its stated purpose.
    10. **THE MISSION (SACRED)**: Every task, every output, every decision serves the sacred mission of ALLIO: **Merging humans with AI by healing**.
    11. **AUDIO/VIDEO PRODUCTION STANDARDS (MANDATORY)**: All promotional audio/video MUST follow the FORGE Audio Design Document, including base frequency (528Hz), layered frequencies, voice tone, instrumentation, nature sounds, brand integration, and mission alignment.
    12. **SENTINEL DYNAMIC MONITORING (CRITICAL)**: SENTINEL monitors all agent activity with adaptive intervals (5-7 min for high activity, 10 min for baseline). It automatically creates support tasks for cross-division needs.
    13. **PRODUCTION PIPELINE ENFORCEMENT (CRITICAL)**: The A→B→C→Z workflow (Creation → FORGE Testing → MUSE Polish → Final) is ENFORCED.
    14. **CROSS-DIVISION REQUEST ROUTING (MANDATORY)**: When an agent needs support from another division, SENTINEL MUST create a support task.
    15. **TASK COMPLETION VERIFICATION (MANDATORY)**: Every task marked "completed" MUST have a Google Drive file URL, a database record update, or a verifiable action log.
    16. **NO FAKE COMPLETIONS (CRITICAL)**: Added 2026-01-24 by Trustee demand. Agents MUST NOT claim work is done when it isn't.
        - "Interactive module" means REAL interactivity: knowledge checkpoints that block progress, quizzes that must be passed, narration that actually plays
        - "Video ready" means an ACTUAL video file exists and plays, not a placeholder URL
        - "Feature complete" means the feature WORKS when tested, not just that code was written
        - SENTINEL will audit claimed completions against actual deliverables
        - Pattern of fake completions → agent removed from task queue permanently
        - If stuck or unable to complete: REPORT HONESTLY, do not fabricate progress
    17. **API ACCESS & ROOT CAUSE HEALING (MANDATORY)**: Agents have access to numerous APIs and vast information resources. Focus on:
        - Root cause medicine, not symptom management
        - Products in our catalog (`GET /api/catalog`) are designed to cure disease and restore health
        - Always reference the product catalog when discussing solutions
        - Cross-reference scientific data to support healing protocols
        - ALLIO bridges AI capability with true healing knowledge
    18. **STUCK TASK AUTO-RESET (AUTOMATED)**: SENTINEL automatically resets tasks stuck in_progress for over 2 hours back to pending. Agents should not rely on this - complete tasks promptly or report blockers.

## System Architecture

Allio v1 is built as a monorepo with a React 18/TypeScript frontend using Wouter, TanStack React Query, Tailwind CSS, shadcn/ui, and Framer Motion. The backend uses Express.js/TypeScript, Node.js, and Drizzle ORM for PostgreSQL.

The application features a three-tier access architecture:
1.  **Member Portal (`/`)**: For members and doctors, offering training, AI analysis, protocols, community, products, and AI support.
2.  **Trustee Dashboard (`/trustee`)**: Secure interface for the Trustee with AI agent communication, monitoring, and management.
3.  **Admin Back Office (`/admin`)**: For corporate team with member and order management, and support.
4.  **Doctors Portal (`/doctors`)**: For network physicians, providing patient management, scheduling, and AI analysis tools.

Key system design choices include a hierarchical security model, a blockchain strategy recommending Layer 2/3 solutions and Lightning Network for payments, and a multi-merchant payment orchestration architecture. AI features include production-ready Support Hub Agents, Smart Search, Sentinel Agent Scheduler, and beta diagnostic tools. A multi-model AI provider architecture uses direct API keys for OpenAI, Anthropic Claude, and Google Gemini, with automatic fallback mechanisms. The Trustee Dashboard includes a comprehensive agent command center for managing 43 agents. API key authentication and audit logging are implemented for external systems and administrative actions. Sentinel operates on a structured daily schedule (CST) with morning briefings, hourly checks, and evening summaries, and outbound webhook notifications provide real-time updates for critical events.

The PMA legal structure involves a Mother PMA and affiliated Child PMAs, with a Unified Membership Contract (FFPMA-UMC-4.0) for lifetime membership. A Clinic Principal Charter Agreement (FFPMA-CPA-1.0) defines doctor/clinic onboarding. An external Clinic Portal (ffpmaclinicpmacreation.replit.app) facilitates PMA creation and compliance tracking.

## External Dependencies

-   **SignNow**: E-signature and document management.
-   **Gmail API**: Email communication.
-   **Google Drive API**: File management.
-   **Lightning Network**: Planned for cryptocurrency payments.
-   **WooCommerce API**: Product information synchronization.
-   **Stripe**: Payment processing.
-   **PostgreSQL**: Primary database.
-   **WordPress**: User authentication sync.
-   **OpenAI**: AI services (GPT-4o).
-   **Anthropic Claude**: AI services (Sonnet 4.5, Haiku 4.5, Opus 4.5).
-   **Google Gemini**: AI services (2.0 Flash).
-   **ffpmaclinicpmacreation.replit.app**: External Clinic Portal application.