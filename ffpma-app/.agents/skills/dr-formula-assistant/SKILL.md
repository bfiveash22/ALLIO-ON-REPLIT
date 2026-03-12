---
name: dr-formula-assistant
description: Steve Baker 2026 Protocol methodology enforcement, FFPMA product catalog integration, protocol template compliance, and quality assurance for patient protocols. Use when generating patient protocols, validating DR_FORMULA output, ensuring Steve Baker methodology compliance, checking product catalog integration, or performing protocol quality reviews before delivery to members.
---

# DR_FORMULA Assistant

Quality assurance and methodology enforcement for patient protocol generation.

## Steve Baker 2026 Methodology Validation

**The 5 Rs Framework (MANDATORY ORDER):**
1. **REDUCE** - Detox parasites/virals/heavy metals
2. **RESTORE** - Gut microbiome restoration  
3. **REACTIVATE** - Endocannabinoid System (ECS) targeting
4. **REGENERATE** - Mitochondrial function
5. **REVITALIZE** - Mind/body/spirit integration

**Validation Checklist:**
- [ ] All 5 phases present in correct order
- [ ] Each phase has specific products listed
- [ ] Mechanism of action explained for each intervention
- [ ] Molecular pathways cited (PI3K-AKT, NF-κB, mTOR, etc.)
- [ ] CB1/CB2 receptor targeting specified (Phase 3)
- [ ] Dosing includes UNITS for injectables (e.g., "50 units = 2.5mg")
- [ ] Reconstitution instructions included (mg vial + mL BAC water)
- [ ] Duration specified for each phase
- [ ] Rationale provided for each intervention

## Product Catalog Integration

**FFPMA Product Categories:**
- Suppositories (ECS, B17, DMSO, Ivermectin, Probiotic, EDTA)
- IV Protocols (ALA, DMSO, EDTA, Glutathione, H2O2, Myers', NAD+, Vitamin C, Ozone)
- Peptides (BPC-157, Thymosin Alpha-1, Thymosin Beta-4, etc.)
- Bioregulators (Organ-specific)
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
2. **Phase 1 (REDUCE)** - Products → Targets → Duration
3. **Phase 2 (RESTORE)** - Products → Targets → Duration
4. **Phase 3 (REACTIVATE)** - Products → CB1/CB2 specificity → Duration
5. **Phase 4 (REGENERATE)** - Products → Mitochondrial targets → Duration
6. **Phase 5 (REVITALIZE)** - Therapies → Methods → Ongoing
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
2. Verify all 5 Rs present and in order
3. Check product catalog integration
4. Confirm template compliance
5. Ensure daily schedule included
6. Verify length (5-10 pages)
7. Check for patient-specific customization

**Red Flags (REJECT if present):**
- ❌ Missing any of the 5 Rs
- ❌ Generic products (not FFPMA catalog)
- ❌ No CB1/CB2 targeting in Phase 3
- ❌ Missing daily schedule
- ❌ Less than 5 pages (too brief)
- ❌ No molecular pathway citations
- ❌ Missing root cause analysis
- ❌ No dosing in UNITS for injectables

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
- `validate-protocol.js` - Check methodology compliance
- `catalog-checker.js` - Verify product integration
- `template-audit.js` - Ensure format compliance
- `qa-report.js` - Generate quality report
