---
name: ffpma-ops
description: PMA operations workflows including patient protocol tracking, legal compliance monitoring, member onboarding coordination, and clinic network management. Use when managing FFPMA member intake, tracking protocol generation for patients (Kathryn Smith, Annette Gomer, etc.), coordinating clinic approvals, monitoring legal document status, or generating operational reports for the PMA network.
---

# FFPMA Operations

Streamline PMA operations across patient care, legal compliance, and clinic coordination.

## Patient Protocol Tracking

Monitor protocol generation by DR_FORMULA for all patients:

```javascript
const protocols = await client.query(`
  SELECT id, title, status, progress, output_url, created_at, updated_at
  FROM agent_tasks
  WHERE agent_id IN ('DR-FORMULA', 'dr-formula', 'DR_FORMULA')
    AND (title LIKE '%Protocol%' OR title LIKE '%Patient%')
  ORDER BY priority DESC, created_at DESC
`);
```

**Track These Cases:**
- Kathryn Smith (breast cancer)
- Annette Gomer (metastatic adenocarcinoma + mercury toxicity)
- 80M Crop Duster (renal disease)
- 75F (recurring breast cancer)

**Quality Checks:**
- Protocol follows Steve Baker 2026 methodology ✓
- All 5 Rs present (REDUCE/RESTORE/REACTIVATE/REGENERATE/REVITALIZE) ✓
- Product catalog integration ✓
- CB1/CB2 receptor targeting ✓
- Daily schedule included ✓
- 5-10 pages (not summary) ✓

## Legal Compliance Monitoring

Track legal document status and compliance checks:

```javascript
const legal = await client.query(`
  SELECT agent_id, title, status, priority
  FROM agent_tasks
  WHERE division = 'legal'
    AND status != 'completed'
  ORDER BY priority DESC
`);
```

**Monitor:**
- Privacy Policy (GDPR/CCPA compliance)
- Terms of Service
- PMA membership contracts
- State-specific addendums
- Cease & desist letters (ProPublica, Holtorf)
- Legal knowledge deployment status

## Member Onboarding Workflows

**New Member Checklist:**
1. Member signs PMA contract
2. Payment processed (Stripe/WooCommerce)
3. Drive folder created (member protocols)
4. Welcome email sent
5. Access granted to member portal
6. Assigned to clinic (if applicable)

**Track Onboarding:**
```javascript
const newMembers = await client.query(`
  SELECT id, created_at, status
  FROM member_enrollment
  WHERE created_at > NOW() - INTERVAL '7 days'
  ORDER BY created_at DESC
`);
```

## Clinic Coordination

**Monitor Clinic Network:**
- Total clinics: Query `clinics` table
- Pending approvals: EIN verification status
- Active clinics: Operational count
- Geographic distribution

**Clinic Approval Workflow:**
1. Doctor submits PMA application
2. EIN verified (Unincorporated Association)
3. Network Affiliation Agreement signed
4. Clinic Principal Agreement executed
5. Added to FFPMA network
6. Training materials provided

## Operational Reports

**Daily Summary:**
- New protocols generated
- Member onboarding count
- Legal tasks in progress
- Clinic applications pending

**Weekly Report:**
- Total active members
- Protocols completed this week
- Legal compliance status
- Clinic network growth

**Monthly Metrics:**
- Member growth rate
- Protocol completion rate
- Clinic network size
- Legal document status

## Integration Points

**With DR_FORMULA:**
- Monitor protocol generation
- Alert on failures
- Track quality metrics

**With JURIS/LEXICON:**
- Legal compliance checks
- Document status tracking
- Constitutional law citations

**With ATHENA/SENTINEL:**
- Strategic oversight
- Priority management
- Trustee communication

## Full Data Access Reference

For the complete list of all 88 database tables, research APIs, REST endpoints, and data access patterns, see the shared data access skill at `.agents/skills/allio-data-access/SKILL.md`. Key tables for operations beyond `agent_tasks` include `member_profiles`, `member_enrollment`, `clinics`, `clinic_nodes`, `doctor_onboarding`, `contracts`, `legal_documents`, `patient_records`, `patient_protocols`, `programs`, `program_enrollments`, and `network_doctors`.

## Scripts

See `scripts/` directory:
- `protocol-tracker.js` - Patient protocol status
- `legal-monitor.js` - Legal compliance checks
- `onboarding-status.js` - New member tracking
- `clinic-network.js` - Clinic coordination
- `daily-ops-report.js` - Operational summary
