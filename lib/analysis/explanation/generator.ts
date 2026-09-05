/**
 * LLM Explanation Generator
 *
 * Converts structured forensic evidence into readable plain-language explanations.
 *
 * SAFETY GUARANTEES:
 * 1. The LLM receives ONLY structured evidence — it cannot invent findings
 * 2. Output is validated with Zod schema
 * 3. Malformed output is rejected and retried (up to 2 times)
 * 4. System prompt explicitly prohibits fabrication
 * 5. The LLM determines EXPLANATION QUALITY, not forensic truth
 * 6. Classification is determined by the aggregation engine, not here
 */

import { z } from 'zod';
import type { DetectionSignal, ClassificationType } from '../../../src/types';
import type { CalibratedAssessment } from '../aggregation/engine';

/** Zod schema for validated explanation output */
const ExplanationOutputSchema = z.object({
  executiveSummary: z
    .string()
    .min(50)
    .max(800)
    .describe('Plain-language summary for non-technical readers'),
  technicalSummary: z
    .string()
    .min(50)
    .max(1000)
    .describe('Technical summary for analysts'),
  signalExplanations: z
    .array(
      z.object({
        signalKey: z.string(),
        plainLanguage: z.string().min(20).max(400),
        whyItMatters: z.string().min(20).max(300),
        limitations: z.string().min(20).max(300),
      })
    )
    .max(10),
  recommendedSteps: z.array(z.string().min(10).max(300)).min(1).max(6),
});

export type ExplanationOutput = z.infer<typeof ExplanationOutputSchema>;

const EXPLANATION_SYSTEM_PROMPT = `You are a forensic media analysis report writer. You receive STRUCTURED FORENSIC DATA and convert it into clear, accurate explanations.

STRICT RULES:
1. DO NOT invent, fabricate, or extrapolate any evidence beyond what is provided in the input data.
2. DO NOT claim certainty. Use language like "suggests", "indicates", "is consistent with", "may indicate".
3. DO NOT identify specific people or make defamatory claims.
4. DO NOT use the phrase "fake", "real", "authentic" without qualification.
5. DO NOT add any technical findings that are not present in the input signals.
6. DO make explanations accessible to journalists, lawyers, and non-technical readers.
7. DO explain WHY each signal matters forensically.
8. DO clearly state the limitations of each finding.
9. DO recommend concrete follow-up verification steps.

You must return a JSON object matching this exact schema and NOTHING ELSE:
{
  "executiveSummary": "2-3 sentences for non-technical readers",
  "technicalSummary": "3-4 sentences technical explanation",
  "signalExplanations": [
    {
      "signalKey": "signal identifier",
      "plainLanguage": "What this signal found in plain English",
      "whyItMatters": "Why this forensic finding is significant",
      "limitations": "What this signal cannot tell us"
    }
  ],
  "recommendedSteps": ["Specific verification step 1", "Specific verification step 2"]
}`;

/**
 * Generates plain-language explanations from structured forensic evidence.
 * Falls back to template-based explanations if Gemini is unavailable.
 */
export async function generateExplanation(
  signals: DetectionSignal[],
  assessment: CalibratedAssessment
): Promise<ExplanationOutput> {
  // Try real Gemini explanation if configured
  if (process.env.GEMINI_API_KEY && process.env.ENABLE_REAL_ANALYSIS === 'true') {
    const result = await tryGeminiExplanation(signals, assessment);
    if (result) return result;
  }

  // Fall back to template-based explanation
  return generateTemplateExplanation(signals, assessment);
}

async function tryGeminiExplanation(
  signals: DetectionSignal[],
  assessment: CalibratedAssessment,
  attempt = 1
): Promise<ExplanationOutput | null> {
  if (attempt > 2) return null;

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const evidencePayload = JSON.stringify({
      classification: assessment.classification,
      calibratedConfidence: assessment.calibratedConfidence,
      confidenceRange: assessment.confidenceRange,
      evidenceStrength: assessment.evidenceStrength,
      coverageRatio: assessment.coverageRatio,
      signals: signals.map((s) => ({
        key: s.id,
        name: s.name,
        category: s.category,
        status: s.status,
        score: s.score,
        confidence: s.confidence,
        primaryFinding: s.primaryFinding,
        technicalDetails: s.technicalDetails,
      })),
    });

    const response = await client.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: EXPLANATION_SYSTEM_PROMPT },
            {
              text: `Here is the structured forensic evidence. Convert it to explanations following the schema:\n\n${evidencePayload}`,
            },
          ],
        },
      ],
    });

    const rawText = response.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const parsed = JSON.parse(jsonMatch[0]);
    return ExplanationOutputSchema.parse(parsed);
  } catch (err) {
    console.warn(`[explanation] Gemini attempt ${attempt} failed:`, err);
    return tryGeminiExplanation(signals, assessment, attempt + 1);
  }
}

/** Template-based fallback explanation (no LLM required) */
function generateTemplateExplanation(
  signals: DetectionSignal[],
  assessment: CalibratedAssessment
): ExplanationOutput {
  const { classification, calibratedConfidence, confidenceRange, coverageRatio } = assessment;

  const classificationText = {
    LIKELY_AI_GENERATED: 'potentially AI-generated',
    POTENTIAL_MANIPULATION: 'potentially manipulated',
    LIKELY_AUTHENTIC: 'likely authentic',
    INCONCLUSIVE: 'inconclusive in its classification',
  }[classification];

  const executiveSummary = `This media has been assessed as ${classificationText} with ${calibratedConfidence}% calibrated confidence (range: ${confidenceRange[0]}–${confidenceRange[1]}%). The analysis examined ${coverageRatio.active} of ${coverageRatio.total} available signal families. This assessment is based on automated forensic analysis and should be verified by qualified human analysts before any consequential decision is made.`;

  const criticalSignals = signals.filter((s) => s.status === 'CRITICAL');
  const technicalSummary =
    criticalSignals.length > 0
      ? `${criticalSignals.length} critical forensic signal(s) were identified: ${criticalSignals.map((s) => s.name).join(', ')}. ${assessment.summaryRationale} Coverage across ${coverageRatio.active}/${coverageRatio.total} signal families.`
      : `No critical signals were identified. ${assessment.summaryRationale} Coverage across ${coverageRatio.active}/${coverageRatio.total} signal families.`;

  const signalExplanations = signals.slice(0, 5).map((s) => ({
    signalKey: s.id,
    plainLanguage: s.primaryFinding,
    whyItMatters: `This ${s.category.toLowerCase()} signal has a weight of ${Math.round(s.weight * 100)}% in the overall assessment. Status: ${s.status} (score: ${s.score}/100).`,
    limitations: `Confidence in this signal is ${s.confidence}%. ${s.status === 'INCONCLUSIVE' ? 'This signal was not determinative.' : 'This signal is one of multiple inputs to the overall assessment.'}`,
  }));

  const recommendedSteps = [
    'Request the original uncompressed source file from the content creator.',
    'Check if the media includes valid C2PA provenance credentials from a trusted issuer.',
    'Reverse-image search to identify the earliest known appearance of this media online.',
    'Cross-reference context claims against independent authoritative sources.',
    'Consult a qualified digital forensics professional for consequential decisions.',
  ];

  return {
    executiveSummary,
    technicalSummary,
    signalExplanations,
    recommendedSteps,
  };
}
