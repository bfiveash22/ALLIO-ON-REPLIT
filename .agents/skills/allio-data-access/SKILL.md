---
name: allio-data-access
description: Centralized reference for all database tables, research APIs, REST endpoints, and data access patterns available to the Allio agent network. Use when any agent needs to query the PostgreSQL database, search scientific literature, access REST API endpoints, or perform direct SQL queries. Covers 88 tables across 12 domains, 6 research APIs, 80+ REST endpoints, the IStorage interface, and Drizzle ORM patterns.
---

# Allio Data Access

Shared data access reference for all 46 agents across the 7-division Allio network. This skill documents every database table, research API, REST endpoint, and access pattern available to agents.

## Database Connection

**Connection:** PostgreSQL via `DATABASE_URL` environment variable.

**ORM:** Drizzle ORM with `node-postgres` driver.

```typescript
// Drizzle ORM (recommended for most queries)
import { db } from "artifacts/api-server/src/db";
import { eq, desc, and, or, ilike, inArray, sql } from "drizzle-orm";
import * as schema from "ffpma-app/shared/schema";

const tasks = await db.select().from(schema.agentTasks)
  .where(eq(schema.agentTasks.status, "pending"))
  .orderBy(desc(schema.agentTasks.createdAt));
```

```typescript
// Direct SQL via instrumentedQuery (for complex/raw queries)
import { instrumentedQuery } from "artifacts/api-server/src/db";

const result = await instrumentedQuery(
  `SELECT * FROM agent_tasks WHERE status = $1 AND division = $2`,
  ['pending', 'science']
);
```

```javascript
// Standalone pg client (for scripts/monitoring)
import pg from 'pg';
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const result = await client.query(`SELECT COUNT(*) FROM agent_tasks`);
await client.end();
```

## Database Tables by Domain (88 tables)

### Agent System (10 tables)
| Table | Purpose |
|-------|---------|
| `agent_tasks` | All agent tasks: status (pending/in_progress/completed/blocked/failed/needs_retry), priority (1-10), progress (0-100%), division, output |
| `agent_registry` | Registered agents: agentId, name, division, capabilities, is_active, current_task_id |
| `agent_configurations` | Per-agent config: model, temperature, system prompt, tools enabled |
| `agent_task_reviews` | Task review queue: reviewer, status (pending/approved/rejected/needs_changes), feedback |
| `agent_research_queries` | Research query log: agentId, query, sources searched, results count, purpose |
| `agent_research_collections` | Curated paper collections per agent |
| `division_leads` | Division leadership: lead agent, progress %, status, last update |
| `sentinel_notifications` | System alerts: type (info/warning/error/critical/success), message, read status |
| `athena_email_approvals` | Email approval queue for ATHENA agent |
| `implemented_outputs` | Completed agent output artifacts |

### Members & Users (7 tables)
| Table | Purpose |
|-------|---------|
| `member_profiles` | Member data: userId, membershipTier, role, phone, address, clinic association |
| `member_enrollment` | Enrollment tracking: status (started/document_sent/signed/payment_pending/completed/cancelled) |
| `user_wp_roles` | WordPress role assignments per user |
| `wp_role_definitions` | Available WordPress roles |
| `wp_role_mappings` | Role-to-permission mappings |
| `referrals` | Member referral tracking |
| `user_achievements` | Earned achievements per user |

### Clinics & Doctors (5 tables)
| Table | Purpose |
|-------|---------|
| `clinics` | Clinic network: name, EIN, address, WP sync, SignNow templates, status |
| `clinic_nodes` | Distributed clinic node topology |
| `doctor_onboarding` | Doctor onboarding workflow: status, agreement, verification |
| `network_doctors` | Doctor profiles in the clinic network |
| `doctor_appointments` | Appointment scheduling: type (consultation/follow-up/blood-analysis), status |

### Products & Orders (6 tables)
| Table | Purpose |
|-------|---------|
| `products` | Product catalog: name, SKU, price, WooCommerce sync, category |
| `product_variations` | Product variants (size, strength, etc.) |
| `product_role_prices` | Role-based pricing tiers |
| `categories` | Product categories |
| `orders` | Order records: status (pending/processing/shipped/delivered/cancelled), total, user |
| `order_items` | Individual items per order |

### Training & Education (16 tables)
| Table | Purpose |
|-------|---------|
| `training_modules` | Training content modules: title, slug, description, content, duration, difficulty |
| `training_module_sections` | Module subsections with content |
| `training_module_key_points` | Key takeaways per module |
| `training_tracks` | Learning paths grouping modules |
| `track_modules` | Module-to-track assignments |
| `track_enrollments` | User enrollment in tracks |
| `training_certifications` | Earned certifications |
| `training_quizzes` | Training-linked quizzes |
| `quizzes` | Quiz definitions: title, passing score, difficulty |
| `quiz_questions` | Questions per quiz |
| `quiz_answers` | Answer options per question |
| `quiz_attempts` | User quiz attempts with scores |
| `quiz_responses` | Individual question responses |
| `module_quizzes` | Module-to-quiz links |
| `module_content` | Extended module content |
| `module_bookmarks` | User bookmarks on modules |

### Research & Science (4 tables)
| Table | Purpose |
|-------|---------|
| `research_papers` | Cached research papers: source (openalex/semantic_scholar/pubmed/arxiv), title, authors, abstract, DOI, citations, TLDR, full text URL |
| `agent_research_queries` | Agent search query log |
| `agent_research_collections` | Curated research collections |
| `generated_protocols` | AI-generated patient protocols |

### Blood Analysis (4 tables)
| Table | Purpose |
|-------|---------|
| `blood_samples` | Dark-field blood sample library: organismType (virus/bacteria/parasite/fungus/cell_abnormality/blood_cell_morphology/artifact/crystal/protein_pattern), category, morphology description, clinical significance, image URLs |
| `blood_sample_tags` | Tags on blood samples |
| `blood_sample_relations` | Relationships between samples |
| `blood_analysis_samples` | Analyzed blood samples with AI results |

### Doctor Portal (7 tables)
| Table | Purpose |
|-------|---------|
| `patient_records` | Patient information: name, DOB, conditions, doctor assignment |
| `patient_uploads` | Patient document/image uploads |
| `patient_protocols` | Treatment protocols per patient: status (active/completed/paused), compliance score |
| `doctor_patient_messages` | Doctor-patient messaging |
| `conversations` | Conversation threads |
| `ai_analysis_requests` | AI image analysis requests and results |
| `practice_analytics` | Doctor practice metrics |

### Legal & Contracts (3 tables)
| Table | Purpose |
|-------|---------|
| `contracts` | SignNow contracts: status (pending/sent/signed/completed), doctor/member agreements |
| `legal_documents` | Legal document library: privacy policy, TOS, PMA contracts |
| `daily_briefings` | Daily legal/operational briefings |

### Chat & Communication (5 tables)
| Table | Purpose |
|-------|---------|
| `chat_rooms` | Chat room definitions |
| `chat_participants` | Room participants |
| `chat_messages` | Chat message history |
| `openclaw_messages` | OpenClaw AI assistant messages |
| `discussion_threads` / `discussion_replies` | Module discussion forums |

### Drive & Assets (3 tables)
| Table | Purpose |
|-------|---------|
| `drive_documents` | Google Drive synced documents |
| `drive_assets` | Marketing/media assets from Drive |
| `library_items` | Content library items: type (document/protocol/training/video/article) |

### Support & AI (8 tables)
| Table | Purpose |
|-------|---------|
| `diane_conversations` | Diane AI assistant conversation threads |
| `diane_messages` | Diane conversation messages |
| `diane_knowledge` | Diane knowledge base entries |
| `support_conversations` | Support ticket conversations |
| `support_messages` | Support messages |
| `achievements` | Achievement definitions |
| `user_progress` / `user_progress_tracking` | User learning progress |
| `user_quiz_results` | Quiz result summaries |

### WordPress Sync & System (8 tables)
| Table | Purpose |
|-------|---------|
| `sync_jobs` | WP sync job tracking: type (users/products/categories/roles/full), status |
| `sync_events` | Individual sync event log |
| `wp_webhooks` | WordPress webhook registrations |
| `programs` / `program_enrollments` | Treatment programs and enrollment |
| `api_keys` | API key management |
| `api_audit_logs` | API access audit trail |
| `webhook_endpoints` | Registered webhook endpoints |
| `ui_refactor_proposals` | UI change proposals: status (pending/approved/rejected/deployed) |
| `ai_model_evaluations` | AI model performance evaluations |

## Research APIs

Six external research APIs are integrated, plus an internal Drive library search. All are available via `artifacts/api-server/src/services/research-apis.ts`.

### OpenAlex (Primary)
- **Records:** 250M+ scholarly works
- **Rate limit:** 100,000 requests/day (free, polite pool)
- **Best for:** Comprehensive metadata, citation counts, open access links
```typescript
import { searchOpenAlex } from "artifacts/api-server/src/services/research-apis";
const result = await searchOpenAlex("thymosin alpha-1 cancer", { limit: 25, yearFrom: 2020, openAccessOnly: true });
```

### PubMed (E-Utilities)
- **Records:** 39M+ biomedical citations
- **Rate limit:** 3 req/sec (10 with API key via `PUBMED_API_KEY`)
- **Best for:** Medical/clinical research, biomedical literature
```typescript
import { searchPubMed } from "artifacts/api-server/src/services/research-apis";
const result = await searchPubMed("BPC-157 wound healing", { limit: 25 });
```

### Semantic Scholar
- **Features:** AI-powered TL;DR summaries, citation analysis
- **Rate limit:** 100 req/5 min (public), higher with `SEMANTIC_SCHOLAR_API_KEY`
- **Best for:** AI summaries, quick paper understanding
```typescript
import { searchSemanticScholar } from "artifacts/api-server/src/services/research-apis";
const result = await searchSemanticScholar("peptide therapy", { limit: 10 });
// result.papers[0].tldr contains the AI summary
```

### arXiv
- **Records:** Preprints in physics, math, CS, quantitative biology
- **Rate limit:** 1 req/3 sec
- **Best for:** Cutting-edge preprints, open access full text
```typescript
import { searchArxiv } from "artifacts/api-server/src/services/research-apis";
const result = await searchArxiv("molecular pathway modeling", { limit: 25 });
```

### CORE (Open Access)
- **Features:** Open-access full-text research
- **Requires:** `CORE_API_KEY` environment variable
- **Best for:** Full-text open access papers
```typescript
import { ResearchAPIService } from "artifacts/api-server/src/services/research-api";
const api = new ResearchAPIService();
const results = await api.searchCore("endocannabinoid system", 10);
```

### Unpaywall
- **Features:** Open access link resolution for papers with DOIs
- **Used automatically** by `ResearchAPIService.addFullTextLinks()` to find free PDF links

### Unified Multi-Source Search
```typescript
import { searchAllSources } from "artifacts/api-server/src/services/research-apis";
const result = await searchAllSources({
  query: "cancer immunotherapy peptides",
  sources: ['openalex', 'pubmed', 'semantic_scholar', 'arxiv'],
  limit: 50,
  yearFrom: 2020,
  openAccessOnly: false
});
// result.papers - deduplicated, sorted by citation count
// result.sourceResults - per-source breakdown
// Also searches internal Google Drive library automatically
```

## Agent-Specific Research Functions

Each science agent has a dedicated search function optimized for its specialty:

| Function | Agent | Specialty | Primary Sources |
|----------|-------|-----------|-----------------|
| `hippocratesSearch(query, limit)` | HIPPOCRATES | Medical/clinical research | PubMed + OpenAlex (medical filter) + Drive |
| `paracelsusSearch(query, limit)` | PARACELSUS | Peptides/biochemistry | PubMed + OpenAlex (enriched query) + Drive |
| `helixSearch(query, limit)` | HELIX | General science coordinator | All sources unified + Drive |
| `oracleSearch(query, limit)` | ORACLE | AI-powered insights | Semantic Scholar (TL;DR priority) + Drive |

```typescript
import { hippocratesSearch, paracelsusSearch, helixSearch, oracleSearch } from "artifacts/api-server/src/services/research-apis";

const medical = await hippocratesSearch("ivermectin anti-cancer mechanisms", 20);
const peptide = await paracelsusSearch("BPC-157 tissue repair", 20);
const general = await helixSearch("endocannabinoid system cancer", 20);
const summarized = await oracleSearch("NAD+ cellular regeneration", 20);
```

### Agent Orchestrated Search (with DB caching)
```typescript
import { researchApi } from "artifacts/api-server/src/services/research-api";

const paperIds = await researchApi.agentSearch(
  "HIPPOCRATES",
  "Hippocrates",
  "thymosin alpha-1 immunotherapy",
  "Protocol research for breast cancer patient"
);
// Returns saved paper IDs, automatically caches to research_papers table
// Logs query to agent_research_queries table
```

## REST API Endpoints

All endpoints are served from the API server. Base path: `/api/`.

### Blood Samples & Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/blood-samples` | List samples (filters: organismType, category, search, tags) |
| GET | `/api/blood-samples/tags` | All available tags |
| GET | `/api/blood-samples/search-for-ai` | AI-optimized sample search |
| GET | `/api/blood-samples/:id` | Single sample with tags |
| GET | `/api/blood-samples/:id/tags` | Tags for a sample |
| POST | `/api/blood-analysis/analyze` | AI blood sample analysis |
| GET | `/api/blood-analysis/status` | HuggingFace model availability |
| POST | `/api/blood-analysis/pattern-match` | Pattern matching against library |

### Research Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/research/search` | Multi-source unified search |
| POST | `/api/research/hippocrates` | HIPPOCRATES agent search |
| POST | `/api/research/paracelsus` | PARACELSUS agent search |
| POST | `/api/research/helix` | HELIX agent search |
| POST | `/api/research/oracle` | ORACLE agent search |
| GET | `/api/research/openalex?q=` | Direct OpenAlex query |
| GET | `/api/research/pubmed?q=` | Direct PubMed query |

### Agent Tasks & Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agent-tasks` | List all tasks (filter: ?division=, ?agentId=) |
| POST | `/api/agent-tasks` | Create new task |
| PUT/PATCH | `/api/agent-tasks/:id` | Update task |
| DELETE | `/api/agent-tasks/:id` | Delete task |
| GET | `/api/agent-network/stats` | Network-wide statistics |
| GET | `/api/agents/scheduler/status` | Scheduler status |
| POST | `/api/agents/scheduler/trigger` | Trigger immediate task execution |
| POST | `/api/agents/scheduler/seed` | Seed initial tasks |
| POST | `/api/agents/scheduler/start` | Start agent scheduler |
| POST | `/api/agents/scheduler/stop` | Stop agent scheduler |

### Sentinel & Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sentinel/notifications` | Recent notifications |
| GET | `/api/sentinel/notifications/unread` | Unread notifications |
| POST | `/api/sentinel/notifications/:id/read` | Mark notification read |
| POST | `/api/sentinel/notifications/read-all` | Mark all read |
| POST | `/api/sentinel/chat` | Chat with Sentinel |

### Core Agents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/core-agents` | Core agent statuses |
| POST | `/api/core-agents/activate` | Activate core agents |
| GET | `/api/core-agents/network` | Network overview |
| POST | `/api/core-agents/:agentId/chat` | Chat with agent (ATHENA/SENTINEL/MUSE/PRISM/FORGE) |
| POST | `/api/core-agents/route-task` | Route task to appropriate agent |
| POST | `/api/core-agents/cross-division` | Cross-division support request |
| POST | `/api/core-agents/:agentId/workflow` | Execute agent workflow |
| GET | `/api/core-agents/messages` | Recent inter-agent messages |

### Doctor Portal
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/doctor/patients` | List doctor's patients |
| GET/POST/PUT | `/api/doctor/patients/:id` | Patient CRUD |
| POST | `/api/doctor/patients/:patientId/uploads` | Upload patient documents |
| GET | `/api/doctor/protocols` | Doctor's protocols |
| POST | `/api/doctor/patients/:patientId/protocols` | Create protocol |
| PUT | `/api/doctor/protocols/:id` | Update protocol |
| GET | `/api/doctor/conversations` | Messaging threads |
| POST | `/api/doctor/messages` | Send message |
| GET | `/api/doctor/analytics` | Practice analytics |
| POST | `/api/ai/analyze-image` | AI image analysis |

### Training
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/training/modules` | All training modules |
| GET | `/api/training/modules/:slug` | Single module |
| GET | `/api/training/modules/:moduleId/content` | Module content (sections + key points) |
| GET | `/api/training/tracks` | Learning tracks |
| GET | `/api/training/tracks/:slug` | Single track |
| POST | `/api/training/ai-tutor` | AI tutor interaction |
| GET | `/api/my/certifications` | User certifications |

### Members & Programs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/programs` | All programs |
| GET | `/api/programs/:slug` | Single program |
| POST | `/api/programs/:slug/enroll` | Enroll in program |
| PATCH | `/api/programs/:slug/progress` | Update progress |
| GET | `/api/my/enrollments` | User enrollments |
| GET | `/api/achievements` | All achievements |
| GET | `/api/my/achievements` | User achievements |
| GET/POST/DELETE | `/api/my/bookmarks` | Module bookmarks |

### Contracts & Legal
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/signnow/doctor-agreement` | Create doctor agreement |
| POST | `/api/signnow/member-agreement` | Create member agreement |
| GET | `/api/legal/documents` | Legal document library |
| POST/PUT/DELETE | `/api/legal/documents/:id` | Legal document CRUD |

### Admin & System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/public/stats` | Public-facing stats |
| GET | `/api/admin/recent-members` | Recently joined members |
| POST | `/api/sync/full` | Full WordPress sync |
| POST | `/api/sync/clinics` | Clinic data sync |
| GET | `/api/integrations/status` | Integration health checks |
| GET | `/api/catalog` | Product catalog |
| GET | `/api/catalog/search` | Catalog search |

## IStorage Interface

The `IStorage` interface (`artifacts/api-server/src/storage.ts`) provides type-safe data access methods. The `DatabaseStorage` class implements it using Drizzle ORM.

```typescript
import { storage } from "artifacts/api-server/src/storage";

// Users & Members
const user = await storage.getUser(id);
const members = await storage.getAllMembers();
const membersWithUsers = await storage.getAllMembersWithUsers();

// Agent Tasks
const tasks = await storage.getAllAgentTasks();
const divisionTasks = await storage.getAgentTasksByDivision("science");
const agentTasks = await storage.getAgentTasksByAgent("HIPPOCRATES");
const newTask = await storage.createAgentTask({ agentId: "DR-FORMULA", title: "Generate protocol", division: "science", status: "pending", priority: 8 });
await storage.updateAgentTask(id, { status: "completed", progress: 100 });

// Contracts & Legal
const contracts = await storage.getAllContracts();
const legalDocs = await storage.getAllLegalDocuments();

// Training
const modules = await storage.getTrainingModules();
const tracks = await storage.getTrainingTracks();

// Blood Samples
const samples = await storage.getBloodSamples({ organismType: "bacteria", search: "spirochete" });
const aiSamples = await storage.searchBloodSamplesForAI("parasitic infection indicators", 10);

// Doctor Portal
const patients = await storage.getPatientRecords(doctorId);
const protocols = await storage.getPatientProtocols(patientRecordId);

// Clinics
const clinics = await storage.getAllClinics();

// Programs
const programs = await storage.getPrograms();
const enrollment = await storage.getProgramEnrollment(userId, programId);

// Diane Knowledge
const knowledge = await storage.getDianeKnowledge();
```

## Common Query Patterns

### Agent health check
```sql
SELECT division, COUNT(*) as total,
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
       COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as active,
       COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
FROM agent_tasks
GROUP BY division
ORDER BY division;
```

### Stalled task detection
```sql
SELECT agent_id, title, status, progress,
       EXTRACT(EPOCH FROM (NOW() - updated_at))/60 as stalled_minutes
FROM agent_tasks
WHERE status = 'in_progress'
  AND updated_at < NOW() - INTERVAL '30 minutes'
ORDER BY updated_at ASC;
```

### Member statistics
```sql
SELECT COUNT(*) as total_members,
       COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_this_week
FROM member_profiles;
```

### Research paper lookup
```sql
SELECT title, source, citation_count, tldr, full_text_url
FROM research_papers
WHERE source = 'pubmed'
ORDER BY citation_count DESC NULLS LAST
LIMIT 20;
```

### Protocol tracking
```sql
SELECT pr.first_name, pr.last_name, pp.title, pp.status, pp.compliance_score
FROM patient_protocols pp
JOIN patient_records pr ON pp.patient_record_id = pr.id
WHERE pp.status = 'active'
ORDER BY pp.updated_at DESC;
```

## Schema Location

All table definitions: `ffpma-app/shared/schema.ts`
Agent profiles & divisions: `ffpma-app/shared/agents.ts`
Database connection: `artifacts/api-server/src/db.ts`
Storage interface: `artifacts/api-server/src/storage.ts`
Research APIs: `artifacts/api-server/src/services/research-apis.ts` and `artifacts/api-server/src/services/research-api.ts`
