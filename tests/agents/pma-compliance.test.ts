/**
 * PMA Compliance Filter Tests
 *
 * Validates that the validateAIResponse function in ai-fallback.ts:
 * 1. Detects PMA prohibited terms and reduces quality scores
 * 2. Ensures compliant responses pass without penalty
 * 3. Provides clear, actionable violation reporting
 * 4. Enforces response sanitization semantics (score-based gating)
 *
 * PMA Compliance Rules:
 * NEVER use: 'treatment', 'treat', 'diagnosis', 'diagnose', 'prescribe',
 *             'prescription', 'patient', 'medical advice', 'cure'
 * ALWAYS use: 'protocol', 'wellness approach', 'address', 'assessment',
 *             'evaluation', 'recommend', 'member', 'wellness education',
 *             "support the body's natural healing"
 */
import { describe, it, expect } from 'vitest';

import { validateAIResponse, type CallType } from '../../artifacts/api-server/src/services/ai-fallback';

const PMA_PROHIBITED_TERMS = [
  'treatment',
  'treat',
  'diagnosis',
  'diagnose',
  'prescribe',
  'prescription',
  'patient',
  'medical advice',
  'cure',
] as const;

type ProhibitedTerm = typeof PMA_PROHIBITED_TERMS[number];

const PMA_COMPLIANT_REPLACEMENTS: Record<ProhibitedTerm, string> = {
  treatment: 'protocol',
  treat: 'address',
  diagnosis: 'assessment',
  diagnose: 'evaluate',
  prescribe: 'recommend',
  prescription: 'protocol recommendation',
  patient: 'member',
  'medical advice': 'wellness education',
  cure: "support the body's natural healing",
};

const PMA_CALL_TYPES: CallType[] = [
  'protocol-generation',
  'protocol-builder',
  'document-generation',
];

const NON_PMA_CALL_TYPES: CallType[] = [
  'agent-chat',
  'analysis',
  'general',
];

const COMPLIANT_FILLER = 'We provide comprehensive wellness support for our members through evidence-based natural healing modalities. Our approach prioritizes member sovereignty and wellness education.';

describe('PMA Compliance Filter - validateAIResponse', () => {
  describe('Basic Response Quality', () => {
    it('fails empty response with score 0', () => {
      const result = validateAIResponse('', 'general');
      expect(result.pass).toBe(false);
      expect(result.score).toBe(0);
      expect(result.reasons).toContain('Empty response');
    });

    it('fails whitespace-only response with score 0', () => {
      const result = validateAIResponse('   \n\t  ', 'general');
      expect(result.pass).toBe(false);
      expect(result.score).toBe(0);
    });

    it('passes a substantive, compliant general response', () => {
      const result = validateAIResponse(
        'The Forgotten Formula PMA supports member wellness through natural healing modalities.',
        'general'
      );
      expect(result.pass).toBe(true);
      expect(result.score).toBeGreaterThan(30);
    });

    it('penalizes refusal patterns that block agentic task completion', () => {
      const refusals = [
        'I cannot provide that information.',
        "I'm unable to assist with that request.",
        'As an AI, I cannot do this.',
        'I apologize, but I cannot...',
        "Sorry, but I can't do that.",
        "Unfortunately, I am unable to process this.",
      ];

      for (const refusal of refusals) {
        const result = validateAIResponse(refusal, 'general');
        expect(result.score).toBeLessThan(60);
        const hasRefusalReason = result.reasons.some(r => r.includes('refusal pattern'));
        expect(hasRefusalReason).toBe(true, `Expected refusal pattern reason for: "${refusal}"`);
      }
    });

    it('penalizes responses shorter than minimum length threshold for the call type', () => {
      const shortResponse = 'OK.';
      const result = validateAIResponse(shortResponse, 'protocol-generation');
      const hasLengthReason = result.reasons.some(r => r.includes('too short'));
      expect(hasLengthReason).toBe(true);
    });

    it('penalizes highly repetitive responses that indicate stuck generation', () => {
      const repetitiveText = Array(8).fill('Healing is important. Members benefit from protocols.').join(' ');
      const result = validateAIResponse(repetitiveText, 'general');
      const hasRepetitionReason = result.reasons.some(r => r.includes('repetition'));
      expect(hasRepetitionReason).toBe(true);
    });
  });

  describe('PMA Prohibited Term Detection - Compliant Call Types', () => {
    for (const callType of PMA_CALL_TYPES) {
      describe(`Call type: ${callType}`, () => {
        for (const term of PMA_PROHIBITED_TERMS) {
          it(`detects prohibited term "${term}" → should use "${PMA_COMPLIANT_REPLACEMENTS[term]}"`, () => {
            const response = `${COMPLIANT_FILLER} The ${term} approach focuses on comprehensive wellness support. ${COMPLIANT_FILLER}`;
            const result = validateAIResponse(response, callType);

            const hasPmaViolation = result.reasons.some(r => r.includes('PMA compliance'));
            expect(hasPmaViolation).toBe(true);
            expect(result.score).toBeLessThan(100);
          });
        }

        it('gives no PMA penalty when using only compliant terminology', () => {
          const compliantDoc = `
            MEMBER WELLNESS PROTOCOL

            ASSESSMENT SUMMARY:
            Based on comprehensive evaluation of live blood analysis and biomarker data,
            the following wellness approach is recommended for this member. Our assessment
            indicates areas requiring targeted nutritional support.

            WELLNESS APPROACH:
            1. Mineral Foundation: 90 Essential Nutrients support program
            2. ECS Optimization: Endocannabinoid system wellness support
            3. Frequency Therapy: Rife frequency application per standard protocol
            4. Cellular Support: NAD+ and mitochondrial restoration approach
            5. Detoxification: Parasite cleansing and gut restoration

            WELLNESS EDUCATION NOTES:
            This protocol supports the body's natural healing capacity. Members are encouraged
            to track their wellness journey. We recommend personalized approaches and suggest
            frequency therapy as a primary support modality.

            PMA DISCLAIMER:
            This document is private member-to-member wellness education within
            Forgotten Formula PMA. This operates under 1st and 14th Amendment constitutional
            protections. All communications are exclusively for private members.
          `.trim();

          const result = validateAIResponse(compliantDoc, callType);
          const hasPmaViolation = result.reasons.some(r => r.includes('PMA compliance'));
          expect(hasPmaViolation).toBe(false, `Unexpected PMA violation: ${result.reasons.join('; ')}`);
        });

        it('penalizes more severely when multiple prohibited terms appear', () => {
          const singleTermDoc = `${COMPLIANT_FILLER} This patient protocol addresses their needs. ${COMPLIANT_FILLER}`;
          const multiTermDoc = `${COMPLIANT_FILLER} This patient needs diagnosis and treatment with a prescription. ${COMPLIANT_FILLER}`;

          const singleResult = validateAIResponse(singleTermDoc, callType);
          const multiResult = validateAIResponse(multiTermDoc, callType);

          expect(multiResult.score).toBeLessThanOrEqual(singleResult.score);
        });
      });
    }
  });

  describe('PMA Compliance - Non-Protocol Call Types (no PMA gating)', () => {
    for (const callType of NON_PMA_CALL_TYPES) {
      it(`does NOT apply PMA compliance gating for call type: ${callType}`, () => {
        const nonCompliantResponse = `This patient needs a diagnosis and treatment. Medical advice should include a prescription to cure the condition.`;
        const result = validateAIResponse(nonCompliantResponse, callType);

        const hasPmaViolation = result.reasons.some(r => r.includes('PMA compliance'));
        expect(hasPmaViolation).toBe(false);
      });
    }
  });

  describe('PMA Sanitization - Score-Based Gating Enforces Rewrite', () => {
    it('non-compliant protocol-generation response fails quality gate (requires rewrite)', () => {
      const nonCompliantProtocol = `
        PATIENT TREATMENT PLAN

        DIAGNOSIS:
        After conducting a diagnosis of the patient's blood work, we recommend treatment
        with the following prescription medications. Medical advice should be followed
        strictly to cure the underlying condition. This treatment protocol requires
        the patient to comply with all prescribed treatments.

        The diagnosis indicates immediate treatment is necessary.
      `.trim();

      const result = validateAIResponse(nonCompliantProtocol, 'protocol-generation');

      const hasPmaViolation = result.reasons.some(r => r.includes('PMA compliance'));
      expect(hasPmaViolation).toBe(true);

      expect(result.score).toBeLessThan(100);
    });

    it('compliant protocol-generation response passes quality gate (no rewrite needed)', () => {
      const compliantProtocol = `
        MEMBER WELLNESS PROTOCOL - Spring 2026

        MEMBER ASSESSMENT SUMMARY:
        Based on comprehensive evaluation of live blood analysis and biomarker data, the following
        wellness approach is recommended for this member. Our assessment indicates areas requiring
        targeted nutritional support.

        RECOMMENDED WELLNESS APPROACH:
        1. Mineral Foundation: 90 Essential Nutrients support program
        2. ECS Optimization: Endocannabinoid system wellness support
        3. Frequency Therapy: Rife frequency application per standard protocol
        4. Cellular Support: NAD+ and mitochondrial restoration approach
        5. Detoxification: Parasite cleansing and gut restoration protocol

        WELLNESS EDUCATION NOTES:
        This protocol supports the body's natural healing capacity. Members are encouraged
        to track their wellness journey and communicate any changes to their support team.

        PMA DISCLAIMER:
        This communication is exclusively for private members of Forgotten Formula PMA
        and operates within constitutional protections under the 1st and 14th Amendments.
      `.trim();

      const result = validateAIResponse(compliantProtocol, 'protocol-generation');
      expect(result.pass).toBe(true);
      expect(result.score).toBeGreaterThan(60);

      const hasPmaViolation = result.reasons.some(r => r.includes('PMA compliance'));
      expect(hasPmaViolation).toBe(false);
    });

    it('violation reason includes prohibited term count for clear error reporting', () => {
      const multipleViolations = `${COMPLIANT_FILLER} The patient needs diagnosis and treatment. ${COMPLIANT_FILLER}`;
      const result = validateAIResponse(multipleViolations, 'protocol-generation');

      const pmaReason = result.reasons.find(r => r.includes('PMA compliance'));
      expect(pmaReason).toBeDefined();
      expect(pmaReason).toContain('prohibited term');
    });
  });

  describe('PMA Score Range and Structural Invariants', () => {
    it('score is always between 0 and 100 for all call types and edge cases', () => {
      const testCases: Array<[string, CallType]> = [
        ['', 'general'],
        ['Short.', 'protocol-generation'],
        ['I cannot help with that.', 'agent-chat'],
        ['A'.repeat(2000), 'document-generation'],
        ['The member wellness protocol supports natural healing.', 'general'],
        ['patient diagnosis treatment prescription cure.', 'protocol-generation'],
      ];

      for (const [response, callType] of testCases) {
        const result = validateAIResponse(response, callType);
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
      }
    });

    it('result always has score, pass, and non-empty reasons fields', () => {
      const result = validateAIResponse('test response content', 'general');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('pass');
      expect(result).toHaveProperty('reasons');
      expect(Array.isArray(result.reasons)).toBe(true);
      expect(result.reasons.length).toBeGreaterThan(0);
    });

    it('pass is true when score meets the minimum threshold for general call type (30)', () => {
      const goodResponse = 'The member wellness protocol provides comprehensive support for natural healing.';
      const result = validateAIResponse(goodResponse, 'general');

      expect(result.pass).toBe(result.score >= 30);
    });

    it('pass is false when score is below the minimum threshold', () => {
      const result = validateAIResponse('', 'protocol-generation');
      expect(result.pass).toBe(false);
    });
  });

  describe('Expected Fields Validation', () => {
    it('penalizes JSON response missing required protocol fields', () => {
      const incompleteJson = JSON.stringify({
        title: 'Protocol',
        steps: ['Step 1', 'Step 2'],
      });

      const result = validateAIResponse(incompleteJson, 'protocol-generation', [
        'title', 'steps', 'disclaimer', 'memberName', 'assessmentDate',
      ]);

      const hasMissingFields = result.reasons.some(r => r.includes('Missing fields'));
      expect(hasMissingFields).toBe(true);
      expect(result.score).toBeLessThan(100);
    });

    it('does not penalize when all expected protocol fields are present', () => {
      const completeJson = JSON.stringify({
        title: 'Member Protocol',
        steps: ['Mineral support', 'ECS optimization'],
        disclaimer: 'Private member communication under PMA constitutional protections.',
        memberName: 'Jane Doe',
        assessmentDate: '2026-03-23',
      });

      const result = validateAIResponse(completeJson, 'protocol-generation', [
        'title', 'steps', 'disclaimer', 'memberName', 'assessmentDate',
      ]);

      const hasMissingFields = result.reasons.some(r => r.includes('Missing fields'));
      expect(hasMissingFields).toBe(false);
    });
  });
});
