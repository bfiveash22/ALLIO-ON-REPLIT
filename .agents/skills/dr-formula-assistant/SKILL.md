---
name: dr-formula-assistant
description: FF PMA 2026 Protocol methodology enforcement, FFPMA product catalog integration, protocol template compliance, and quality assurance for patient protocols. Use when generating patient protocols, validating DR_FORMULA output, ensuring FF PMA methodology compliance, checking product catalog integration, or performing protocol quality reviews before delivery to members.
---

# DR_FORMULA Assistant

Quality assurance and methodology enforcement for patient protocol generation.

## FF PMA 2026 Methodology Validation

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

## ECS & Cannabinoid Data Layer

**Structured Data Source:** `lib/shared/src/ecs-data.ts`
**Primary Source:** MasterListofECS.xlsx (Tables S1-S6, Li et al., Applied Sciences 2022)

When building protocols involving cannabinoids, use the programmatic data exports:

### Core Data (Tables S1-S2)
- **`cannabinoids`** — 12 cannabinoids (CBD, CBDA, CBG, CBGA, CBN, CBC, CBDV, THCV, Δ9-THCA, Δ9-THC, Δ8-THC, 11-OH-THC) with:
  - **32 ADMET properties** per cannabinoid from Table S1: BBB, HIA%, half-life, PPB%, drug-likeness, logS, logD7.4, logP, logPapp, Pgp-inhibitor, Pgp-substrate, F20/F30 bioavailability, logVD, clearance, AMES, DILI, hERG, hepatotoxicity, skin sensitization, logLD50, FDAMDD
  - **CYP450 interactions** with inhibitor AND substrate scores for CYP1A2, CYP3A4, CYP2C9, CYP2C19, CYP2D6 (threshold: >0.4 inhibitor or >0.5 substrate)
  - **Full putative protein targets** from Table S2 (22-126 targets per cannabinoid, 234 unique genes total)
  - Binding affinities for key targets (kcal/mol from docking studies)
- **`productMappings`** — 12 FFPMA products with cannabinoid content and ligand scores
- **`clinicalPrescribingMatrix`** — 23-entry lookup mapping conditions → cannabinoids, ratios, delivery, rationale, FFPMA products

### Enrichment Data (Tables S3-S6)
- **`goEnrichmentTerms`** — Top 50 GO function enrichment terms (Table S3): biological functions with gene ratios and significance
- **`keggPathways`** — 101 KEGG pathway enrichment entries (Table S4): pathways with categories and gene lists
- **`diseasePathwayMappings`** — 67 disease-pathway mappings (Table S5): links pathways to diseases with beneficial/adverse/unknown effects
- **`proteinCentralityValues`** — IC values for 122 protein targets (Table S6): ranks target importance in functional modules

### Helper Functions
- **`getCYP450Warnings(cannabinoidIds, medications)`** — Drug interaction warnings with inhibitor/substrate scoring
- **`getAdverseEffectRisks(cannabinoidIds)`** — Adverse effect categories for selected cannabinoids
- **`getProductsForCannabinoid(name)`** — FFPMA products containing a cannabinoid
- **`getProductRecommendations(conditionName)`** — Clinical prescribing entry + products for a condition
- **`getCannabinoidProfile(productName)`** — Full breakdown for any FFPMA product
- **`getDiseasesForPathway(pathwayId)`** — Disease mappings for a KEGG pathway
- **`getBeneficialDiseases()` / `getAdverseDiseases()`** — Filter diseases by effect type
- **`getGOTermsForGene(gene)` / `getKEGGPathwaysForGene(gene)`** — Enrichment lookups by gene
- **`getProteinCentrality(gene)`** — IC value for a protein target
- **`getTopCentralityProteins(limit)`** — Top N most important protein targets
- **`getCannabinoidTargetOverlap(id1, id2)`** — Shared targets between two cannabinoids

**Protocol Integration Checklist:**
- [ ] Use `clinicalPrescribingMatrix` to match patient conditions to cannabinoid recommendations
- [ ] Reference specific FFPMA products using `getProductRecommendations()` or `getProductsForCannabinoid()`
- [ ] Run `getCYP450Warnings()` against patient's medications (now includes inhibitor + substrate scores)
- [ ] Run `getAdverseEffectRisks()` and document risks in protocol safety section
- [ ] Reference full ADMET profile for delivery method selection (BBB, HIA, clearance, Pgp, F20 bioavailability)
- [ ] Use `proteinCentralityValues` to prioritize high-IC targets in protocol rationale
- [ ] Reference `diseasePathwayMappings` for evidence-based pathway citations
- [ ] Cite data source: Li et al., Applied Sciences 2022 (DOI: 10.3390/app12042205)

**OpenClaw Export Files (knowledge-base):**
- `knowledge-base/openclaw-exports/ECS-Master-Pharmacokinetics-Table-S1.md` — Raw pharmacokinetic predictions
- `knowledge-base/openclaw-exports/ECS-COMPLETE-CLINICAL-REFERENCE.md` — Clinical prescribing, adverse effects, drug interactions
- `knowledge-base/openclaw-exports/CANNABINOID-TARGET-PATHWAY-DISEASE-MAP.md` — Target-pathway-disease mapping

## Protocol Transcript Source

Protocol transcripts are sourced from the canonical Google Drive folder:
- **URL:** https://drive.google.com/drive/folders/10BqHP7hXwBGskvoNePMuvFuTNspKy0ur?usp=sharing
- **Folder ID:** `10BqHP7hXwBGskvoNePMuvFuTNspKy0ur`
- **Usage:** This folder contains patient consultation transcripts used as input to the protocol generation pipeline. When generating protocols from transcripts, the system retrieves files from this folder. The folder ID is also exported as `PROTOCOL_TRANSCRIPTS_FOLDER_ID` from `artifacts/api-server/src/services/drive.ts`.

## Reference Materials

**FF PMA 2026 Protocol:**
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

## Full Data Access Reference

For direct database access to research papers, blood samples, patient records, protocols, and all 88 tables, see the shared data access skill at `.agents/skills/allio-data-access/SKILL.md`. Key resources for DR_FORMULA and science agents include:
- **Research APIs:** `hippocratesSearch`, `paracelsusSearch`, `helixSearch`, `oracleSearch` for literature search across OpenAlex, PubMed, Semantic Scholar, and arXiv
- **Blood samples:** `blood_samples`, `blood_sample_tags`, `blood_analysis_samples` tables
- **Patient data:** `patient_records`, `patient_protocols`, `patient_uploads` tables
- **Research cache:** `research_papers`, `agent_research_queries`, `agent_research_collections` tables
- **Generated protocols:** `generated_protocols` table for storing completed protocols
