import { callWithFallback } from "./ai-fallback";

export interface ClinicPMAData {
  clinicName: string;
  pmaName: string;
  state: string;
  city: string;
  address: string;
  practiceType: string;
  officers: Array<{ fullName: string; role: string; email?: string }>;
  governanceRules?: {
    meetingSchedule?: string;
    votingProcedure?: string;
    memberAdmission?: string;
    quorumRequirement?: string;
  };
}

export async function generateArticlesOfAssociation(data: ClinicPMAData): Promise<string> {
  const officerList = data.officers.map(o => `${o.fullName} — ${o.role}`).join("\n");
  const prompt = `Generate the Articles of Association for a Private Membership Association (PMA) with the following details:

PMA Name: ${data.pmaName}
Clinic Name: ${data.clinicName}
State: ${data.state}
City: ${data.city}
Address: ${data.address}
Practice Type: ${data.practiceType}

Officers:
${officerList}

This PMA is an Affiliated Clinic Association (Child PMA) of the Forgotten Formula PMA (Mother PMA), operating under constitutional authority — specifically the 1st Amendment (freedom of association) and the 14th Amendment (due process and equal protection).

Generate a complete, legally formatted Articles of Association document with these sections:
1. ARTICLE I: NAME AND PURPOSE — The association's full legal name and its purpose of providing holistic health services within a private domain
2. ARTICLE II: CONSTITUTIONAL AUTHORITY — Reference to 1st and 14th Amendment protections, private domain declaration
3. ARTICLE III: MEMBERSHIP — $10.00 membership fee requirement, member rights and responsibilities, everyone within clinic walls must be signed members
4. ARTICLE IV: OFFICERS AND GOVERNANCE — List all officers with their roles, election/appointment procedures
5. ARTICLE V: AFFILIATION WITH MOTHER PMA — Constitutional affiliation with Forgotten Formula PMA, adherence to FF PMA 8 Rules
6. ARTICLE VI: MEETINGS — Regular meeting schedule, quorum requirements, voting procedures
7. ARTICLE VII: AMENDMENTS — Process for amending these Articles
8. ARTICLE VIII: DISSOLUTION — Process for dissolving the association and distributing assets
9. ARTICLE IX: INDEMNIFICATION — Officer and member liability protections
10. SIGNATURE BLOCKS — For all officers listed

Format as a professional legal document with proper headers, numbered sections, and formal language. Include the date and location. Do NOT include any medical claims or treatment descriptions.`;

  const result = await callWithFallback(prompt, {
    callType: "document-generation" as any,
    startTier: "standard",
  });

  return result.response;
}

export async function generateBylaws(data: ClinicPMAData): Promise<string> {
  const officerList = data.officers.map(o => `${o.fullName} — ${o.role}`).join("\n");
  const meetingSchedule = data.governanceRules?.meetingSchedule || "Monthly on the first Monday";
  const votingProcedure = data.governanceRules?.votingProcedure || "Simple majority of officers present";
  const memberAdmission = data.governanceRules?.memberAdmission || "Application, $10.00 fee, and signed Member Contract";
  const quorum = data.governanceRules?.quorumRequirement || "Majority of officers";

  const prompt = `Generate the Bylaws for a Private Membership Association (PMA) with the following details:

PMA Name: ${data.pmaName}
Clinic Name: ${data.clinicName}
State: ${data.state}
City: ${data.city}
Practice Type: ${data.practiceType}

Officers:
${officerList}

Meeting Schedule: ${meetingSchedule}
Voting Procedure: ${votingProcedure}
Member Admission Policy: ${memberAdmission}
Quorum Requirement: ${quorum}

This PMA is an Affiliated Clinic Association of the Forgotten Formula PMA, operating under constitutional authority.

Generate complete Bylaws with these sections:
1. ARTICLE I: NAME AND OFFICES — Registered office and principal place of business
2. ARTICLE II: PURPOSE — Holistic health services within private domain under constitutional protection
3. ARTICLE III: MEMBERSHIP — Classes of membership, admission process, $10.00 fee, rights, termination
4. ARTICLE IV: MEETINGS OF MEMBERS — Regular meetings, special meetings, notice requirements, quorum, voting
5. ARTICLE V: OFFICERS — Titles, duties, election, removal, vacancies (Trustee, Secretary, Treasurer at minimum)
6. ARTICLE VI: DUTIES OF OFFICERS — Specific responsibilities for each officer role
7. ARTICLE VII: COMMITTEES — Standing and special committees, appointment, authority
8. ARTICLE VIII: FINANCIAL MATTERS — Fiscal year, banking, signing authority, financial reporting
9. ARTICLE IX: RECORDS AND REPORTS — Record keeping requirements, annual reports, member inspection rights
10. ARTICLE X: AMENDMENTS — Process for amending bylaws, notice requirements, voting threshold
11. ARTICLE XI: COMPLIANCE WITH MOTHER PMA — Adherence to FF PMA 8 Rules, reporting obligations
12. ARTICLE XII: DISSOLUTION — Process and asset distribution

Format as a professional legal document. Do NOT include medical claims.`;

  const result = await callWithFallback(prompt, {
    callType: "document-generation" as any,
    startTier: "standard",
  });

  return result.response;
}

export function generateUnifiedMembershipContract(data: ClinicPMAData): string {
  const trusteeName = data.officers.find(o => o.role.toLowerCase().includes("trustee"))?.fullName || data.officers[0]?.fullName || "[TRUSTEE NAME]";
  return `
UNIFIED MEMBERSHIP CONTRACT
FFPMA-UMC-2.0

FORGOTTEN FORMULA PMA — AFFILIATED CLINIC ASSOCIATION
${data.pmaName}

EFFECTIVE DATE: _______________

---

PARTIES:

1. THE ASSOCIATION: ${data.pmaName}, an unincorporated Private Membership Association operating under the constitutional protections of the 1st and 14th Amendments to the United States Constitution, with its principal office located at ${data.address}, ${data.city}, ${data.state}.

2. THE MEMBER: _________________________________ ("Member")

---

ARTICLE I: DECLARATION OF PURPOSE

The Member voluntarily seeks to join ${data.pmaName}, a constitutionally protected Private Membership Association affiliated with the Forgotten Formula PMA (Mother PMA). The Member understands that this Association operates within the private domain and is not subject to public regulatory jurisdiction.

ARTICLE II: MEMBERSHIP FEE

The Member agrees to pay a non-refundable membership fee of TEN DOLLARS ($10.00) to ${data.pmaName}. This fee is the legal gatekeeper that establishes the private contractual relationship between the Member and the Association. Without this paid membership, there is no private domain, no contractual standing, and no legal protection.

ARTICLE III: MEMORANDUM OF UNDERSTANDING

The Member acknowledges and agrees that:
a) All services, products, and information provided within the Association are offered within the private domain
b) The Association operates under constitutional authority, not state regulatory jurisdiction
c) The Member waives any right to file complaints with public regulatory agencies regarding private Association activities
d) All disputes shall be resolved through binding arbitration in accordance with the Association's Bylaws

ARTICLE IV: PRIVACY AND HIPAA WAIVER

The Member voluntarily waives HIPAA protections with respect to health information shared within the Association. The Member understands that health information shared within the private domain is protected by the Association's privacy policies, not by public regulatory frameworks.

ARTICLE V: PRIVATE DOMAIN DECLARATION

The Member acknowledges that upon signing this Contract and paying the membership fee, they are entering a private domain. All interactions, services, and products within this domain are private matters between consenting adults exercising their constitutional rights of free association.

ARTICLE VI: MOTHER PMA AFFILIATION

The Member acknowledges that ${data.pmaName} operates as a constitutional affiliate of the Forgotten Formula PMA. The Member agrees to abide by the 8 Rules established by the Mother PMA, including but not limited to the mandatory $10.00 membership fee, universal signing requirement, and use of approved contract templates.

ARTICLE VII: TERMINATION

Either party may terminate this membership with 30 days written notice. Upon termination, the Member's access to Association services shall cease.

---

SIGNATURES:

Member: _________________________________ Date: _______________
Print Name: _________________________________

Authorized Officer: _________________________________ Date: _______________
Print Name: ${trusteeName}
Title: Trustee, ${data.pmaName}

Witness: _________________________________ Date: _______________
Print Name: _________________________________
`.trim();
}

export function generateNetworkAffiliationAgreement(data: ClinicPMAData): string {
  const trusteeName = data.officers.find(o => o.role.toLowerCase().includes("trustee"))?.fullName || data.officers[0]?.fullName || "[TRUSTEE NAME]";
  return `
NETWORK AFFILIATION AGREEMENT
FFPMA-NAA-1.0

BETWEEN:
1. FORGOTTEN FORMULA PMA ("Mother PMA"), an unincorporated Private Membership Association, Justin, TX 76247
2. ${data.pmaName} ("Affiliated Clinic Association"), ${data.city}, ${data.state}

EFFECTIVE DATE: _______________

---

ARTICLE I: PURPOSE OF AFFILIATION

This Agreement establishes ${data.pmaName} as a constitutional affiliate of the Forgotten Formula PMA network. The Affiliated Clinic Association operates as an independent, self-governing entity while maintaining constitutional affiliation with the Mother PMA.

ARTICLE II: CONSTITUTIONAL FOUNDATION

Both parties affirm that this affiliation is established under the protections of:
- The 1st Amendment to the United States Constitution (Freedom of Association)
- The 14th Amendment to the United States Constitution (Due Process and Equal Protection)

This affiliation is a private, voluntary, constitutional arrangement — not a corporate subsidiary, franchise, or licensing agreement.

ARTICLE III: OBLIGATIONS OF THE AFFILIATED CLINIC ASSOCIATION

${data.pmaName} agrees to:
a) Maintain strict adherence to the Forgotten Formula PMA 8 Rules
b) Collect the mandatory $10.00 membership fee from every member without exception
c) Require signed Member Contracts from every person within the private domain
d) Use only approved document templates (Articles, Bylaws, Member Contracts)
e) File IRS Form 8832 independently to elect corporate tax classification
f) File IRS Form 1120 annually at the 21% corporate tax rate
g) Maintain complete and accurate records of all members and financial transactions
h) Protect the intellectual property of the Forgotten Formula PMA network

ARTICLE IV: OBLIGATIONS OF THE MOTHER PMA

The Forgotten Formula PMA agrees to:
a) Provide approved legal document templates
b) Provide guidance on EIN application, tax filings, and banking setup
c) Provide access to the ALLIO platform and AI-powered tools
d) Provide the PMA Filing Manager for document generation and compliance tracking
e) Provide the PMA Defender AI for real-time legal guidance
f) Maintain the constitutional framework that protects all affiliated associations

ARTICLE V: INDEPENDENCE

The Affiliated Clinic Association maintains full independence in:
- Day-to-day operations and clinical decisions
- Officer selection and internal governance
- Financial management and banking
- Member admission (within the framework of the 8 Rules)

The Mother PMA does NOT:
- Control clinical operations
- Employ the Affiliated Clinic Association's staff
- Share in the Affiliated Clinic Association's revenue
- Appear on the Affiliated Clinic Association's tax filings

ARTICLE VI: INTELLECTUAL PROPERTY

All templates, frameworks, and operational documents provided by the Mother PMA remain the intellectual property of Forgotten Formula PMA. These materials shall not be shared outside the PMA network.

ARTICLE VII: TERMINATION

Either party may terminate this Agreement with 60 days written notice. Upon termination, the Affiliated Clinic Association must cease using Forgotten Formula PMA templates and branding.

ARTICLE VIII: DISPUTE RESOLUTION

Disputes shall be resolved through binding arbitration in Denton County, Texas.

---

SIGNATURES:

For the Mother PMA:
Michael Blake, Trustee — Forgotten Formula PMA
Signature: _________________________________ Date: _______________

For the Affiliated Clinic Association:
${trusteeName}, Trustee — ${data.pmaName}
Signature: _________________________________ Date: _______________
`.trim();
}

export async function generatePMADefenderResponse(question: string, context?: string): Promise<string> {
  const prompt = `You are the PMA Defender — the AI legal guidance assistant for the Forgotten Formula PMA network. You provide guidance on Private Membership Association law, constitutional protections, compliance, and operational questions.

IMPORTANT RULES:
- You provide LEGAL GUIDANCE within the PMA framework, not licensed legal advice
- Reference the 1st Amendment (Freedom of Association) and 14th Amendment (Due Process) as the constitutional foundation
- Always emphasize the importance of the $10.00 membership fee as the legal gatekeeper
- Always emphasize that EVERYONE within the private domain must be a signed, dues-paying member
- Reference the 8 PMA Rules when relevant
- For tax questions, reference Form 8832 (Entity Classification Election) and Form 1120
- For banking questions, advise on opening accounts as an unincorporated association
- Never provide advice that contradicts the Mother PMA framework
- Keep answers practical, actionable, and specific to PMAs

${context ? `Context about the clinic: ${context}` : ""}

Question from a clinic owner/officer: ${question}

Provide a clear, detailed answer:`;

  const result = await callWithFallback(prompt, {
    callType: "document-generation" as any,
    startTier: "economy",
  });

  return result.response;
}
