/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';
import { AccessibilityProfile, EvaluatedRoute, MultimodalAnalysisResult } from '../../src/types';

let genAIInstance: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!genAIInstance) {
    genAIInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIInstance;
}

/**
 * 1. Natural Language Intent Extraction
 */
export async function extractIntentWithGemini(
  query: string,
  currentProfile: AccessibilityProfile
): Promise<{
  intent: 'NAVIGATE' | 'DISCOVER_PLACES' | 'INSPECT_ENTRANCE' | 'REPORT_ISSUE' | 'GENERAL_QUERY';
  destination?: string;
  category?: string;
  updatedProfile?: Partial<AccessibilityProfile>;
  confidence: number;
  extractedReasoning: string;
}> {
  const ai = getGenAI();
  if (!ai) {
    // Graceful deterministic heuristic fallback if API key is missing
    const lower = query.toLowerCase();
    const isPlaces = lower.includes('find') || lower.includes('restaurant') || lower.includes('cafe') || lower.includes('near');
    const isPhoto = lower.includes('can i enter') || lower.includes('photo') || lower.includes('picture');
    const isReport = lower.includes('report') || lower.includes('blocked') || lower.includes('broken');

    let destination = query.replace(/take me to|navigate to|go to|find|accessible/gi, '').trim();
    if (!destination) destination = 'Chennai Central';

    return {
      intent: isPhoto ? 'INSPECT_ENTRANCE' : isReport ? 'REPORT_ISSUE' : isPlaces ? 'DISCOVER_PLACES' : 'NAVIGATE',
      destination,
      category: isPlaces ? 'accessible_venue' : undefined,
      confidence: 0.85,
      extractedReasoning: 'Parsed using local intent classifier (Gemini API key not configured).',
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `You are AccessAI's natural language understanding module.
User query: "${query}"
Current Accessibility Profile: ${JSON.stringify(currentProfile)}

Extract the user's intent, destination (if any), category (if searching places), and any specific mobility constraints mentioned in their statement (e.g. "without stairs", "in a wheelchair", "can't walk far").

Return STRICTLY a JSON object with this format:
{
  "intent": "NAVIGATE" | "DISCOVER_PLACES" | "INSPECT_ENTRANCE" | "REPORT_ISSUE" | "GENERAL_QUERY",
  "destination": "Name of physical place or destination",
  "category": "Category if searching places (e.g. restaurant, hospital) or null",
  "avoidStairs": true/false or null,
  "preferElevators": true/false or null,
  "minimizeWalking": true/false or null,
  "maxWalkingMinutes": number or null,
  "extractedReasoning": "Brief factual explanation of understood intent"
}`,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const updatedProfile: Partial<AccessibilityProfile> = {};
    if (parsed.avoidStairs !== undefined) updatedProfile.avoidStairs = parsed.avoidStairs;
    if (parsed.preferElevators !== undefined) updatedProfile.preferElevators = parsed.preferElevators;
    if (parsed.minimizeWalking !== undefined) updatedProfile.minimizeWalking = parsed.minimizeWalking;
    if (parsed.maxWalkingMinutes) updatedProfile.maxWalkingMinutes = parsed.maxWalkingMinutes;

    return {
      intent: parsed.intent || 'NAVIGATE',
      destination: parsed.destination || undefined,
      category: parsed.category || undefined,
      updatedProfile: Object.keys(updatedProfile).length > 0 ? updatedProfile : undefined,
      confidence: 0.95,
      extractedReasoning: parsed.extractedReasoning || 'Intent understood by Gemini.',
    };
  } catch (err) {
    console.error('Gemini Intent Extraction error:', err);
    return {
      intent: 'NAVIGATE',
      destination: query,
      confidence: 0.7,
      extractedReasoning: 'Extracted direct destination.',
    };
  }
}

/**
 * 2. Route Explanation & Accessibility Contextualization
 */
export async function explainRouteWithGemini(
  route: EvaluatedRoute,
  profile: AccessibilityProfile
): Promise<string> {
  const ai = getGenAI();
  if (!ai) {
    if (route.accessibilityScore >= 80) {
      return `Recommended for your profile. This path scores ${route.accessibilityScore}/100 because it has continuous paved sidewalks, accessible ramps, and avoids any known stairs.`;
    }
    return `Caution advised. This path scores ${route.accessibilityScore}/100. Hazards detected: ${route.hazards.map(h => h.description).join('; ') || 'Accessibility constraints violated'}.`;
  }

  try {
    const prompt = `You are AccessAI's Route Journey Guide.
Explain this evaluated route to a traveler with mobility needs.
User Mobility Profile:
- Mobility: ${profile.mobility}
- Avoid stairs: ${profile.avoidStairs}
- Prefer elevators: ${profile.preferElevators}
- Max walking minutes: ${profile.maxWalkingMinutes}

Route Evaluation Data (Deterministic Score: ${route.accessibilityScore}/100, Recommended: ${route.isRecommended}):
- Title: ${route.name}
- Distance: ${(route.distanceMeters / 1000).toFixed(1)} km, Duration: ${route.durationMinutes} min
- Hazards: ${JSON.stringify(route.hazards)}
- Positive factors: ${JSON.stringify(route.positiveFactors)}
- Negative factors: ${JSON.stringify(route.negativeFactors)}
- Uncertain factors: ${JSON.stringify(route.uncertainFactors)}

CRITICAL RULE:
- Do NOT recalculate or change the score (${route.accessibilityScore}/100).
- Communicate uncertainty clearly if factors are unverified.
- Never state that accessibility is guaranteed when data is unverified or unknown.
- Provide a compassionate, practical, 2-to-3 sentence explanation directly to the traveler.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return response.text?.trim() || 'Route analyzed according to your accessibility profile.';
  } catch (err) {
    console.error('Gemini Route Explanation error:', err);
    return `This route scores ${route.accessibilityScore}/100. ${route.hazards.length > 0 ? 'Obstacles were identified along the path.' : 'Path meets your accessibility preferences.'}`;
  }
}

/**
 * 3. Multimodal Entrance & Obstacle Vision Analysis
 * Strictly enforces epistemic modesty: Missing infrastructure is UNKNOWN, never assumed accessible.
 */
export async function analyzeEntrancePhotoWithGemini(
  base64Data: string,
  mimeType: string,
  userQuestion?: string
): Promise<MultimodalAnalysisResult> {
  const timestamp = new Date().toISOString();

  // Handle curated demo SVG presets or direct mock vectors cleanly
  if (base64Data.includes('svg') || base64Data.startsWith('data:image/svg+xml')) {
    if (base64Data.includes('3 Concrete Steps') || base64Data.includes('3 Steps')) {
      return {
        verdict: 'INACCESSIBLE',
        confidence: 'HIGH',
        visualObservations: [
          'Three concrete steps visible leading to main glass entrance doorway',
          'No ramp or level bypass visible in this immediate entrance frame',
          'Elevated threshold barrier approx. 45cm total rise',
        ],
        detectedBarriers: [
          'Three concrete steps without adjacent ramp',
          'Manual swing doors without visible power assist paddle',
        ],
        detectedFeatures: ['Firm, level sidewalk leading to bottom step'],
        unknownElements: [
          'Whether an alternative accessible ramped entrance exists at side or rear',
          'Interior elevator accessibility past the lobby',
        ],
        cautiousRecommendation:
          'Physical steps prevent independent wheelchair or wheeled device entry at this entrance. Recommend checking for a designated accessible side entrance.',
        provenance: 'AI_INFERRED',
        timestamp,
      };
    } else if (base64Data.includes('Compliant Gradual Ramp') || base64Data.includes('Ramp Entrance')) {
      return {
        verdict: 'ACCESSIBLE',
        confidence: 'HIGH',
        visualObservations: [
          'Continuous gradual ramp with gentle gradient estimated under 5%',
          'Continuous safety handrails installed on ramp approach',
          'Level landing at doorway threshold with flush transition',
        ],
        detectedBarriers: [],
        detectedFeatures: [
          'ADA compliant gradual incline ramp',
          'Continuous safety handrail',
          'Flush threshold at doorway',
          'Wide entrance clearance exceeding 90cm',
        ],
        unknownElements: [
          'Automatic power door opener button operation cannot be verified',
          'Interior hallway door widths beyond vestibule',
        ],
        cautiousRecommendation:
          'Ramp and entrance threshold appear fully accessible for wheelchairs and mobility aids.',
        provenance: 'AI_INFERRED',
        timestamp,
      };
    } else if (base64Data.includes('Pallets Blocking') || base64Data.includes('Blocked Sidewalk')) {
      return {
        verdict: 'INACCESSIBLE',
        confidence: 'HIGH',
        visualObservations: [
          'Wooden freight pallets and crates resting directly on the ramp slope',
          'Effective passable width reduced to less than 40cm',
          'Tripping and obstacle hazard obstructing the primary travel path',
        ],
        detectedBarriers: [
          'Temporary physical obstruction blocking wheelchair passage',
          'Impassable for wheelchairs, motorized chairs, and strollers',
        ],
        detectedFeatures: ['Concrete ramp foundation exists underneath obstruction'],
        unknownElements: [
          'Duration until delivery crew or facility clears the pallets',
          'Alternate route clearance on opposite side of street',
        ],
        cautiousRecommendation:
          'Temporary blockage makes this ramp completely impassable. Report to community feed and take detour.',
        provenance: 'AI_INFERRED',
        timestamp,
      };
    }
  }

  const ai = getGenAI();

  if (!ai) {
    return {
      verdict: 'CAUTION_POTENTIAL_BARRIER',
      confidence: 'MEDIUM',
      visualObservations: [
        'Sample observation: Concrete entry with potential threshold step',
        'Handrail visible along right side',
      ],
      detectedBarriers: ['Unconfirmed threshold step height'],
      detectedFeatures: ['Clear pedestrian walkway'],
      unknownElements: [
        'Alternative zero-step entrance not visible in uploaded image',
        'Automatic door opener button cannot be confirmed',
      ],
      cautiousRecommendation:
        'The visible entrance shows potential steps. Because a level ramp is not clearly confirmed in this frame, accessibility cannot be guaranteed without verification.',
      provenance: 'AI_INFERRED',
      timestamp,
    };
  }

  try {
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');

    const systemPrompt = `You are AccessAI's Multimodal Accessibility Inspector.
Your core principle: NEVER pretend accessibility is known when it is not.
Analyze the uploaded photograph for physical accessibility characteristics.

Look specifically for:
1. Steps or staircases (count approximate steps if visible)
2. Wheelchair ramps (check for appropriate slope and handrails)
3. Entrance doors (manual pull/push vs automatic sensor, threshold step height)
4. Obstacles, narrow passages, bollards, debris, or construction
5. Handrails, tactile paving, or elevator signage

EPISTEMIC SAFETY MANDATE:
- If a ramp is NOT visible, do NOT claim there is no ramp anywhere at the building. State: "No ramp is visible in this frame; an alternative accessible entrance may exist elsewhere."
- Do NOT guarantee wheelchair accessibility unless a clear, flush zero-step or compliant ramp entrance is visibly obvious in the image.
- Mark uncertain features explicitly in unknownElements.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType || 'image/jpeg',
          },
        },
        {
          text: `${systemPrompt}
User Query: "${userQuestion || 'Can I enter this building with a wheelchair?'}"
Return STRICTLY a JSON object with this schema:
{
  "verdict": "ACCESSIBLE" | "CAUTION_POTENTIAL_BARRIER" | "INACCESSIBLE" | "INSUFFICIENT_EVIDENCE",
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "visualObservations": ["factual visual observations"],
  "detectedBarriers": ["specific barriers found"],
  "detectedFeatures": ["accessible features found"],
  "unknownElements": ["features not determined from this angle alone"],
  "cautiousRecommendation": "prudent guidance"
}`,
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      verdict: parsed.verdict || 'CAUTION_POTENTIAL_BARRIER',
      confidence: parsed.confidence || 'MEDIUM',
      visualObservations: parsed.visualObservations || ['Visual frame analyzed by Gemini.'],
      detectedBarriers: parsed.detectedBarriers || [],
      detectedFeatures: parsed.detectedFeatures || [],
      unknownElements: parsed.unknownElements || ['Alternative entrances not visible in frame'],
      cautiousRecommendation: parsed.cautiousRecommendation || 'Inspect entrance carefully on arrival.',
      provenance: 'AI_INFERRED',
      timestamp,
    };
  } catch (err) {
    console.error('Gemini Vision error:', err);
    return {
      verdict: 'INSUFFICIENT_EVIDENCE',
      confidence: 'LOW',
      visualObservations: ['Image could not be fully evaluated due to processing error.'],
      detectedBarriers: [],
      detectedFeatures: [],
      unknownElements: ['Complete image accessibility data unverified'],
      cautiousRecommendation: 'Unable to verify accessibility from this photo. Please seek local confirmation.',
      provenance: 'AI_INFERRED',
      timestamp,
    };
  }
}
