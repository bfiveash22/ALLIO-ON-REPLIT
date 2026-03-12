import { orchestrator } from './sentinel-orchestrator';
import { claudeAnalyze } from './claude-provider';
import { sentinel } from './sentinel';
import { db } from '../db';
import { agentTasks } from '@shared/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

const REVIEW_PERSIST_PATH = path.join(process.cwd(), 'data', 'contract-review-latest.json');

function saveReviewToFile(review: ContractReviewReport): void {
  try {
    const dir = path.dirname(REVIEW_PERSIST_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(REVIEW_PERSIST_PATH, JSON.stringify(review, null, 2), 'utf-8');
    console.log('[CONTRACT-REVIEW] Review persisted to disk');
  } catch (err: any) {
    console.error('[CONTRACT-REVIEW] Failed to persist review:', err.message);
  }
}

function loadReviewFromFile(): ContractReviewReport | null {
  try {
    if (fs.existsSync(REVIEW_PERSIST_PATH)) {
      const data = fs.readFileSync(REVIEW_PERSIST_PATH, 'utf-8');
      const review = JSON.parse(data) as ContractReviewReport;
      console.log('[CONTRACT-REVIEW] Loaded persisted review from disk');
      return review;
    }
  } catch (err: any) {
    console.error('[CONTRACT-REVIEW] Failed to load persisted review:', err.message);
  }
  return null;
}

const UNIFIED_CONTRACT_V4 = `UNIFIED MEMBERSHIP CONTRACT
The Forgotten Formula PMA — A Private Membership Association
Mother PMA Network Membership & Affiliated Clinic Enrollment Agreement
Contract Version: FFPMA-UMC-4.0 | Effective: February 19, 2026 | Supersedes: All Prior Versions



DECLARATION OF PURPOSE
The Forgotten Formula PMA (“Mother PMA” or “Parent Association”) is a Private Membership Association organized and operating within the private domain under the protections afforded by the First and Fourteenth Amendments to the Constitution of the United States of America. This Association exists to advance the civil rights of its members — including the right to freedom of association, freedom of choice in healthcare, and the right to access information, services, and practitioners of their choosing — free from governmental interference in private affairs.
We believe in the body’s innate capacity to heal. We believe in the freedom of every individual to choose how they care for that body. We believe in the right of informed, consenting adults to gather privately, to share knowledge, and to support one another’s health outside the constraints of a system that too often prioritizes compliance over outcomes. That is why this Association exists.
This Contract is entered into freely and voluntarily by the undersigned Member, who hereby affirms their desire to join the Forgotten Formula PMA network and receive services through its affiliated clinic association identified below.



SECTION I — CONSTITUTIONAL FOUNDATION
The Forgotten Formula PMA and all affiliated clinic associations operating within its network are organized and maintained under the authority of the First Amendment (freedom of association and speech) and the Fourteenth Amendment (equal protection and liberty interests) to the United States Constitution. The Association operates strictly within the private domain and does not concede that public regulations, statutes, or licensing requirements governing the delivery of services in the public domain apply to private association activities. The Association will comply with generally applicable laws — including tax obligations, mandatory reporting of abuse, and court orders establishing proper jurisdiction — but does not pre-concede that industry-specific public health regulations apply absent a court order so establishing.
The Association’s activities span multiple industries — including healthcare, manufacturing, agricultural technology, wellness products, and member services — all protected equally under these constitutional principles. The Association’s case law foundation includes: NAACP v. Button (1963), Thomas v. Collins (1945), Gibson v. Florida (1963), Roberts v. United States Jaycees (1984), and NAACP v. Alabama (1958), among others.
Members of this Association acknowledge and affirm that they are freely exercising their constitutional right of association and their inherent right to choose the manner, method, and nature of their own healthcare and wellness services.



SECTION II — NETWORK STRUCTURE: MOTHER PMA AND AFFILIATED CLINIC ASSOCIATIONS
2.1 The Forgotten Formula PMA — Mother/Parent Association
The Forgotten Formula PMA is the founding, governing, and organizational framework entity — the Mother PMA — for a network of independently organized affiliated clinic associations. The Mother PMA establishes the constitutional framework, membership standards, ethical guidelines, and network affiliation agreements under which all affiliated clinic associations operate. The Mother PMA is led by its Trustee, who provides the divisional PMA structure and framework to affiliated clinics, reinforcing the nature of this relationship as a voluntary constitutional affiliation — not a franchise, ownership, or employment arrangement.
The Association may engage licensed professionals — physicians, practitioners, and other credentialed individuals — through independent service agreements, consistent with the constitutional right to contract. Such professionals bring their expertise and licensure to serve members in the private domain. Their licensure is independently regulated by their respective state authorities and is separate from the member-to-member association relationship. The Association does not direct, supervise, or interfere with the independent clinical judgment of licensed practitioners; practitioners exercise full professional autonomy and are accountable to their respective licensing authorities. The Association contracts licensed practitioners as independent service providers and does not employ them as agents of the public healthcare system.
2.2 Affiliated Clinic Associations — Child PMAs
Each clinic location operating within the Forgotten Formula PMA network is organized as a separate and independent Private Membership Association (a “Child PMA” or “Affiliated Clinic Association”) with its own EIN, Articles of Association, Bylaws, and authorized leadership. Each Affiliated Clinic Association maintains independent governance, financial accounts, operational authority, and decision-making — and does not commingle funds with the Mother PMA or other affiliated clinics except as described in §2.3. The Mother PMA provides constitutional framework documents and network affiliation structure but does not own, manage, or control the day-to-day operations of any Affiliated Clinic Association. Each entity is independently responsible for its own legal obligations and liabilities. The Member understands that claims arising from services at one Affiliated Clinic Association are limited to that entity and do not extend to the Mother PMA or any other affiliated location.
The Affiliated Clinic Association through which the signing Member will primarily receive services is:
[CLINIC NAME PMA] A Private Membership Association affiliated with the Forgotten Formula PMA Network
2.3 Membership Upon Signing
By executing this Contract, the Member simultaneously: 1. Enrolls as a Member in good standing of The Forgotten Formula PMA (Mother PMA); and 2. Is automatically enrolled as a Member of [CLINIC NAME PMA] (Affiliated Clinic Association).
Membership Fee: A one-time enrollment fee of $10.00 is due and payable at the time of signing. This single fee covers full lifetime membership in both The Forgotten Formula PMA and the Affiliated Clinic Association. No additional enrollment fee is assessed for the affiliated clinic membership. The $10.00 enrollment fee is a pass-through collected by the Affiliated Clinic Association on behalf of and remitted to The Forgotten Formula PMA to fund network administration and constitutional defense. All fees charged for specific services, consultations, or products are separately retained by the Affiliated Clinic Association and do not flow to the Mother PMA.



SECTION III — RIGHTS AND PRIVILEGES OF MEMBERSHIP
3.1 Freedom of Association
As a Member of this private association network, the Member voluntarily enters into a private relationship with fellow members, including practitioners and healers who are themselves members of the Association. No third party — including any governmental body, licensing authority, or regulatory agency — has jurisdiction over the private agreements and services exchanged between members of a lawfully constituted private membership association.
3.2 Right to Select Practitioners
Members have the right to select any fellow member of the Association to serve as their practitioner, health advisor, or healer, consistent with the purposes of the Association. The Member is responsible for confirming the qualifications and credentials of any practitioner-member from whom they choose to receive services. The Association does not undertake to verify or monitor the licensure status of member practitioners; that determination rests with the Member.
3.3 Freedom of Healthcare Choice
Members assert and exercise their fundamental right to choose the type, nature, and manner of healthcare and wellness services they receive — including conventional and emerging modalities, professional and non-licensable wellness practices, allopathic and complementary approaches — free from state interference within the private domain. Members acknowledge they are making informed, voluntary, and autonomous choices.
3.4 Network Portability
Membership in the Forgotten Formula PMA network is portable nationwide. A Member in good standing may access services at any Affiliated Clinic Association location within the FFPMA network without requiring a separate membership application or additional enrollment fee.
3.5 Universal Membership Requirement — Clinic Premises
All individuals present within any Affiliated Clinic Association’s facilities — including patients, clients, staff, practitioners, and visitors — must be active, signed Members of the Forgotten Formula PMA network. No services shall be rendered, and no access to clinical areas shall be granted, to any individual who has not executed a current, valid Membership Contract. This policy ensures the integrity of the private association domain and the constitutional protections it affords to all members.
Limited exceptions apply for: (a) emergency medical personnel actively responding to an emergency on premises; (b) government officials executing a valid warrant, court order, or exercising lawful regulatory inspection authority with proper legal process — the Association reserves the right to verify credentials and scope of authority before granting access; and (c) delivery or maintenance personnel accessing non-clinical areas only for the duration of their service.



SECTION IV — MEMBER ACKNOWLEDGMENTS AND AGREEMENTS
By executing this Contract, the Member knowingly, voluntarily, and intelligently acknowledges and agrees to the following:
1. Private Domain: All services, consultations, and exchanges received through the Forgotten Formula PMA network occur strictly within the private domain and are not subject to public health regulations, licensing statutes, or governmental oversight applicable to public commerce.
2. Voluntary Membership: Membership is entirely voluntary. The Member has not been coerced, induced, or misled into joining and freely exercises their constitutional right of association.
3. Separate Entities: The Mother PMA and the Affiliated Clinic Association are separate legal entities, each independently responsible for its own obligations and liabilities. A dispute, claim, or legal matter involving one entity does not create liability for the other.
4. Assumption of Risk and Limited Liability: The Member voluntarily assumes all risk associated with receiving services in this private association setting. The Member waives any claim for ordinary negligence (meaning unintentional errors or mistakes in judgment that do not rise to the level of recklessness) against the Association, its Trustee(s), Affiliated Clinic Associations, and member practitioners arising from services received herein. This waiver does not extend to gross negligence, intentional misconduct, fraud, or criminal conduct. The Member acknowledges that malpractice insurance coverage, if any, carried by individual practitioner-members may not extend to services rendered in this private association context, and the Member does not rely on the existence of such coverage in choosing to receive services herein.
5. Licensed Practitioners — Contracted Expertise: Some members who provide services may hold state professional licenses. When licensed practitioners serve members within the Association, they do so as independently contracted professionals exercising full clinical autonomy in the private domain. Their licensure, regulated by their respective state authorities, represents contracted expertise — not an extension of the public healthcare system into this Association. The Member understands this distinction and voluntarily chooses to receive services in this context.
6. No Guarantee of Outcome: The Association makes no guarantee, warranty, or representation regarding the outcome of any service, consultation, or program. Members assume full responsibility for their health decisions made within the Association.
7. Informed Consent: The Member has had the opportunity to ask questions, review this Contract, and seek independent advice prior to signing. Signing constitutes full, informed consent to membership in both the Mother PMA and the Affiliated Clinic Association.



SECTION V — PRIVACY AND HEALTH INFORMATION
5.1 Private Association Context
Services provided within the Forgotten Formula PMA network are rendered in a private membership association context. The Association does not participate in Medicare, Medicaid, or any insurance billing system. The Association does not electronically transmit member health information to insurance plans, clearinghouses, or other covered entities. The Association’s non-participation in electronic insurance transactions is a basis for its position as a non-covered entity under HIPAA.
5.2 HIPAA Applicability
HIPAA regulations apply to “covered entities” as defined under 45 C.F.R. §160.103 — specifically, healthcare providers who electronically transmit health information in connection with standard insurance transactions. Because the Association operates exclusively in the private domain and does not engage in electronic insurance billing, the Association operates as a non-covered entity and HIPAA regulations do not govern the Association’s internal privacy practices. Any licensed practitioner-member who independently maintains covered entity status in their separate public practice remains subject to HIPAA compliance for that public practice; such obligations are personal to the practitioner and do not convert this non-covered entity Association into a covered entity.
5.3 Association Privacy Commitment
The Association commits to maintaining strict confidentiality of all member health information. The Association will not disclose member information to any third party — including State Medical Boards, FDA, FTC, Medicare, Medicaid, or insurance companies — without the Member’s express written consent, except:
(a) as required by valid legal process, including court orders and subpoenas, which the Association reserves the right to contest before complying; or
(b) as required by mandatory reporting statutes, including laws requiring immediate disclosure of child abuse, elder abuse, domestic violence, or certain communicable diseases — obligations which, where applicable to licensed practitioners, are personal to the practitioner in their individual licensed capacity.
The constitutional right to associational privacy — recognized in NAACP v. Alabama, 357 U.S. 449 (1958) — will be vigorously defended. This protection is not absolute but requires compelling governmental interest established through proper legal process to overcome.
5.4 Member Acknowledgment
The Member acknowledges that by choosing to receive services through this private Association, different privacy practices apply than in the public healthcare system. The Member has been informed of the Association’s privacy practices and voluntarily participates under these terms.



SECTION VI — TERM, GOVERNING LAW, AND DISPUTE RESOLUTION
Term: This Contract shall remain in effect for the lifetime of the Member’s association with the Forgotten Formula PMA network. Membership is granted for life upon payment of the one-time $10.00 enrollment fee and execution of this Contract. There are no annual renewal fees or recurring obligations required to maintain active membership status. Membership may be voluntarily terminated by written notice from the Member, or may be revoked by the Association for cause pursuant to the Association’s Bylaws.
Governing Law: This Contract is governed by and construed in accordance with the laws of the State of Texas, without regard to conflict of law principles. Where any provision of state law conflicts with rights protected by the First and Fourteenth Amendments to the United States Constitution, those constitutional protections shall prevail pursuant to the Supremacy Clause (U.S. Const. Art. VI, Cl. 2). Exclusive venue for any litigation shall be in Denton County, Texas, and the Member consents to personal jurisdiction therein.
Dispute Resolution: Any dispute arising from this Contract shall first be submitted in writing to the Trustee within thirty (30) days of the event giving rise to the dispute. The Trustee shall acknowledge receipt within ten (10) business days and shall attempt informal resolution within thirty (30) days of acknowledgment. If unresolved, the matter shall proceed to binding arbitration under the rules of the American Arbitration Association, conducted in Denton County, Texas. Arbitrator fees and AAA administrative costs shall be advanced by the Association, with final allocation determined by the arbitrator based on outcome and reasonableness of the parties’ positions. The arbitrator’s decision is final and binding. Each party bears its own attorney fees unless the arbitrator finds a claim or defense was frivolous or brought in bad faith. The Member waives any right to class action, and the Association likewise waives any right to bring class or collective claims against Members; all disputes are resolved individually. Nothing in this provision waives either party’s right to seek injunctive relief for irreparable harm.
Breach Remedies: If a Member materially breaches this Contract — including by filing claims in external forums without exhausting the dispute resolution process above — the Association may immediately terminate membership and seek injunctive relief, actual damages, and attorneys’ fees incurred in enforcing this Contract.
Severability: If any provision of this Contract is found invalid or unenforceable, such provision shall be modified to the minimum extent necessary to make it enforceable, or if not modifiable, shall be severed. The remaining provisions shall continue in full force and effect.
Amendments: The Association may amend this Contract upon thirty (30) days’ written notice to Members. All amendments apply prospectively only and shall not retroactively alter the terms governing any dispute arising before the amendment’s effective date. Members who do not wish to be bound by material amendments may terminate membership within thirty (30) days of notice without penalty.
Notices: All written notices required under this Contract shall be sent via U.S. Mail, email, or personal delivery. Notices are effective upon mailing, sending, or delivery. Members must notify the Association in writing of any change of address or email within thirty (30) days. Association notice address: The Forgotten Formula PMA, P.O. Box 147, Justin TX 76247 | accounting@forgottenformula.com.



SECTION VII — PRIVATE DOMAIN PRESERVATION
The constitutional protections of this Association depend on maintaining strict private domain operations. The Member acknowledges that the Forgotten Formula PMA and its Affiliated Clinic Associations: (a) do not advertise to the general public via mass media or unrestricted public channels; (b) do not accept walk-in clients; (c) operate by referral and private invitation within the member network only; and (d) require signed membership for all persons accessing clinic premises. By signing this Contract, the Member acknowledges the private nature of this Association and agrees not to misrepresent it as a public business in any legal, regulatory, or public proceeding.



SECTION VIII — ENTIRE AGREEMENT
This Contract, together with the Bylaws of the Forgotten Formula PMA and the Bylaws of the Affiliated Clinic Association, constitutes the entire agreement between the Member and the Association with respect to membership. Current versions of the Bylaws are available for member review upon written request to accounting@forgottenformula.com. No prior or contemporaneous oral representations are binding except as set forth herein.



MEMBER ACKNOWLEDGMENT BEFORE SIGNING
Please initial each item confirming you have read and understood it:
☐ I have read this entire Contract, including all waivers and acknowledgments in Sections IV–VII.
☐ I understand I am joining a private membership association and receiving services in the private domain — not through a conventional public healthcare provider.
☐ I understand that practitioners in this Association do not carry malpractice insurance coverage applicable to services in this private domain, and that I have waived claims for ordinary negligence as described in Section IV.
☐ I understand that public regulatory oversight (state medical boards, FDA, FTC) and HIPAA-based complaint processes do not apply to services within this private Association.
☐ I am joining voluntarily, have not been coerced, and have had the opportunity to ask questions and seek independent advice.
☐ I understand this is a lifetime membership with a one-time $10.00 fee.
Member Initials: _____________    Date: _____________



SIGNATURE BLOCK
By signing below, all parties confirm their understanding of, agreement to, and acceptance of the terms and conditions set forth in this Unified Membership Contract.



MEMBER
Printed Name: ___________
Signature: ___________
Date: ___________
Address: ___________
Phone: ___________
Email: ___________



ACCEPTANCE — THE FORGOTTEN FORMULA PMA (MOTHER PMA)
NOTE TO CLINIC STAFF: This section must be completed and signed by the Trustee or authorized representative of The Forgotten Formula PMA. Do not leave blank. Contact accounting@forgottenformula.com if unsure who should sign.
Accepted on behalf of The Forgotten Formula PMA, a Private Membership Association, by its duly authorized Trustee:
Signature: ___________
Printed Name: ___________
Title: Trustee, The Forgotten Formula PMA
Date: ___________



ACCEPTANCE — [CLINIC NAME PMA] (AFFILIATED CLINIC ASSOCIATION)
Accepted on behalf of [CLINIC NAME PMA], a Private Membership Association affiliated with the Forgotten Formula PMA Network:
Clinic Name: ___________
Signature: ___________
Printed Name: ___________
Title: ___________
Date: ___________



This document is a private membership agreement issued within the private domain. It is not a public contract, public health record, or public commercial agreement. All rights reserved.



The Forgotten Formula PMA | P.O. Box 147, Justin TX 76247 | Tel 940.597.0117 | accounting@forgottenformula.com Contract Version: FFPMA-UMC-4.0 | Effective: February 19, 2026 | Supersedes: All Prior Versions`;

interface ReviewFinding {
  clause: string;
  severity: 'critical' | 'warning' | 'suggestion';
  issue: string;
  recommendation: string;
  legalBasis?: string;
}

interface AgentReview {
  agentId: string;
  agentName: string;
  reviewArea: string;
  findings: ReviewFinding[];
  summary: string;
  timestamp: Date;
  model: string;
}

interface ContractReviewReport {
  contractVersion: string;
  reviewDate: Date;
  coordinatedBy: string;
  agentReviews: AgentReview[];
  consolidatedFindings: ReviewFinding[];
  overallAssessment: string;
  prioritizedEdits: string[];
  status: 'pending' | 'in_progress' | 'completed';
}

let latestReview: ContractReviewReport | null = loadReviewFromFile();
let reviewInProgress = false;

export async function getLatestReview(): Promise<ContractReviewReport | null> {
  if (!latestReview) {
    latestReview = loadReviewFromFile();
  }
  return latestReview;
}

export function isReviewInProgress(): boolean {
  return reviewInProgress;
}

export async function initiateContractReview(): Promise<ContractReviewReport> {
  if (reviewInProgress) {
    throw new Error('A contract review is already in progress');
  }

  reviewInProgress = true;

  const report: ContractReviewReport = {
    contractVersion: 'FFPMA-UMC-4.0 — Unified Membership Contract',
    reviewDate: new Date(),
    coordinatedBy: 'SENTINEL',
    agentReviews: [],
    consolidatedFindings: [],
    overallAssessment: '',
    prioritizedEdits: [],
    status: 'in_progress',
  };

  latestReview = report;

  await sentinel.notify({
    type: 'system_broadcast',
    title: 'Contract Review V4 Initiated',
    message: 'SENTINEL coordinating legal review of Unified Membership Contract V4. Activating JURIS, LEXICON, AEGIS, SCRIBE.',
    agentId: 'SENTINEL',
    division: 'executive',
    priority: 1,
  });

  const PMA_FRAMEWORK_CONTEXT = `
CRITICAL CONTEXT — YOU MUST UNDERSTAND THIS BEFORE REVIEWING:

This is a Private Membership Association (PMA) contract. A PMA is NOT a regulated healthcare entity. It operates in the PRIVATE DOMAIN under the First and Fourteenth Amendments to the U.S. Constitution. Your review must be grounded in this reality:

1. PMA CONSTITUTIONAL AUTHORITY: Private membership associations have over a century of case law supporting their right to operate outside public regulatory frameworks. The same constitutional principle that allows private country clubs to hold liquor licenses in "dry" counties — after Prohibition was repealed and localities restricted public alcohol sales — applies here. Private clubs were fine to operate because they weren't public. Same principle, different goods and services.

2. HIPAA DOES NOT APPLY: HIPAA applies to "covered entities" (45 C.F.R. §160.103) — healthcare providers who electronically transmit health information for insurance billing. This PMA does not do electronic insurance billing. It is a NON-COVERED ENTITY. Do NOT flag anything as a HIPAA issue. The HIPAA section in this contract correctly explains non-covered entity status — that is accurate and intentional.

3. NOT JUST MEDICAL: The Forgotten Formula PMA is a multi-industry association. It manufactures supplements and hyperbaric chambers, produces its own injectables, offers stem cell services, provides concierge services internationally, and plans to expand into agricultural robotics, food systems, and mineral production. Do NOT treat this as a medical practice subject to medical regulations. It is a private association with diverse operations.

4. CONTRACTED EXPERTISE MODEL: When the PMA engages licensed practitioners, they are independently contracted professionals — like hiring a plumber. The license belongs to them, regulated by the state. The PMA contracts their expertise. This is the constitutional right to contract, not an extension of the public healthcare system.

5. WHY PMA CASES HAVE LOST (AND WHY THIS ONE IS DIFFERENT): State case law losses for PMAs came from: (a) advertising publicly — breaking the private domain, (b) taking public walk-ins — becoming indistinguishable from a public practice, (c) defying court orders — giving courts grounds to enforce regardless of constitutional merit. This PMA maintains strict private domain integrity with universal membership requirements and no public advertising.

6. YOUR ROLE: Provide PRACTICAL, COMMON-SENSE analysis. Flag genuine legal risks with SOLUTIONS. Do NOT go down regulatory rabbit holes. Do NOT pattern-match "healthcare = regulated." Do NOT write a treatise. Stay in YOUR LANE — only review what you're assigned. If something strengthens the document (like future state addendums as clinics onboard), suggest it. If something is already solid, say so and move on.

7. STATE ADDENDUMS: Flag any areas where state-specific addendums may be needed as clinics come online in different jurisdictions — but these go in separate clinic onboarding documents, NOT in this master contract.
`;

  const reviewAssignments = [
    {
      agentId: 'JURIS',
      title: 'Constitutional Authority & PMA Structure Review — FFPMA-UMC-4.0',
      reviewArea: 'Constitutional Authority & PMA Structure Validity',
      prompt: `You are JURIS, Lead Legal Counsel at Forgotten Formula PMA.

${PMA_FRAMEWORK_CONTEXT}

YOUR LANE — CONSTITUTIONAL AUTHORITY & PMA STRUCTURE ONLY:
You are reviewing ONLY the constitutional foundation and PMA structural validity of this revised contract (FFPMA-UMC-4.0). Do NOT review privacy language, document formatting, or risk/liability — those belong to other agents.

ANALYZE:
1. Section I — Constitutional Foundation: Is the case law cited accurately? Are the 1st and 14th Amendment claims properly framed for a multi-industry PMA (not just healthcare)? Any gaps in the constitutional argument?
2. Section II — Mother/Child PMA structure: Does the affiliate model clearly distinguish from franchise? Is the entity separation language sufficient to prevent veil-piercing? Does §2.3 money flow clause adequately protect against commingling claims?
3. Section II §2.1 — Contracted expertise model: Is the "like contracting a plumber" framing legally sound? Does it properly separate practitioner licensure from PMA operations?
4. Overall constitutional posture: Is this contract structured to maintain private domain integrity? Any areas where the language could inadvertently invite regulatory jurisdiction?
5. State addendum needs: Flag any constitutional or structural areas where specific states may require addendum language when clinics onboard.

Keep findings focused and practical. If something is solid, say it's solid. Provide solutions, not fear.

RESPOND IN VALID JSON FORMAT:
{
  "findings": [{"clause": "...", "severity": "critical|warning|suggestion", "issue": "...", "recommendation": "...", "legalBasis": "..."}],
  "summary": "..."
}`,
    },
    {
      agentId: 'LEXICON',
      title: 'Language Precision & Enforceability Review — FFPMA-UMC-4.0',
      reviewArea: 'Language Precision & Clause Enforceability',
      prompt: `You are LEXICON, Language & Terminology Specialist at Forgotten Formula PMA.

${PMA_FRAMEWORK_CONTEXT}

YOUR LANE — LANGUAGE PRECISION & ENFORCEABILITY ONLY:
You are reviewing ONLY the precision, clarity, and enforceability of the contract language. Do NOT review constitutional structure, document formatting, or risk analysis — those belong to other agents.

ANALYZE:
1. Section V — Privacy & Health Information: The HIPAA section has been rewritten to correctly state non-covered entity status based on 45 C.F.R. §160.103. Review the language for accuracy and clarity — NOT to re-litigate whether HIPAA applies (it doesn't). Is the licensed-practitioner carve-out in §5.2 clear?
2. Section V §5.3 — Privacy commitment: The "except as required by valid legal process" language now specifies court orders, subpoenas, and mandatory reporting. Is this precise enough? Any ambiguity?
3. Section IV — Assumption of Risk and Limited Liability: The waiver now explicitly excludes gross negligence, intentional misconduct, fraud, and criminal conduct. Is this language enforceable across jurisdictions?
4. Section III §3.3 — Freedom of Healthcare Choice: Review the modality language for any terms that could create unintended regulatory hooks.
5. Overall language quality: Any vague terms, ambiguous phrases, or internally contradictory language? Flag with specific fixes.

Be practical. This is a membership contract, not a legal treatise. Clear, enforceable language is the goal.

RESPOND IN VALID JSON FORMAT:
{
  "findings": [{"clause": "...", "severity": "critical|warning|suggestion", "issue": "...", "recommendation": "...", "legalBasis": "..."}],
  "summary": "..."
}`,
    },
    {
      agentId: 'AEGIS',
      title: 'Risk Exposure & Liability Protection Review — FFPMA-UMC-4.0',
      reviewArea: 'Risk Exposure & Liability Protection',
      prompt: `You are AEGIS, Compliance & Shield Operations Specialist at Forgotten Formula PMA.

${PMA_FRAMEWORK_CONTEXT}

YOUR LANE — RISK EXPOSURE & LIABILITY PROTECTION ONLY:
You are reviewing ONLY the risk exposure and liability protection aspects. Do NOT review constitutional arguments, language precision, or document structure — those belong to other agents.

ANALYZE:
1. Section IV — Assumption of Risk & Limited Liability: The hold harmless now waives ordinary negligence but NOT gross negligence/intentional misconduct/fraud/criminal conduct. Is this the right balance for a PMA? Will courts enforce the ordinary negligence waiver in this context?
2. Section II §2.2 — Entity separation / veil-piercing risk: The contract states each Child PMA has its own EIN, Articles, Bylaws, and independent governance. Is this sufficient to prevent a plaintiff from piercing through to the Mother PMA? What operational practices should supplement this language?
3. Section III §3.5 — Universal Membership Requirement: The exceptions for emergency responders, government officials with legal process, and delivery/maintenance personnel — are these comprehensive enough? Any scenarios missed?
4. Section IV — Licensed Practitioners clause: Does the contracted expertise model adequately shield the PMA from vicarious liability for practitioner actions?
5. State-specific risk: Flag any states where PMA protections are notably weaker or where specific addendum language would strengthen the risk posture when clinics onboard.

Focus on practical risk reduction. What makes this contract STRONGER, not what makes lawyers nervous. Solutions, not rabbit holes.

RESPOND IN VALID JSON FORMAT:
{
  "findings": [{"clause": "...", "severity": "critical|warning|suggestion", "issue": "...", "recommendation": "...", "legalBasis": "..."}],
  "summary": "..."
}`,
    },
    {
      agentId: 'SCRIBE',
      title: 'Document Structure & Mechanics Review — FFPMA-UMC-4.0',
      reviewArea: 'Document Structure, Signatures & Version Control',
      prompt: `You are SCRIBE, Document & Records Specialist at Forgotten Formula PMA.

${PMA_FRAMEWORK_CONTEXT}

YOUR LANE — DOCUMENT STRUCTURE & MECHANICS ONLY:
You are reviewing ONLY the document structure, signature mechanics, and version control. Do NOT review constitutional arguments, privacy language, or risk analysis — those belong to other agents.

ANALYZE:
1. Overall document flow: Is the section ordering logical and professional? Declaration → Constitutional Foundation → Structure → Rights → Acknowledgments → Privacy → Term/Disputes → Entire Agreement → Initials → Signatures. Does this flow work?
2. Section VII — Member Acknowledgment checkboxes: The 5 checkbox initials before signing — are they clear, complete, and protective? Do they adequately address the "I didn't understand" defense? Any additions needed?
3. Signature Block: The Trustee printed name field is now blank (to be filled in at signing). Three-party signature structure (Member, Mother PMA Trustee, Clinic Rep). Is this mechanically sound for execution?
4. Version control: Contract is now versioned as FFPMA-UMC-4.0 with effective date February 2026 and "Supersedes: All Prior Versions." Is this versioning system clean?
5. Section VI — Dispute Resolution mechanics: 30-day written notice → 5 business day acknowledgment → 30-day informal resolution → AAA binding arbitration in Denton County TX → class action waiver. Review the procedural mechanics — are the timelines realistic? Any gaps in the process?
6. Missing elements: Any standard contract boilerplate that should be added? Note: severability, governing law, amendments, and entire agreement clauses are already present.

Keep it practical. This document needs to be signable by regular people at a clinic front desk — clean, professional, not intimidating.

RESPOND IN VALID JSON FORMAT:
{
  "findings": [{"clause": "...", "severity": "critical|warning|suggestion", "issue": "...", "recommendation": "...", "legalBasis": "..."}],
  "summary": "..."
}`,
    },
  ];

  const reviewPromises = reviewAssignments.map(async (assignment) => {
    try {
      const task = await orchestrator.assignTask({
        agentId: assignment.agentId,
        title: assignment.title,
        description: assignment.reviewArea,
        priority: 1,
        evidenceType: 'analysis_report',
        assignedBy: 'SENTINEL',
      });

      const result = await claudeAnalyze(
        assignment.prompt,
        UNIFIED_CONTRACT_V4,
        assignment.agentId
      );

      let findings: ReviewFinding[] = [];
      let summary = '';

      try {
        const jsonMatch = result.analysis.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          findings = (parsed.findings || []).map((f: any) => ({
            clause: f.clause || 'General',
            severity: f.severity || 'suggestion',
            issue: f.issue || '',
            recommendation: f.recommendation || '',
            legalBasis: f.legalBasis || '',
          }));
          summary = parsed.summary || '';
        }
      } catch (parseError) {
        summary = result.analysis;
        findings = [{
          clause: 'General Review',
          severity: 'suggestion',
          issue: 'See full analysis below',
          recommendation: result.analysis.substring(0, 500),
        }];
      }

      await db.update(agentTasks).set({
        status: 'completed',
        completedAt: new Date(),
        progress: 100,
        evidenceNotes: `Contract V4 review completed. ${findings.length} findings.`,
        updatedAt: new Date(),
      }).where(eq(agentTasks.id, task.id));

      const agentReview: AgentReview = {
        agentId: assignment.agentId,
        agentName: assignment.agentId,
        reviewArea: assignment.reviewArea,
        findings,
        summary,
        timestamp: new Date(),
        model: result.model,
      };

      return agentReview;
    } catch (error: any) {
      console.error(`[${assignment.agentId}] Review failed: ${error.message}`);
      return {
        agentId: assignment.agentId,
        agentName: assignment.agentId,
        reviewArea: assignment.reviewArea,
        findings: [{
          clause: 'Error',
          severity: 'warning' as const,
          issue: `Review could not be completed: ${error.message}`,
          recommendation: 'Retry the review or consult manually.',
        }],
        summary: `Review encountered an error: ${error.message}`,
        timestamp: new Date(),
        model: 'error',
      } as AgentReview;
    }
  });

  const agentReviews = await Promise.all(reviewPromises);

  const allFindings = agentReviews.flatMap(r =>
    r.findings.map(f => ({ ...f, agentId: r.agentId }))
  );

  const severityOrder = { critical: 0, warning: 1, suggestion: 2 };
  const sortedFindings = allFindings.sort((a, b) =>
    (severityOrder[a.severity] || 2) - (severityOrder[b.severity] || 2)
  );

  const criticalEdits = sortedFindings
    .filter(f => f.severity === 'critical')
    .map(f => `[CRITICAL] ${f.clause}: ${f.issue}`);
  const warningEdits = sortedFindings
    .filter(f => f.severity === 'warning')
    .map(f => `[WARNING] ${f.clause}: ${f.issue}`);

  const criticalCount = sortedFindings.filter(f => f.severity === 'critical').length;
  const warningCount = sortedFindings.filter(f => f.severity === 'warning').length;
  const suggestionCount = sortedFindings.filter(f => f.severity === 'suggestion').length;

  report.agentReviews = agentReviews;
  report.consolidatedFindings = sortedFindings;
  report.prioritizedEdits = [...criticalEdits, ...warningEdits];
  report.overallAssessment = `Contract V4 Legal Review Complete. ${agentReviews.length} agents reviewed. Found ${criticalCount} critical issues, ${warningCount} warnings, and ${suggestionCount} suggestions. ${criticalCount > 0 ? 'Critical issues require immediate attention before deployment.' : 'No critical issues found.'}`;
  report.status = 'completed';

  reviewInProgress = false;
  latestReview = report;
  saveReviewToFile(report);

  await sentinel.notify({
    type: 'task_completed',
    title: 'Contract V4 Legal Review Complete',
    message: report.overallAssessment,
    agentId: 'SENTINEL',
    division: 'executive',
    priority: 1,
  });

  console.log(`[SENTINEL] Contract V4 review complete: ${criticalCount} critical, ${warningCount} warnings, ${suggestionCount} suggestions`);

  return report;
}
