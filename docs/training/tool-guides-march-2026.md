# FFPMA Platform Tool Guides
## ECS Tool, Skin Analysis, X-Ray Analysis, Doctor Portal Enhancements

**Audience:** Doctors, Clinic Admins, Support Staff, Trustee  
**Updated:** March 2026  
**Classification:** Internal Training Document

---

## Tool 1: ECS Tool — Endocannabinoid System Profiler

### Overview
The ECS Tool is an interactive member-facing assessment that profiles an individual's endocannabinoid system status and maps it to appropriate cannabinoid-based products. It is accessible from the FFPMA member portal.

### Access
- **Members:** Member Portal > ECS Tool (left navigation)
- **Doctors:** Viewable in member records within the Doctor Portal

### How It Works

**Step 1 — ECS Assessment (6 Questions)**
Members answer questions across six health domains:
- Mood stability
- Sleep quality
- Chronic pain / inflammation frequency
- Digestive health
- Immune resilience
- Stress management capacity

Each question produces a score of 1–5. Results are aggregated into an overall ECS profile.

**Step 2 — Cannabinoid Pharmacokinetic Profiles**
Based on assessment results, the tool presents relevant cannabinoid profiles:

| Cannabinoid | Primary Target | Key Effects | Routes |
|-------------|---------------|-------------|--------|
| CBD | CB1/CB2 | Anxiety, inflammation, sleep | Oral, sublingual, topical |
| CBG | CB1/CB2 | Neuroprotection, gut health | Oral, sublingual |
| CBN | CB1 | Sleep, sedation | Oral |
| CBC | CB2 | Anti-inflammatory, neurogenesis | Oral, topical |
| THCV | CB1 antagonist | Appetite, metabolic | Oral |

Each profile includes:
- Onset time by route of administration
- Duration of effect
- Bioavailability percentage
- Half-life
- Clinical notes

**Step 3 — CYP450 Interaction Map**
The tool displays a safety risk assessment showing how each cannabinoid interacts with the major CYP450 enzyme families:
- **CYP3A4** — Metabolizes ~50% of all pharmaceuticals
- **CYP2D6** — Metabolizes antidepressants, beta-blockers, opioids
- **CYP2C9** — Metabolizes NSAIDs, warfarin, statins
- **CYP2C19** — Metabolizes PPIs, antiplatelets, some SSRIs

Risk levels are shown as: None / Low / Moderate / High / Contraindicated

**Clinical Note:** Members on warfarin, statins, or CYP-sensitive medications must discuss the ECS Tool recommendations with their prescribing physician before starting any cannabinoid protocol.

**Step 4 — Product Recommendations**
Assessment results are automatically mapped to specific FFPMA product recommendations, organized by priority and protocol phase.

### For Support Staff
When members ask about the ECS Tool:
- Explain it as an educational profiling tool, not a diagnostic
- Confirm they have access through their member portal
- For CYP450 drug interaction questions, escalate to the clinical team
- For product availability questions, refer to the product catalog

---

## Tool 2: Skin Analysis Upload

### Overview
The Skin Analysis tool is a Vision AI-powered image analysis feature available in the Doctor Portal. It accepts uploaded skin photographs and returns observations and protocol recommendations.

### Access
- **Doctors only:** Doctor Portal > Diagnostics > Skin Analysis
- Located alongside Blood Analysis and X-Ray Analysis

### How It Works

**Upload Methods:**
1. **File Upload** — Drag and drop or click to upload JPEG or PNG images
2. **Live Capture** — Use device camera for direct photo capture

**Analysis Output:**
- Visible pattern observations (texture, coloration, lesions, inflammation)
- Areas of concern identified with descriptions
- Protocol recommendations aligned with observations
- Confidence level (High / Moderate / Low)

**Stored Output:**
- Analysis results are saved to the member's record
- Results can be referenced in future appointments
- Output can be included in protocol documentation

### Clinical Guidelines
- Skin Analysis is a decision support tool, not a diagnostic
- Results should be interpreted by a qualified practitioner
- Not suitable for diagnosing melanoma or malignant conditions — these require biopsy
- Useful for tracking visible changes in eczema, psoriasis, and chronic skin conditions over time

### Documentation
After completing a skin analysis, document findings in the ALLIO system entry using the standard assessment note format.

---

## Tool 3: X-Ray Analysis Upload

### Overview
The X-Ray Analysis tool applies AI pattern recognition to uploaded diagnostic imaging to support clinical review.

### Access
- **Doctors only:** Doctor Portal > Diagnostics > X-Ray Analysis
- Available in the same diagnostics panel as Skin Analysis

### How It Works

**Upload:**
- Upload X-ray images (JPEG, PNG, or DICOM-exported JPG)
- Standard JPEG exports from PACS or radiology systems are supported

**Analysis Output:**
- Structural observations and areas of interest highlighted
- Pattern descriptions in plain language
- Flagged areas for clinical follow-up

**Important Limitations:**
- Not a replacement for board-certified radiologist review
- Use as a preliminary aid to support clinical decision-making
- Do not use as the sole basis for diagnosis
- Results should be confirmed by radiology review for significant findings

### Clinical Use Cases
- Preliminary review of spinal or joint imaging before appointments
- Second-opinion comparison for borderline findings
- Tracking structural changes over serial imaging

---

## Tool 4: Doctor Portal — Member Management Enhancements

### Overview
The Doctor Portal has received significant member management upgrades to support the growing network. These features are available to all network doctors.

### 4.1 Enrollment Gating (SignNow Contract Verification)

**What It Is:**
The platform now automatically gates member enrollment based on SignNow contract status. No intake or protocol pipeline steps can be initiated for a member until their signed membership agreement has been verified.

**How It Works:**
1. Member completes and signs the Membership Agreement via SignNow
2. SCRIBE agent monitors SignNow for completed signatures
3. Upon verification, the member's status updates from "Pending Signature" to "Active"
4. Doctor Portal shows a green checkmark on the Documents column for that member
5. Only verified members appear in the Protocol Assembly queue

**Status Indicators:**
| Status | Meaning | Action |
|--------|---------|--------|
| Pending signature | Agreement sent, not yet signed | Wait or resend via SCRIBE |
| Processing | Signature received, verifying | Usually clears in <5 min |
| Active | Verified — all features unlocked | Proceed with intake |
| Cancelled | Member removed or agreement voided | Contact Trustee |

**If a member reports they've signed but still shows as Pending:**
1. Check SignNow status in the Doctor Portal member record
2. If showing as signed in SignNow but not updating, escalate to SCRIBE or Trustee
3. Do not manually advance the member's status without Trustee approval

### 4.2 Member Lookup by ID or Referral URL

**Member Search:**
Doctors can search enrolled members by:
- Member name (first/last)
- Member email address
- Member ID (numeric)
- Referral code

**Search Location:** Doctor Portal > Members tab > Search bar

**Referral URL Lookup:**
Each doctor has a unique referral URL and doctor code. You can look these up at:
- Doctor Portal > Referral Network tab
- Doctor code is used to attribute members to your network
- Referral URL is your shareable member sign-up link

### 4.3 Downline Tracking (Referral Network)

**What It Is:**
The Referral Network tab in the Doctor Portal shows all members enrolled under your doctor code, their enrollment status, and network-level statistics.

**Dashboard Shows:**
- Your referral URL and doctor code (copyable with one click)
- Total enrolled members count
- Active members vs. pending (awaiting signature or payment)
- Referral revenue summary

**Member List Columns:**
| Column | Description |
|--------|-------------|
| Name | Member full name |
| Email | Member contact |
| Status | Active / Pending signature / Processing / Cancelled |
| Documents Signed | Yes / No — SignNow verification status |
| Enrolled Date | When the member joined under your code |

**Filtering:**
- View All, Active Only, or Pending Only members

### 4.4 Blood Analysis Upload (In Doctor Portal)

Doctors can now upload blood work directly from within the Doctor Portal during member consultations.

**Access:** Doctor Portal > Members > [Select Member] > Blood Analysis tab

**Supported Formats:**
- Lab report images (JPEG, PNG)
- Scanned lab PDFs (AI-extracted)
- Live dark-field microscopy capture

**Results:**
- TRUE VISION AI analysis completed in real time
- Findings saved to member's chart
- Can be referenced in protocol generation

### 4.5 AI Consult Team (ConsultAI)

Doctors can launch AI consultations with specific ALLIO agents from within a member's record.

**Access:** Doctor Portal > Members > [Select Member] > Consult AI Team

**Available for Consult:**
- HIPPOCRATES (ancient medicine, holistic protocols)
- PARACELSUS (peptide protocols, dosing)
- SYNTHESIS (biochemistry, formula analysis)
- ORACLE (product recommendations)

**Use Case:**
"My member has autoimmune thyroid disease and wants peptide support. Let me consult PARACELSUS for contraindication guidance."

---

## Tool 5: Trustee / Admin Tools

### 5.1 SENTINEL Contract Review (Multi-Agent Legal Audit)

**What It Is:**
The Contract Review tool enables the Trustee to launch a coordinated legal audit of the FFPMA Network Affiliation Agreement using multiple specialized legal agents simultaneously.

**Access:** Trustee Dashboard > Contract Review (or Admin > SENTINEL tab)

**How It Works:**
1. Trustee clicks "Launch Review" to initiate
2. SENTINEL coordinates the review, dispatching tasks to four legal agents:
   - **JURIS** — Overall legal strategy, PMA compliance, regulatory risk
   - **LEXICON** — Clause-by-clause contract analysis, member protections
   - **AEGIS** — PMA sovereignty, constitutional defense points
   - **SCRIBE** — Document workflow integrity, signature requirements
3. Each agent produces a review with categorized findings (Critical / Warning / Suggestion)
4. A consolidated report is generated showing all findings merged and prioritized
5. A list of prioritized edits is produced for Trustee action

**Finding Severity Levels:**
| Severity | Color | Meaning |
|----------|-------|---------|
| Critical | Red | Must be fixed before contract is used |
| Warning | Amber | Should be addressed; legal risk if ignored |
| Suggestion | Cyan | Optional improvement |

**Review Progress:**
- Reviews poll automatically every 5 seconds during processing
- Status indicator shows: Pending → In Progress → Completed
- Results persist and can be re-viewed without re-running

**Downloading Results:**
- Full report can be downloaded as a structured document
- Findings are sorted by severity for prioritized editing

---

### 5.2 Agent Activity Dashboard

**What It Is:**
The Agent Activity Dashboard provides Trustee and Admin users with real-time and historical visibility into the activity of all 48 ALLIO agents.

**Access:** Trustee Dashboard > Agent Activity (or Admin > Activity)

**Dashboard Sections:**

**Summary Cards:**
- Total tasks completed (all time and by time range)
- Agents currently active
- Tasks currently in progress
- Failed tasks in selected time range

**Division Overview:**
- Per-division task counts and completion rates
- Visual health indicator per division (Healthy / Warning / Degraded)

**Agent List:**
- All 48 agents with current status, last active time, and task counts
- Filterable by division, status, and time range
- Searchable by agent name

**Task Feed:**
- Scrollable list of recent tasks across all agents
- Per-task status (Completed, In Progress, Pending, Failed, Blocked)
- Click any task to open the Agent Detail Drawer

**Agent Detail Drawer:**
- Full task history for a specific agent
- Performance metrics (completion rate, average task duration)
- Failure log with error messages
- Clickable escalation to SENTINEL if agent is degraded

**Time Range Filters:**
- Last 1 hour (1h)
- Last 6 hours (6h)
- Last 24 hours (24h) — default view
- Last 3 days (3d)
- Last 7 days (7d)

---

### 5.3 Protocol Queue Management

**What It Is:**
The Protocol Queue is the Trustee's view of all pending, in-progress, and recently completed protocol approvals.

**Access:** Trustee Dashboard > Protocol Queue

**Queue Contents:**
- Member name and assigned doctor
- Protocol status (Pending Review / Approved / Revision Requested / Delivered)
- Google Slides presentation link (opens in Drive when available)
- Submission timestamp

**Actions:**
- **Approve** — Protocol is finalized and accessible to member
- **Request Revision** — Doctor is notified to refine the protocol
- **Escalate** — Flags the protocol for clinical director review

**SENTINEL Integration:**
When a protocol enters the queue, SENTINEL sends a notification to the Trustee via Telegram (OpenClaw bridge). The Trustee can reply via Telegram to trigger approval or revision workflows.

---

*Tool Guides - Forgotten Formula PMA*  
*For internal use only*  
*Updated March 2026*
