/**
 * Google Gemini Vision Provider
 *
 * Uses Gemini's multimodal capabilities for:
 * - Image forensic analysis (structural anomaly detection)
 * - Metadata interpretation
 * - Context analysis for URL-submitted media
 *
 * Safety guarantees:
 * - Output validated with Zod schema
 * - Malformed output is rejected (not silently accepted)
 * - LLM cannot determine forensic finding — it only analyzes visual features
 * - System prompt explicitly prohibits fabrication
 */

import type { DetectionProvider, MediaInput, ProviderResult, ProviderSignal } from './interface';
import type { MediaType } from '../../../src/types';
import { z } from 'zod';

/** Zod schema for validated Gemini output */
const GeminiSignalSchema = z.object({
  key: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  category: z.enum(['OPTICAL', 'ACOUSTIC', 'METADATA', 'PROVENANCE', 'TEMPORAL', 'CONTAINER']),
  score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  status: z.enum(['NORMAL', 'ANOMALOUS', 'CRITICAL', 'INCONCLUSIVE']),
  weight: z.number().min(0).max(1),
  primaryFinding: z.string().min(1).max(500),
  technicalDetails: z.string().min(1).max(1000),
});

const GeminiOutputSchema = z.object({
  signals: z.array(GeminiSignalSchema).min(1).max(10),
  modelVersion: z.string(),
});

const SYSTEM_PROMPT = `You are a forensic media analysis assistant. Your role is to analyze visual and structural properties of media and return ONLY what you can directly observe.

STRICT RULES:
1. NEVER fabricate evidence. Only report observable features.
2. NEVER claim certainty. All findings are probabilistic observations.
3. NEVER invent metadata, camera information, or source information you cannot see.
4. NEVER identify specific people, make defamatory claims, or assert definitive authenticity.
5. Focus ONLY on technical forensic signals: compression artifacts, lighting consistency, noise patterns, structural anomalies, edge sharpness, shadow direction, frequency domain properties.
6. If you cannot observe a signal reliably, set status to INCONCLUSIVE and confidence below 50.

Return a JSON object matching this exact schema:
{
  "signals": [
    {
      "key": "unique_signal_id",
      "name": "Signal display name",
      "category": "OPTICAL|METADATA|PROVENANCE|TEMPORAL|CONTAINER",
      "score": 0-100,
      "confidence": 0-100,
      "status": "NORMAL|ANOMALOUS|CRITICAL|INCONCLUSIVE",
      "weight": 0.0-1.0,
      "primaryFinding": "Specific observable finding",
      "technicalDetails": "Technical explanation of the observation"
    }
  ],
  "modelVersion": "gemini-pro-vision-forensics"
}`;

export class GeminiProvider implements DetectionProvider {
  readonly name = 'GeminiProvider';
  readonly version = 'gemini-2.0-flash';
  readonly supportedTypes: readonly MediaType[] = ['image', 'url'];

  async analyze(input: MediaInput): Promise<ProviderResult> {
    const startTime = Date.now();

    if (input.mediaType !== 'image' && input.mediaType !== 'url') {
      // Gemini vision only supports images in this implementation
      return {
        providerName: this.name,
        providerVersion: this.version,
        signals: [],
        isDemoData: false,
        durationMs: 0,
        unavailableSignals: ['gemini_vision_analysis'],
      };
    }

    try {
      const { GoogleGenAI } = await import('@google/genai');
      const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

      // Fetch the image data
      const imageResponse = await fetch(input.url);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch media: ${imageResponse.status}`);
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Data = Buffer.from(imageBuffer).toString('base64');

      const response = await client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: SYSTEM_PROMPT },
              {
                inlineData: {
                  mimeType: input.mimeType,
                  data: base64Data,
                },
              },
              {
                text: 'Analyze this media for forensic signals. Return ONLY the JSON schema. Do not add any text before or after the JSON.',
              },
            ],
          },
        ],
      });

      const rawText = response.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Gemini response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const validated = GeminiOutputSchema.parse(parsed);

      const signals: ProviderSignal[] = validated.signals.map((s) => ({
        ...s,
        modelVersion: validated.modelVersion,
      }));

      return {
        providerName: this.name,
        providerVersion: validated.modelVersion,
        signals,
        isDemoData: false,
        durationMs: Date.now() - startTime,
      };
    } catch (err) {
      console.error('[GeminiProvider] Analysis failed:', err);

      // Return inconclusive signal instead of throwing
      return {
        providerName: this.name,
        providerVersion: this.version,
        signals: [
          {
            key: 'gemini_analysis_failed',
            name: 'AI Visual Analysis',
            category: 'OPTICAL',
            score: 50,
            confidence: 0,
            status: 'INCONCLUSIVE',
            weight: 0.1,
            primaryFinding: 'AI visual analysis could not be completed',
            technicalDetails: 'Provider returned an error or malformed response.',
            modelVersion: this.version,
          },
        ],
        isDemoData: false,
        durationMs: Date.now() - startTime,
        unavailableSignals: ['gemini_vision_analysis'],
      };
    }
  }
}
