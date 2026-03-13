---
name: dr-formula-assistant
description: Steve Baker 2026 Protocol methodology enforcement, FFPMA product catalog integration, protocol template compliance, and quality assurance for patient protocols. Use when generating patient protocols, validating DR_FORMULA output, ensuring Steve Baker methodology compliance, checking product catalog integration, or performing protocol quality reviews before delivery to members.
---

# DR_FORMULA Assistant

Quality assurance and methodology enforcement for patient protocol generation.

## Steve Baker 2026 Methodology Validation

**The 5 Rs Framework (MANDATORY ORDER):**
1. **REMOVE** - Detox parasites/virals/heavy metals, clear pathways before rebuilding
2. **RESTORE** - Periodontal & gut health, amalgam removal, microbiome restoration
3. **REPLENISH** - Dr. Wallach's 90 essential nutrients, mineral repletion, vitamin optimization
4. **REGENERATE** - Targeted molecular therapy, peptides for specific pathways, bioregulators
5. **REBALANCE** - Holistic integration, spiritual/mental health, lifestyle modifications, maintenance

**Validation Checklist:**
- [ ] All 5 phases present in correct order (Remove → Restore → Replenish → Regenerate → Rebalance)
- [ ] Each phase has specific products listed
- [ ] Mechanism of action explained for each intervention
- [ ] Molecular pathways cited (PI3K-AKT, NF-κB, mTOR, etc.)
- [ ] ECS/cannabinoid targeting specified where applicable
- [ ] Dosing includes UNITS for injectables (e.g., "50 units = 2.5mg")
- [ ] Reconstitution instructions included (mg vial + mL BAC water)
- [ ] Duration specified for each phase
- [ ] Rationale provided for each intervention

## Product Catalog Integration

**FFPMA Product Categories:**
- Suppositories (ECS, B17, DMSO, Ivermectin, Probiotic, EDTA)
- IV Protocols (ALA, DMSO, EDTA, Glutathione, H2O2, Myers', NAD+, Vitamin C, Ozone)
- Peptides (BPC-157, Thymosin Alpha-1, Thymosin Beta-4, etc.)
- Bioregulators (Organ-specific Khavinson peptides)
- Cannabinoids (12-cannabinoid formulations)
- Minerals (Dr. Wallach's 90 nutrients)
- Supplements (MitoSTAC, GlyNAC, CoQ10, etc.)

**Integration Check:**
- [ ] Products matched to patient condition
- [ ] FFPMA catalog products specified (not generic)
- [ ] Dosing matches catalog recommendations
- [ ] Frequency appropriate for condition
- [ ] Synergies between products explained

## Template Compliance

**Required Sections:**
1. **Root Cause Analysis** - Identify all underlying issues
2. **Phase 1 (REMOVE)** - Products → Targets → Duration
3. **Phase 2 (RESTORE)** - Products → Targets → Duration
4. **Phase 3 (REPLENISH)** - Products → Nutrient targets → Duration
5. **Phase 4 (REGENERATE)** - Products → Molecular targets → Duration
6. **Phase 5 (REBALANCE)** - Therapies → Methods → Ongoing
7. **Daily Schedule** - Morning/Midday/Evening/Bedtime checklists (☐ format)
8. **Monitoring & Follow-up** - Blood work, timelines, retesting

**Length:** 5-10 pages minimum (NOT a 1-page summary)

**Format Example:**
```markdown
### Thymosin Alpha-1 (TA-1) 2x week

**Mechanism of Action:**
* Immune Enhancement: TA-1 promotes T-cell activation, dendritic cell function
* Tumor Microenvironment Modulation: Reduces immunosuppression

**Dosage and Administration:**
* Reconstitution: 10 mg vial with 2 mL bacteriostatic water (5 mg/mL concentration)
* Dosage: 2.5mg (2500mcg) subcutaneously 2x/week (50 units)
* Duration: 12 weeks, with cycles repeated every 3-6 months

**Rationale:**
TA-1 strengthens immune system's ability to combat cancer cells.
```

## Quality Assurance Process

**Before Delivery:**
1. Run protocol through validation checklist
2. Verify all 5 Rs present and in order (Remove → Restore → Replenish → Regenerate → Rebalance)
3. Check product catalog integration
4. Confirm template compliance
5. Ensure daily schedule included
6. Verify length (5-10 pages)
7. Check for patient-specific customization

**Red Flags (REJECT if present):**
- Missing any of the 5 Rs
- Generic products (not FFPMA catalog)
- Missing daily schedule
- Less than 5 pages (too brief)
- No molecular pathway citations
- Missing root cause analysis
- No dosing in UNITS for injectables

## Reference Materials

**Steve Baker 2026 Protocol:**
Location: `/root/.openclaw/workspace/ffpma-library/reference/Steve-Baker-2026-Full-Protocol-41-Slides.md`

**Protocol Template:**
Location: `/root/.openclaw/workspace/ffpma-library/reference/Steve-Baker-Protocol-Template-2026.txt`

**Example Protocols:**
- Kathryn Smith (breast cancer)
- Annette Gomer (metastatic adenocarcinoma + mercury)
- 80M Crop Duster (renal disease)

## Scripts

See `scripts/` directory:
- `validate-protocol.js` - Check 5 Rs methodology compliance (all phases present in order, dosing units, reconstitution instructions)
- `catalog-checker.js` - Verify products match FFPMA catalog from protocol-knowledge.ts
- `template-audit.js` - Ensure required sections present, length compliance, daily schedule format
- `qa-report.js` - Run all 3 checks and output a comprehensive quality summary report

### Running QA Scripts

```bash
# Individual checks
node scripts/validate-protocol.js protocol.json
node scripts/catalog-checker.js protocol.json
node scripts/template-audit.js protocol.json

# Full QA report (runs all checks)
node scripts/qa-report.js protocol.json
```

### API-Based QA

The QA validation is also available via the API:
```
POST /api/protocol-assembly/protocols/:id/qa
```
Returns a comprehensive QA report for the specified protocol.
