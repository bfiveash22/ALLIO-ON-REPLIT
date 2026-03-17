import { db } from "../db";
import { clinicNodes, clinicNodeEvents, globalJurisdictions, nodeReplicationLogs } from "@shared/schema";
import { eq, desc, and, lt, sql, isNull } from "drizzle-orm";
import { randomBytes, createHash } from "crypto";

function generateNodeApiKey(): string {
  return randomBytes(32).toString("hex");
}

function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

const HEARTBEAT_TIMEOUT_MS = 5 * 60 * 1000;
const DEGRADED_THRESHOLD_MS = 2 * 60 * 1000;

export interface NodeHealthSummary {
  totalNodes: number;
  online: number;
  degraded: number;
  offline: number;
  provisioning: number;
  decommissioned: number;
  avgReplicationLag: number;
  lastGlobalSync: string | null;
}

export interface FailoverAction {
  sourceNodeId: string;
  targetNodeId: string;
  reason: string;
  triggeredAt: string;
  membersAffected: number;
}

export async function getAllNodes() {
  return db.select().from(clinicNodes).orderBy(desc(clinicNodes.isPrimary), clinicNodes.region);
}

export async function getNodeById(id: string) {
  const [node] = await db.select().from(clinicNodes).where(eq(clinicNodes.id, id));
  return node || null;
}

export async function getNodeByIdentifier(identifier: string) {
  const [node] = await db.select().from(clinicNodes).where(eq(clinicNodes.nodeIdentifier, identifier));
  return node || null;
}

export async function registerNode(data: {
  clinicId?: string;
  nodeIdentifier: string;
  displayName: string;
  region: string;
  jurisdictionId?: string;
  endpoint?: string;
  version?: string;
  isPrimary?: boolean;
  failoverPriority?: number;
}): Promise<{ node: typeof clinicNodes.$inferSelect; apiKey: string }> {
  const rawApiKey = generateNodeApiKey();
  const hashedKey = hashApiKey(rawApiKey);

  const [node] = await db.insert(clinicNodes).values({
    ...data,
    status: "provisioning",
    replicationState: "stale",
    configHash: hashedKey,
    provisionedAt: new Date(),
  }).returning();

  await logNodeEvent(node.id, "node_registered", "info", `Node ${data.displayName} registered in region ${data.region}`);
  return { node, apiKey: rawApiKey };
}

export async function updateNodeStatus(nodeId: string, status: "online" | "degraded" | "offline" | "provisioning" | "decommissioned") {
  const [updated] = await db.update(clinicNodes)
    .set({ status, updatedAt: new Date() })
    .where(eq(clinicNodes.id, nodeId))
    .returning();

  if (status === "decommissioned") {
    await db.update(clinicNodes)
      .set({ decommissionedAt: new Date() })
      .where(eq(clinicNodes.id, nodeId));
  }

  await logNodeEvent(nodeId, "status_change", status === "offline" ? "critical" : "info", `Node status changed to ${status}`);
  return updated;
}

export interface HeartbeatMetrics {
  cpuUsage?: number;
  memoryUsage?: number;
  diskUsage?: number;
  activeConnections?: number;
  memberCount?: number;
  version?: string;
  replicationLag?: number;
}

export async function processHeartbeat(nodeIdentifier: string, metrics: HeartbeatMetrics) {
  const node = await getNodeByIdentifier(nodeIdentifier);
  if (!node) return null;

  const now = new Date();
  let newStatus: "online" | "degraded" = "online";

  if (
    (metrics.cpuUsage && metrics.cpuUsage > 90) ||
    (metrics.memoryUsage && metrics.memoryUsage > 90) ||
    (metrics.diskUsage && metrics.diskUsage > 95) ||
    (metrics.replicationLag && metrics.replicationLag > 300)
  ) {
    newStatus = "degraded";
  }

  const replicationState = metrics.replicationLag === 0
    ? "synced" as const
    : (metrics.replicationLag && metrics.replicationLag > 600)
      ? "stale" as const
      : "syncing" as const;

  const [updated] = await db.update(clinicNodes).set({
    status: newStatus,
    lastHeartbeatAt: now,
    cpuUsage: metrics.cpuUsage?.toString(),
    memoryUsage: metrics.memoryUsage?.toString(),
    diskUsage: metrics.diskUsage?.toString(),
    activeConnections: metrics.activeConnections,
    memberCount: metrics.memberCount,
    version: metrics.version,
    replicationLag: metrics.replicationLag,
    replicationState,
    updatedAt: now,
  }).where(eq(clinicNodes.id, node.id)).returning();

  return updated;
}

export async function checkForFailover(): Promise<FailoverAction[]> {
  const now = new Date();
  const timeoutThreshold = new Date(now.getTime() - HEARTBEAT_TIMEOUT_MS);
  const degradedThreshold = new Date(now.getTime() - DEGRADED_THRESHOLD_MS);

  const staleNodes = await db.select().from(clinicNodes).where(
    and(
      lt(clinicNodes.lastHeartbeatAt, timeoutThreshold),
      eq(clinicNodes.status, "online")
    )
  );

  const degradedNodes = await db.select().from(clinicNodes).where(
    and(
      lt(clinicNodes.lastHeartbeatAt, degradedThreshold),
      eq(clinicNodes.status, "online")
    )
  );

  for (const node of degradedNodes) {
    if (!staleNodes.find(s => s.id === node.id)) {
      await updateNodeStatus(node.id, "degraded");
    }
  }

  const failoverActions: FailoverAction[] = [];

  for (const node of staleNodes) {
    await updateNodeStatus(node.id, "offline");

    const failoverTarget = node.failoverTargetId
      ? await getNodeById(node.failoverTargetId)
      : null;

    let target = failoverTarget;
    if (!target || target.status !== "online") {
      const availableNodes = await db.select().from(clinicNodes).where(
        and(
          eq(clinicNodes.status, "online"),
          eq(clinicNodes.canAcceptFailover, true)
        )
      );

      const sameRegion = availableNodes.filter(n => n.region === node.region);
      target = sameRegion.length > 0
        ? sameRegion.sort((a, b) => (a.failoverPriority ?? 100) - (b.failoverPriority ?? 100))[0]
        : availableNodes.sort((a, b) => (a.failoverPriority ?? 100) - (b.failoverPriority ?? 100))[0];
    }

    if (target) {
      failoverActions.push({
        sourceNodeId: node.id,
        targetNodeId: target.id,
        reason: `Node ${node.displayName} failed heartbeat check (last seen: ${node.lastHeartbeatAt?.toISOString()})`,
        triggeredAt: now.toISOString(),
        membersAffected: node.memberCount ?? 0,
      });

      await logNodeEvent(node.id, "failover_triggered", "critical",
        `Failover initiated: traffic redirected to ${target.displayName}`,
        { sourceNode: node.nodeIdentifier, targetNode: target.nodeIdentifier, membersAffected: node.memberCount }
      );

      await logNodeEvent(target.id, "failover_accepted", "warning",
        `Accepting failover traffic from ${node.displayName}`,
        { sourceNode: node.nodeIdentifier, membersAffected: node.memberCount }
      );
    } else {
      await logNodeEvent(node.id, "failover_failed", "critical",
        `No available failover target for offline node ${node.displayName}`,
        { region: node.region }
      );
    }
  }

  return failoverActions;
}

export async function getNodeHealthSummary(): Promise<NodeHealthSummary> {
  const nodes = await getAllNodes();
  const online = nodes.filter(n => n.status === "online").length;
  const degraded = nodes.filter(n => n.status === "degraded").length;
  const offline = nodes.filter(n => n.status === "offline").length;
  const provisioning = nodes.filter(n => n.status === "provisioning").length;
  const decommissioned = nodes.filter(n => n.status === "decommissioned").length;

  const activeNodes = nodes.filter(n => n.status === "online" || n.status === "degraded");
  const avgReplicationLag = activeNodes.length > 0
    ? activeNodes.reduce((sum, n) => sum + (n.replicationLag ?? 0), 0) / activeNodes.length
    : 0;

  const lastSync = nodes
    .filter(n => n.lastSyncAt)
    .sort((a, b) => (b.lastSyncAt?.getTime() ?? 0) - (a.lastSyncAt?.getTime() ?? 0))[0];

  return {
    totalNodes: nodes.length,
    online,
    degraded,
    offline,
    provisioning,
    decommissioned,
    avgReplicationLag: Math.round(avgReplicationLag),
    lastGlobalSync: lastSync?.lastSyncAt?.toISOString() ?? null,
  };
}

export async function getNodeEvents(nodeId?: string, limit = 50) {
  if (nodeId) {
    return db.select().from(clinicNodeEvents)
      .where(eq(clinicNodeEvents.nodeId, nodeId))
      .orderBy(desc(clinicNodeEvents.createdAt))
      .limit(limit);
  }
  return db.select().from(clinicNodeEvents)
    .orderBy(desc(clinicNodeEvents.createdAt))
    .limit(limit);
}

export async function acknowledgeEvent(eventId: string, acknowledgedBy: string) {
  const [updated] = await db.update(clinicNodeEvents).set({
    acknowledgedAt: new Date(),
    acknowledgedBy,
  }).where(eq(clinicNodeEvents.id, eventId)).returning();
  return updated;
}

export async function logNodeEvent(
  nodeId: string,
  eventType: string,
  severity: string,
  message: string,
  details?: Record<string, string | number | boolean | null>
) {
  return db.insert(clinicNodeEvents).values({
    nodeId,
    eventType,
    severity,
    message,
    details: details || null,
  });
}

export async function getAllJurisdictions() {
  return db.select().from(globalJurisdictions).orderBy(desc(globalJurisdictions.healthFreedomScore));
}

export async function getJurisdictionById(id: string) {
  const [j] = await db.select().from(globalJurisdictions).where(eq(globalJurisdictions.id, id));
  return j || null;
}

export async function upsertJurisdiction(data: typeof globalJurisdictions.$inferInsert) {
  const existing = await db.select().from(globalJurisdictions)
    .where(eq(globalJurisdictions.countryCode, data.countryCode));

  if (existing.length > 0) {
    const [updated] = await db.update(globalJurisdictions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(globalJurisdictions.countryCode, data.countryCode))
      .returning();
    return updated;
  }

  const [created] = await db.insert(globalJurisdictions).values(data).returning();
  return created;
}

export async function getReplicationLogs(nodeId?: string, limit = 50) {
  if (nodeId) {
    return db.select().from(nodeReplicationLogs)
      .where(sql`${nodeReplicationLogs.sourceNodeId} = ${nodeId} OR ${nodeReplicationLogs.targetNodeId} = ${nodeId}`)
      .orderBy(desc(nodeReplicationLogs.startedAt))
      .limit(limit);
  }
  return db.select().from(nodeReplicationLogs)
    .orderBy(desc(nodeReplicationLogs.startedAt))
    .limit(limit);
}

export async function logReplication(data: {
  sourceNodeId: string;
  targetNodeId: string;
  tableName: string;
  recordCount: number;
  bytesTransferred: number;
  status: string;
  errorMessage?: string;
}) {
  return db.insert(nodeReplicationLogs).values({
    ...data,
    completedAt: data.status === "completed" ? new Date() : null,
  });
}

export async function seedJurisdictions() {
  type JurisdictionSeed = Omit<typeof globalJurisdictions.$inferInsert, "id" | "createdAt" | "updatedAt">;
  const jurisdictions: JurisdictionSeed[] = [
    {
      countryCode: "US",
      countryName: "United States of America",
      legalSystem: "Common Law (Federal/State)",
      constitutionalBasis: "1st Amendment (Freedom of Association - NAACP v. Alabama 1958, Roberts v. Jaycees 1984, Boy Scouts v. Dale 2000), 14th Amendment (Due Process - Meyer v. Nebraska 1923, Griswold v. Connecticut 1965), 9th Amendment (Unenumerated Rights), 10th Amendment (Reserved Powers/Commerce Clause limits)",
      associationFreedom: "Constitutionally Protected",
      healthFreedomScore: 92,
      pmaViability: "Established - Active PMAs operating nationwide",
      status: "active" as const,
      keyStatutes: [
        "Right to Try Act (2018)",
        "DSHEA (1994) - Dietary Supplement Health and Education Act",
        "State-level health freedom acts (multiple states)"
      ],
      caseReferences: [
        "NAACP v. Alabama (1958) - Freedom of Association",
        "Roberts v. United States Jaycees (1984) - Expressive Association",
        "Boy Scouts of America v. Dale (2000) - Private Membership Rights",
        "Gonzales v. Oregon (2006) - State Medical Practice Authority",
        "Meyer v. Nebraska (1923) - Personal Liberty/Due Process"
      ],
      riskFactors: [
        "FDA overreach on specific product claims",
        "State medical board challenges",
        "FTC advertising jurisdiction disputes"
      ],
      primaryLanguage: "English",
      timezone: "America/New_York",
      regulatoryBodies: ["FDA", "FTC", "State Medical Boards", "DEA"],
      dataPrivacyLaw: "HIPAA (voluntary for PMAs), State privacy laws",
      crossBorderDataRules: "No federal data localization requirement; HIPAA BAA for covered entities",
      researchedBy: "JURIS",
    },
    {
      countryCode: "GB",
      countryName: "United Kingdom",
      legalSystem: "Common Law",
      constitutionalBasis: "Human Rights Act 1998 (Article 11 - Freedom of Assembly and Association), Magna Carta principles, Unwritten constitution with Parliamentary sovereignty",
      associationFreedom: "Protected under ECHR Article 11",
      healthFreedomScore: 72,
      pmaViability: "Possible - Requires adaptation as 'Private Health Association'",
      status: "researching" as const,
      keyStatutes: [
        "Human Rights Act 1998",
        "Freedom of Association (ECHR Art. 11)",
        "Health and Safety at Work Act 1974",
        "Medicines Act 1968"
      ],
      caseReferences: [
        "Young, James and Webster v UK (1981) - Freedom of Association",
        "R (on the application of Countryside Alliance) v AG (2007)"
      ],
      riskFactors: [
        "MHRA regulation more restrictive than FDA",
        "NHS monopoly perception",
        "Post-Brexit regulatory uncertainty"
      ],
      primaryLanguage: "English",
      timezone: "Europe/London",
      regulatoryBodies: ["MHRA", "CQC", "GMC", "GPhC"],
      dataPrivacyLaw: "UK GDPR / Data Protection Act 2018",
      crossBorderDataRules: "Adequacy decision with EU; strict international transfer rules",
      researchedBy: "JURIS",
    },
    {
      countryCode: "CA",
      countryName: "Canada",
      legalSystem: "Common Law (except Quebec - Civil Law)",
      constitutionalBasis: "Canadian Charter of Rights and Freedoms Section 2(d) (Freedom of Association), Section 7 (Life, Liberty, Security of Person)",
      associationFreedom: "Charter-protected (Section 2d)",
      healthFreedomScore: 78,
      pmaViability: "Strong potential - Charter protections analogous to US 1st/14th Amendments",
      status: "researching" as const,
      keyStatutes: [
        "Canadian Charter of Rights and Freedoms (1982)",
        "Natural Health Products Regulations (2003)",
        "Food and Drugs Act",
        "Personal Information Protection and Electronic Documents Act (PIPEDA)"
      ],
      caseReferences: [
        "Dunmore v. Ontario (2001) - Freedom of Association",
        "Health Services v. BC (2007) - Collective Bargaining/Association Rights",
        "Chaoulli v. Quebec (2005) - Right to Private Healthcare"
      ],
      riskFactors: [
        "Provincial health regulation variation",
        "Health Canada enforcement",
        "Natural Health Products Directorate scrutiny"
      ],
      primaryLanguage: "English/French",
      timezone: "America/Toronto",
      regulatoryBodies: ["Health Canada", "Provincial Health Authorities", "College of Physicians"],
      dataPrivacyLaw: "PIPEDA / Provincial privacy laws",
      crossBorderDataRules: "PIPEDA requires adequate protection; cross-border transfer assessments required",
      researchedBy: "JURIS",
    },
    {
      countryCode: "AU",
      countryName: "Australia",
      legalSystem: "Common Law (Federal)",
      constitutionalBasis: "Implied constitutional right of association (Australian Communist Party v Commonwealth 1951), Section 116 (Religious freedom), Common law freedoms",
      associationFreedom: "Implied constitutional right + common law traditions",
      healthFreedomScore: 70,
      pmaViability: "Moderate - Requires careful structuring under Australian association law",
      status: "researching" as const,
      keyStatutes: [
        "Associations Incorporation Act (varies by state)",
        "Therapeutic Goods Act 1989",
        "Privacy Act 1988",
        "Health Practitioner Regulation National Law"
      ],
      caseReferences: [
        "Australian Communist Party v Commonwealth (1951)",
        "Lange v Australian Broadcasting Corporation (1997) - Implied Freedoms"
      ],
      riskFactors: [
        "TGA strict therapeutic goods regulation",
        "State-based practitioner registration requirements",
        "Mandatory vaccination precedents"
      ],
      primaryLanguage: "English",
      timezone: "Australia/Sydney",
      regulatoryBodies: ["TGA", "AHPRA", "State Health Departments"],
      dataPrivacyLaw: "Privacy Act 1988 / Australian Privacy Principles",
      crossBorderDataRules: "APP 8 - cross-border disclosure restrictions; must ensure equivalent protection",
      researchedBy: "JURIS",
    },
    {
      countryCode: "IN",
      countryName: "India",
      legalSystem: "Common Law (inherited from British system)",
      constitutionalBasis: "Article 19(1)(c) - Right to form associations or unions, Article 21 - Right to Life (includes right to health), Article 47 - Duty of state to improve public health",
      associationFreedom: "Fundamental Right under Article 19(1)(c)",
      healthFreedomScore: 75,
      pmaViability: "Strong potential - Rich tradition of alternative medicine (Ayurveda, Yoga, Naturopathy)",
      status: "researching" as const,
      keyStatutes: [
        "Indian Constitution Articles 19, 21, 47",
        "Indian Medical Council Act 1956",
        "AYUSH Ministry (Ayurveda, Yoga, Unani, Siddha, Homeopathy)",
        "Drugs and Cosmetics Act 1940",
        "Digital Personal Data Protection Act 2023"
      ],
      caseReferences: [
        "Maneka Gandhi v. Union of India (1978) - Article 21 expansive interpretation",
        "State of Punjab v. M.S. Chawla (1997) - Right to health",
        "Damyanti Naranga v. UoI (1971) - Freedom of Association"
      ],
      riskFactors: [
        "Complex multi-state regulatory landscape",
        "Drug Controller General of India oversight",
        "Cross-state practice restrictions"
      ],
      primaryLanguage: "Hindi/English",
      timezone: "Asia/Kolkata",
      regulatoryBodies: ["CDSCO", "AYUSH Ministry", "State Medical Councils", "FSSAI"],
      dataPrivacyLaw: "Digital Personal Data Protection Act 2023",
      crossBorderDataRules: "Data localization requirements under DPDPA; government approval for certain transfers",
      researchedBy: "JURIS",
    },
    {
      countryCode: "NZ",
      countryName: "New Zealand",
      legalSystem: "Common Law",
      constitutionalBasis: "New Zealand Bill of Rights Act 1990 Section 17 (Freedom of Association), Section 11 (Right to refuse medical treatment)",
      associationFreedom: "NZBORA Section 17 Protected",
      healthFreedomScore: 76,
      pmaViability: "Good potential - Strong common law traditions and natural health industry",
      status: "researching" as const,
      keyStatutes: [
        "NZ Bill of Rights Act 1990",
        "Medicines Act 1981",
        "Natural Health and Supplementary Products Bill",
        "Health Practitioners Competence Assurance Act 2003"
      ],
      caseReferences: [
        "Ministry of Health v Atkinson (2012)",
        "NZBORA Section 17 freedom of association jurisprudence"
      ],
      riskFactors: [
        "Medsafe therapeutic product regulation",
        "Small market size",
        "Geographic isolation logistics"
      ],
      primaryLanguage: "English/Maori",
      timezone: "Pacific/Auckland",
      regulatoryBodies: ["Medsafe", "HPCA", "Ministry of Health"],
      dataPrivacyLaw: "Privacy Act 2020",
      crossBorderDataRules: "Information Privacy Principle 12 - disclosure restrictions for cross-border transfers",
      researchedBy: "JURIS",
    },
    {
      countryCode: "ZA",
      countryName: "South Africa",
      legalSystem: "Mixed (Common Law/Civil Law/Customary)",
      constitutionalBasis: "Constitution of South Africa 1996 Section 18 (Freedom of Association), Section 27 (Right to healthcare services), Section 12 (Freedom and security of person)",
      associationFreedom: "Constitutionally Entrenched (Section 18)",
      healthFreedomScore: 68,
      pmaViability: "Moderate - Strong constitutional protections but complex regulatory environment",
      status: "researching" as const,
      keyStatutes: [
        "Constitution of South Africa 1996",
        "National Health Act 2003",
        "Medicines and Related Substances Act 1965",
        "Allied Health Professions Act 1982"
      ],
      caseReferences: [
        "Minister of Health v Treatment Action Campaign (2002)",
        "Certification of Constitution of the Republic of South Africa (1996)"
      ],
      riskFactors: [
        "SAHPRA regulation",
        "Infrastructure challenges in rural areas",
        "Load-shedding affecting data center reliability"
      ],
      primaryLanguage: "English (+ 10 official languages)",
      timezone: "Africa/Johannesburg",
      regulatoryBodies: ["SAHPRA", "HPCSA", "National Department of Health"],
      dataPrivacyLaw: "Protection of Personal Information Act (POPIA) 2013",
      crossBorderDataRules: "POPIA Section 72 - transfer restrictions; requires adequate protection or consent",
      researchedBy: "JURIS",
    },
    {
      countryCode: "IE",
      countryName: "Ireland",
      legalSystem: "Common Law",
      constitutionalBasis: "Bunreacht na hEireann Article 40.6.1(iii) - Right to form associations and unions, ECHR Article 11 incorporated via ECHR Act 2003",
      associationFreedom: "Constitutional Right (Article 40.6.1(iii))",
      healthFreedomScore: 71,
      pmaViability: "Possible - EU regulatory framework adds complexity but strong common law foundation",
      status: "researching" as const,
      keyStatutes: [
        "Constitution of Ireland (Bunreacht na hEireann)",
        "ECHR Act 2003",
        "Irish Medicines Board Act 1995",
        "Health Act 2007"
      ],
      caseReferences: [
        "NHF v Minister for Social and Family Affairs (2003)",
        "Educational Company of Ireland v Fitzpatrick (1961) - Freedom of Association"
      ],
      riskFactors: [
        "EU-level pharmaceutical regulation (EMA)",
        "HPRA enforcement",
        "GDPR stringent compliance requirements"
      ],
      primaryLanguage: "English/Irish",
      timezone: "Europe/Dublin",
      regulatoryBodies: ["HPRA", "HIQA", "Medical Council of Ireland"],
      dataPrivacyLaw: "GDPR / Data Protection Act 2018",
      crossBorderDataRules: "GDPR Chapter V - strict adequacy/SCCs required for non-EU transfers",
      researchedBy: "JURIS",
    },
    {
      countryCode: "JM",
      countryName: "Jamaica",
      legalSystem: "Common Law (British-derived)",
      constitutionalBasis: "Jamaica Charter of Fundamental Rights and Freedoms (2011) Section 13(3)(c) - Freedom of Association, Section 13(3)(j) - Right to enjoy health",
      associationFreedom: "Charter-protected",
      healthFreedomScore: 74,
      pmaViability: "Good potential - Active natural health/herbal medicine tradition, common law framework",
      status: "researching" as const,
      keyStatutes: [
        "Jamaica Charter of Fundamental Rights (2011)",
        "Food and Drugs Act",
        "Pharmacy Act",
        "Medical Act"
      ],
      caseReferences: [
        "Charter rights jurisprudence (post-2011 amendments)"
      ],
      riskFactors: [
        "Limited regulatory infrastructure",
        "Caribbean-specific logistics",
        "Internet connectivity in rural areas"
      ],
      primaryLanguage: "English",
      timezone: "America/Jamaica",
      regulatoryBodies: ["Ministry of Health", "Pharmacy Council of Jamaica"],
      dataPrivacyLaw: "Data Protection Act 2020",
      crossBorderDataRules: "DPA 2020 requires adequate protection for cross-border transfers",
      researchedBy: "JURIS",
    },
    {
      countryCode: "KE",
      countryName: "Kenya",
      legalSystem: "Mixed (Common Law + Customary Law)",
      constitutionalBasis: "Constitution of Kenya 2010 Article 36 (Freedom of Association), Article 43 (Right to healthcare), Article 31 (Privacy)",
      associationFreedom: "Constitutional Right (Article 36)",
      healthFreedomScore: 65,
      pmaViability: "Moderate - Progressive constitution but regulatory infrastructure developing",
      status: "researching" as const,
      keyStatutes: [
        "Constitution of Kenya 2010",
        "Health Act 2017",
        "Pharmacy and Poisons Act",
        "Data Protection Act 2019"
      ],
      caseReferences: [
        "Katiba Institute and 3 Others v AG (2017) - Right to health",
        "Kenya Section of International Commission of Jurists v AG (2011)"
      ],
      riskFactors: [
        "Evolving regulatory environment",
        "Infrastructure challenges",
        "Data center reliability"
      ],
      primaryLanguage: "English/Swahili",
      timezone: "Africa/Nairobi",
      regulatoryBodies: ["Pharmacy and Poisons Board", "Kenya Medical Practitioners Board"],
      dataPrivacyLaw: "Data Protection Act 2019",
      crossBorderDataRules: "Requires adequate safeguards for cross-border transfers under DPA 2019",
      researchedBy: "JURIS",
    },
  ];

  for (const j of jurisdictions) {
    await upsertJurisdiction(j);
  }

  return jurisdictions.length;
}

export async function seedPrimaryNode(): Promise<{ node: typeof clinicNodes.$inferSelect; apiKey: string | null }> {
  const existing = await getNodeByIdentifier("ffpma-central-us-east");
  if (existing) return { node: existing, apiKey: null };

  return registerNode({
    nodeIdentifier: "ffpma-central-us-east",
    displayName: "FFPMA Central (US East)",
    region: "us-east-1",
    isPrimary: true,
    failoverPriority: 1,
    endpoint: "https://forgottenformula.com",
    version: "1.0.0",
  });
}

let failoverInterval: NodeJS.Timeout | null = null;

export function startFailoverScheduler(intervalMs = 60000): void {
  if (failoverInterval) return;
  console.log(`[ClinicNode] Automatic failover scheduler started (interval: ${intervalMs / 1000}s)`);
  failoverInterval = setInterval(async () => {
    try {
      const actions = await checkForFailover();
      if (actions.length > 0) {
        console.log(`[ClinicNode] Failover check triggered ${actions.length} action(s)`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error(`[ClinicNode] Failover check error: ${msg}`);
    }
  }, intervalMs);
}

export function stopFailoverScheduler(): void {
  if (failoverInterval) {
    clearInterval(failoverInterval);
    failoverInterval = null;
    console.log("[ClinicNode] Automatic failover scheduler stopped");
  }
}

export const REPLICATION_TABLES = [
  "users",
  "member_profiles",
  "clinics",
  "products",
  "programs",
  "library_items",
  "training_modules",
  "quizzes",
  "contracts",
  "orders",
  "protocol_sessions",
];

export const NODE_DEPLOYMENT_CHECKLIST = [
  { step: 1, name: "Infrastructure Provisioning", description: "Provision cloud VM/container in target region with minimum 4 vCPU, 8GB RAM, 100GB SSD" },
  { step: 2, name: "Network Configuration", description: "Configure VPN tunnel to central node, set up DNS records, configure firewall rules (ports 443, 5432, 6379)" },
  { step: 3, name: "Database Setup", description: "Install PostgreSQL 15+, configure streaming replication from primary, set up WAL archiving" },
  { step: 4, name: "Application Deployment", description: "Deploy FFPMA application stack (Node.js 20+, Redis, Nginx), configure environment variables" },
  { step: 5, name: "SSL/TLS Certificates", description: "Provision Let's Encrypt certificates, configure auto-renewal, set up mTLS for inter-node communication" },
  { step: 6, name: "Replication Verification", description: "Verify database replication lag < 5 seconds, test data consistency, validate read/write operations" },
  { step: 7, name: "Health Check Registration", description: "Register node with central monitoring, configure heartbeat interval (60s), set alert thresholds" },
  { step: 8, name: "Failover Testing", description: "Simulate primary failure, verify automatic failover, test traffic rerouting, validate data integrity" },
  { step: 9, name: "Load Testing", description: "Run load tests (100 concurrent members), verify response times < 200ms, check resource utilization" },
  { step: 10, name: "Go-Live Approval", description: "Trustee approval required, update DNS, enable production traffic, monitor for 24h burn-in period" },
];
