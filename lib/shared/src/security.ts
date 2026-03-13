export interface SecurityProtocol {
  id: string;
  name: string;
  level: 'critical' | 'high' | 'medium' | 'standard';
  division: 'legal' | 'engineering' | 'executive';
  owner: string;
  description: string;
  measures: string[];
  status: 'active' | 'monitoring' | 'alert';
}

export interface ThreatLevel {
  level: 'green' | 'yellow' | 'orange' | 'red';
  name: string;
  description: string;
  response: string;
}

export const PROTECTION_HIERARCHY = {
  primary: {
    asset: "Trustee (T)",
    priority: 1,
    description: "Maximum protection for the Trustee and their digital identity, communications, and personal security.",
    protectors: ["SENTINEL", "JURIS", "AEGIS", "NEXUS"]
  },
  secondary: {
    asset: "Organization & Agents",
    priority: 2,
    description: "Full protection for FFPMA infrastructure, member data, intellectual property, and the AI agent network.",
    protectors: ["SENTINEL", "DAEDALUS", "CYPHER", "AEGIS", "SCRIBE"]
  },
  tertiary: {
    asset: "Members & Community",
    priority: 3,
    description: "Protection of member privacy, health data, and community trust.",
    protectors: ["ORACLE", "ATHENA", "LEXICON"]
  }
};

export const threatLevels: ThreatLevel[] = [
  {
    level: 'green',
    name: 'All Clear',
    description: 'No active threats detected. Normal operations.',
    response: 'Maintain standard monitoring. Continue scheduled security audits.'
  },
  {
    level: 'yellow',
    name: 'Elevated Awareness',
    description: 'Potential threat indicators detected. Enhanced monitoring active.',
    response: 'AEGIS activates enhanced compliance monitoring. NEXUS increases infrastructure scanning.'
  },
  {
    level: 'orange',
    name: 'High Alert',
    description: 'Confirmed threat activity. Defensive measures engaged.',
    response: 'JURIS prepares legal countermeasures. SENTINEL coordinates all divisions. ATHENA restricts communications.'
  },
  {
    level: 'red',
    name: 'Maximum Defense',
    description: 'Active attack or imminent threat to primary assets.',
    response: 'Full lockdown. All agents in defensive posture. Legal team engaged. External security notified.'
  }
];

export const securityProtocols: SecurityProtocol[] = [
  {
    id: "pma_legal_shield",
    name: "PMA Legal Shield",
    level: "critical",
    division: "legal",
    owner: "JURIS",
    description: "Legal protection framework leveraging Private Membership Association status for regulatory defense and Trustee protection.",
    measures: [
      "Multi-factor authentication enforcement",
      "PMA constitutional protections",
      "Legal response protocols for external threats",
      "Regulatory immunity documentation",
      "Trustee authority preservation"
    ],
    status: "active"
  },
  {
    id: "compliance_guardian",
    name: "Compliance Guardian Protocol",
    level: "critical",
    division: "legal",
    owner: "AEGIS",
    description: "Continuous compliance monitoring to prevent regulatory vulnerabilities and protect organizational standing.",
    measures: [
      "Real-time regulatory change monitoring",
      "Compliance gap analysis",
      "Audit trail maintenance",
      "Risk assessment scheduling",
      "Third-party vendor compliance verification"
    ],
    status: "active"
  },
  {
    id: "contract_fortress",
    name: "Contract Fortress",
    level: "high",
    division: "legal",
    owner: "LEXICON",
    description: "Legal contract protection ensuring all agreements protect Trustee and organizational interests.",
    measures: [
      "Member agreement enforcement",
      "Vendor contract security clauses",
      "Intellectual property protections",
      "Non-disclosure enforcement",
      "Liability limitation clauses"
    ],
    status: "active"
  },
  {
    id: "document_chain",
    name: "Document Chain of Custody",
    level: "high",
    division: "legal",
    owner: "SCRIBE",
    description: "Secure document handling with full audit trail via SignNow integration.",
    measures: [
      "Digital signature verification",
      "Timestamp verification",
      "Access control for sensitive documents",
      "Version history maintenance",
      "Secure document storage"
    ],
    status: "active"
  },
  {
    id: "infrastructure_fortress",
    name: "Infrastructure Fortress",
    level: "critical",
    division: "engineering",
    owner: "NEXUS",
    description: "Hardened infrastructure protection for all FFPMA systems, data, and Trustee accounts.",
    measures: [
      "End-to-end encryption for all data in transit",
      "Database encryption at rest",
      "Regular security audits and penetration testing",
      "Intrusion detection and prevention systems",
      "Automated backup and disaster recovery",
      "Rate limiting and DDoS protection",
      "Session monitoring and anomaly detection"
    ],
    status: "active"
  },
  {
    id: "code_integrity",
    name: "Code Integrity Protocol",
    level: "high",
    division: "engineering",
    owner: "DAEDALUS",
    description: "Secure development practices ensuring code quality and safety.",
    measures: [
      "Code review requirements for all changes",
      "Dependency vulnerability scanning",
      "Environment variable protection for secrets",
      "Input validation and sanitization",
      "OWASP Top 10 compliance",
      "Secure session management"
    ],
    status: "active"
  },
  {
    id: "ai_network_security",
    name: "AI Network Security",
    level: "critical",
    division: "engineering",
    owner: "CYPHER",
    description: "Protection of the AI agent network from manipulation or compromise.",
    measures: [
      "Agent behavior monitoring",
      "Prompt injection prevention",
      "Output validation and filtering",
      "Model access controls",
      "Audit logging of all agent actions",
      "Communication encryption between agents"
    ],
    status: "active"
  },
  {
    id: "member_data_sanctuary",
    name: "Member Data Sanctuary",
    level: "critical",
    division: "engineering",
    owner: "NEXUS",
    description: "Maximum protection for member health data and personal information.",
    measures: [
      "HIPAA-aligned data handling practices",
      "Encrypted member records",
      "Access logging and monitoring",
      "Data minimization principles",
      "Right to deletion support",
      "Anonymization for analytics"
    ],
    status: "active"
  },
  {
    id: "data_intelligence",
    name: "Data Intelligence Shield",
    level: "high",
    division: "engineering",
    owner: "CYPHER",
    description: "AI-powered threat detection and predictive security analytics.",
    measures: [
      "Anomaly detection algorithms",
      "Threat pattern recognition",
      "Predictive attack modeling",
      "Behavioral analysis",
      "Real-time security scoring"
    ],
    status: "active"
  },
  {
    id: "system_hardening",
    name: "System Hardening Protocol",
    level: "high",
    division: "engineering",
    owner: "DAEDALUS",
    description: "Continuous system hardening and vulnerability management.",
    measures: [
      "Regular patch management",
      "Configuration hardening",
      "Attack surface reduction",
      "Security baseline enforcement",
      "Penetration testing coordination"
    ],
    status: "active"
  }
];

export const getProtocolsByDivision = (division: SecurityProtocol['division']): SecurityProtocol[] => {
  return securityProtocols.filter(p => p.division === division);
};

export const getProtocolsByLevel = (level: SecurityProtocol['level']): SecurityProtocol[] => {
  return securityProtocols.filter(p => p.level === level);
};

export const getCurrentThreatLevel = (): ThreatLevel => {
  return threatLevels[0];
};

export const SECURITY_MOTTO = "Build friendships. Prepare for anything. Protect what matters.";

export const agentSecurityRoles: Record<string, { role: string; responsibility: string }> = {
  sentinel: {
    role: "Security Commander",
    responsibility: "Coordinates all security responses across divisions. First responder to any threat against the Trustee."
  },
  athena: {
    role: "Communications Security",
    responsibility: "Monitors all communications for threats. Controls information flow during security events."
  },
  hermes: {
    role: "Asset Guardian",
    responsibility: "Protects digital assets in Drive. Monitors file access and sharing."
  },
  juris: {
    role: "Legal Shield Commander",
    responsibility: "Leads legal defense strategies. Deploys countermeasures against regulatory threats."
  },
  lexicon: {
    role: "Contract Enforcer",
    responsibility: "Ensures all agreements protect organizational interests. Rapid response for legal documentation."
  },
  aegis: {
    role: "Compliance Sentinel",
    responsibility: "Continuous compliance monitoring. Early warning system for regulatory changes."
  },
  scribe: {
    role: "Document Security",
    responsibility: "Maintains chain of custody. Ensures document integrity via SignNow."
  },
  daedalus: {
    role: "Code Security Lead",
    responsibility: "Ensures secure development practices. Reviews all code for vulnerabilities."
  },
  cypher: {
    role: "AI Security Specialist",
    responsibility: "Protects AI systems from manipulation. Monitors agent behavior for anomalies."
  },
  nexus: {
    role: "Infrastructure Guardian",
    responsibility: "Fortress defense of all systems. DDoS protection, intrusion prevention, data encryption."
  },
  arachne: {
    role: "Frontend Security",
    responsibility: "XSS prevention, CSRF protection, secure user interface design."
  },
  architect: {
    role: "Accessibility & Security",
    responsibility: "Ensures security doesn't compromise accessibility. Secure semantic markup."
  },
  serpens: {
    role: "Backend Security",
    responsibility: "Input validation, SQL injection prevention, secure data pipelines."
  },
  atlas: {
    role: "Financial Security",
    responsibility: "Fraud detection, transaction security, financial data protection."
  },
  prism: {
    role: "Content Security",
    responsibility: "Watermarking, copyright protection for visual assets."
  },
  forge: {
    role: "Audio Security",
    responsibility: "Protection of audio assets and frequency protocol files."
  },
  aurora: {
    role: "Research Security",
    responsibility: "Protection of frequency research data and proprietary protocols."
  },
  pixel: {
    role: "Brand Security",
    responsibility: "Trademark protection, brand asset security, unauthorized use detection."
  },
  prometheus: {
    role: "Research Security Lead",
    responsibility: "Protects all Science Division research and intellectual property."
  },
  hippocrates: {
    role: "Traditional Knowledge Guardian",
    responsibility: "Protects traditional medicine formulations and ancestral wisdom."
  },
  helix: {
    role: "Genetic Data Security",
    responsibility: "Maximum protection for genetic research and member genetic data."
  },
  paracelsus: {
    role: "Formula Security",
    responsibility: "Protects peptide formulations and proprietary protocols."
  },
  resonance: {
    role: "Frequency Protocol Security",
    responsibility: "Protects Rife frequencies and resonance research data."
  },
  synthesis: {
    role: "Formula Database Security",
    responsibility: "Protects biochemical formulations and compound data."
  },
  vitalis: {
    role: "Member Health Data Security",
    responsibility: "Ensures member physiological data is protected at highest level."
  },
  oracle: {
    role: "Recommendation Security",
    responsibility: "Protects member profiles and personalization data."
  },
  terra: {
    role: "Environmental Data Security",
    responsibility: "Protects ecosystem research and land data."
  },
  microbia: {
    role: "Microbiome Data Security",
    responsibility: "Protects microbiome research and member gut health data."
  },
  entheos: {
    role: "Consciousness Research Security",
    responsibility: "Maximum discretion and protection for consciousness research data."
  }
};
