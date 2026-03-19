# Allio + PMA Filing Manager — Integration Guide

**Prepared for the Allio team by Michael Blake, Trustee — Forgotten Formula PMA**

---

## What Is the PMA Filing Manager?

The PMA Filing Manager is a self-contained web application that automates Private Membership Association (PMA) filing for the Forgotten Formula PMA network. It handles:

- Onboarding 65+ divisional clinic PMAs across 11 states
- AI-generated legal documents (Articles of Association, Bylaws)
- Fixed-template legal contracts (Unified Membership Contract, Network Affiliation Agreement)
- Federal tax compliance guidance (EIN application, Form 8832, Form 1120)
- Banking setup guidance for unincorporated associations
- Real-time AI assistant (PMA Defender) for legal and compliance questions

It is branded as **"Allio — PMA Filing Manager"** and ready to integrate into the broader Allio ecosystem.

---

## Current Architecture

| Layer       | Technology              | Details                                          |
|-------------|-------------------------|--------------------------------------------------|
| Frontend    | React + TypeScript      | Single-page app with its own routing (Wouter)    |
| UI          | Tailwind CSS + shadcn   | Clean, responsive, dark mode support             |
| Backend     | Express.js + TypeScript | RESTful API at `/api/*`                          |
| Database    | PostgreSQL + Drizzle ORM| Self-contained schema, no external dependencies  |
| AI          | OpenAI + Anthropic      | Document generation + chat assistant              |
| Email       | Gmail API               | Auto-sends formation documents to clinic officers |
| File Storage| Google Cloud Storage    | Document and file upload management              |
| Hosting     | Replit (autoscale)      | Currently deployed on `.replit.app` domain       |

---

## Branding Configuration

All branding is controlled from a single file (`shared/networkConfig.ts`):

- **App Name**: "Allio"
- **Module Name**: "PMA Filing Manager"
- **Full Title**: "Allio — PMA Filing Manager"
- **Page titles, SEO tags, and Open Graph metadata** all pull from this config

To update branding across the entire app, only this one file needs to change.

---

## Integration Points

### 1. Authentication / SSO

**Current state**: The admin dashboard uses session-based username/password authentication with a single middleware function (`requireAuth`).

**For Allio integration**: When Allio has a central auth system (SSO, OAuth, or token-based), the `requireAuth` middleware is the single point to swap. No other changes needed.

**Member portal**: The clinic-facing portal (`/portal/:pmaId`) uses HMAC-signed tokens — no login required for clinic owners. Allio can link directly to any clinic's portal from its own dashboard.

### 2. API Access

All data is available through REST endpoints at `/api/*`. Allio's other modules can pull:

- Clinic list and status: `GET /api/pmas`
- Filing progress per clinic: `GET /api/pmas/:id/filing-steps`
- Member data: `GET /api/pmas/:id/members`
- Document status: `GET /api/documents`

These endpoints can sit behind an API gateway or reverse proxy.

### 3. Deployment Options

The PMA Filing Manager can be integrated into Allio's infrastructure in several ways:

| Option                | How It Works                                                  |
|-----------------------|---------------------------------------------------------------|
| **Subdomain**         | `pma.allio.com` — runs as a standalone service                |
| **Path-based**        | `allio.com/pma/` — mounted within the main Allio app via proxy|
| **Iframe embed**      | Embedded within an Allio dashboard panel                      |
| **Custom domain**     | Any domain pointed at the deployed instance                   |

### 4. Email

Currently uses Gmail API (Google Workspace) to send formation documents to clinic officers. Can be redirected to Allio's email service (SendGrid, Postmark, etc.) by updating the email sending module.

### 5. File Storage

Uses Google Cloud Storage for file uploads (document submissions, compliance files). Can be pointed at Allio's storage infrastructure if needed.

---

## What Allio Does NOT Need to Build

The following is fully handled by the PMA Filing Manager — no work required from Allio's team:

- Legal document generation (AI-powered, constitutionally enforced)
- Unified Membership Contract (FFPMA-UMC-2.0) — fixed template
- Network Affiliation Agreement (FFPMA-NAA-1.0) — fixed template
- State-specific addendums (NY, CA — more states can be added)
- EIN application walkthrough with IRS screenshot guidance
- Form 8832 and Form 1120 compliance guidance
- Banking account setup tips (what to bring, what to say, handling bank pushback)
- Tax professional referral (Susan Carlton)
- Compliance tracking and certificate generation
- AI chat assistant for real-time PMA legal guidance

---

## What Allio's Team Would Need to Provide (for deeper integration)

| Item                      | Purpose                                             | Priority  |
|---------------------------|-----------------------------------------------------|-----------|
| SSO/OAuth endpoint        | Unified login across Allio platform                 | When ready|
| Custom domain or subdomain| Production URL for the PMA module                   | When ready|
| Design system / brand kit | If Allio wants the UI restyled to match their look  | Optional  |
| Email service credentials | If moving off Gmail to a shared Allio email service | Optional  |
| Shared analytics          | If Allio tracks events across modules               | Optional  |

---

## Security Highlights

- HMAC-signed portal tokens with 7-day expiry for clinic access
- Rate limiting on registration, document generation, and AI chat endpoints
- Zod validation on all POST endpoints
- SSN stripped server-side before database save
- EIN locks permanently once saved (cannot be changed)
- No PII exposed in client-side code
- Session-based admin auth with secure cookies

---

## Current Status

- **67 clinics** registered across 11 states
- **57 members** onboarded
- **Live and deployed** on Replit autoscale infrastructure
- **All 5 foundational tasks completed**: Form 8832 language cleanup, security hardening, backend refactor, frontend refactor, and Allio branding integration

---

## Contact

For questions about the PMA Filing Manager integration:

- **Michael Blake**, Trustee — blake@forgottenformula.com
- **Phone**: 940.597.0117
- **Tax Professional**: Susan Carlton — susan@carltontax.com | +1 (585) 402-3651
