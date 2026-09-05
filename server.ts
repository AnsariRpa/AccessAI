/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { AccessibilityProfile, CommunityReport, EvaluatedRoute, RouteLeg } from './src/types';
import { extractIntentWithGemini, explainRouteWithGemini, analyzeEntrancePhotoWithGemini } from './server/ai/gemini';
import { evaluateRouteAccessibility, RouteEvaluationInput } from './server/scoring/accessibilityScorer';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parsing with safe size limits
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// In-memory community reports registry (seeded with high-value provenance scenarios)
let communityReports: CommunityReport[] = [
  {
    id: 'rep-001',
    userId: 'user-community-1',
    authorName: 'Priya S. (Wheelchair Navigator)',
    location: {
      lat: 13.0827,
      lng: 80.2707,
      address: 'Chennai Central Station — North Concourse Gate 3',
    },
    category: 'blocked_ramp',
    severity: 'high',
    description: 'Cargo pallets and temporary delivery carts are blocking the sidewalk wheelchair ramp.',
    provenance: 'COMMUNITY_REPORTED',
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    upvotes: 14,
    aiClassification: {
      detectedObstacle: 'Pallets blocking ramp passage',
      aiConfidence: 0.92,
      visualObservations: ['Wooden pallets obstructing ramp slope', 'Less than 60cm clearance remaining'],
    },
  },
  {
    id: 'rep-002',
    userId: 'user-community-2',
    authorName: 'Marcus T.',
    location: {
      lat: 13.0850,
      lng: 80.2750,
      address: 'Metro Transit Station — Platform 1 Elevator',
    },
    category: 'broken_elevator',
    severity: 'critical_blocking',
    description: 'Elevator between street level and concourse is shut down for maintenance until 6 PM.',
    provenance: 'COMMUNITY_REPORTED',
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    upvotes: 27,
  },
  {
    id: 'rep-003',
    userId: 'user-community-3',
    authorName: 'Elena R. (Mobility Specialist)',
    location: {
      lat: 13.0810,
      lng: 80.2720,
      address: 'City Medical Center — West Clinic Entrance',
    },
    category: 'accessible_entrance_confirmed',
    severity: 'low',
    description: 'Confirmed wide automatic sliding doors and level grade threshold with tactile paving.',
    provenance: 'VERIFIED',
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    upvotes: 42,
  },
  {
    id: 'rep-004',
    userId: 'user-community-4',
    authorName: 'Devon K.',
    location: {
      lat: 13.0835,
      lng: 80.2680,
      address: 'Heritage Arts Walkway & Park Gate',
    },
    category: 'unexpected_stairs',
    severity: 'high',
    description: 'Unmarked flight of 18 granite steps with no ramp detour or signage.',
    provenance: 'COMMUNITY_REPORTED',
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    upvotes: 19,
  },
];

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'AccessAI',
    mission: 'Navigate the world with confidence',
    timestamp: new Date().toISOString(),
  });
});

// 1. Natural Language & Voice Intent Parsing Endpoint
app.post('/api/ai/intent', async (req: Request, res: Response) => {
  try {
    const { query, currentProfile } = req.body;
    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'Query string is required' });
      return;
    }
    const defaultProfile: AccessibilityProfile = {
      mobility: 'wheelchair_manual',
      avoidStairs: true,
      preferElevators: true,
      minimizeWalking: true,
      avoidSteepSlopes: true,
      avoidDifficultCrossings: true,
      maxWalkingMinutes: 25,
      requireWideDoors: true,
      requireCurbCuts: true,
    };

    const result = await extractIntentWithGemini(query, currentProfile || defaultProfile);
    res.json(result);
  } catch (err: any) {
    console.error('Intent route error:', err);
    res.status(500).json({ error: 'Failed to process intent', details: err.message });
  }
});

// 2. Multimodal Photo Inspection Endpoint
app.post('/api/ai/analyze-image', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType, userQuestion } = req.body;
    if (!imageBase64) {
      res.status(400).json({ error: 'imageBase64 is required' });
      return;
    }

    const result = await analyzeEntrancePhotoWithGemini(
      imageBase64,
      mimeType || 'image/jpeg',
      userQuestion
    );
    res.json(result);
  } catch (err: any) {
    console.error('Analyze image error:', err);
    res.status(500).json({ error: 'Failed to analyze image', details: err.message });
  }
});

// 3. Explain Route Endpoint
app.post('/api/ai/explain-route', async (req: Request, res: Response) => {
  try {
    const { route, profile } = req.body;
    if (!route || !profile) {
      res.status(400).json({ error: 'Route and profile are required' });
      return;
    }

    const explanation = await explainRouteWithGemini(route, profile);
    res.json({ explanation });
  } catch (err: any) {
    console.error('Explain route error:', err);
    res.status(500).json({ error: 'Failed to explain route', details: err.message });
  }
});

// 4. Accessibility Route Evaluation & Alternatives Engine
app.post('/api/routes/evaluate', async (req: Request, res: Response) => {
  try {
    const { destination, origin, profile } = req.body;
    const destName = destination || 'Chennai Central';
    const userProfile: AccessibilityProfile = profile || {
      mobility: 'wheelchair_manual',
      avoidStairs: true,
      preferElevators: true,
      minimizeWalking: true,
      avoidSteepSlopes: true,
      avoidDifficultCrossings: true,
      maxWalkingMinutes: 25,
      requireWideDoors: true,
      requireCurbCuts: true,
    };

    // Scenario A: The Accessible Recommended Route (Level sidewalks, curb ramps, zero stairs)
    const accessibleLegs: RouteLeg[] = [
      {
        id: 'leg-a1',
        instruction: 'Head north along Grand Boulevard accessible sidewalk',
        distanceMeters: 450,
        durationSeconds: 360,
        type: 'sidewalk',
        accessibilityStatus: 'passable',
        provenance: 'VERIFIED',
        details: 'Smooth concrete pavement with tactile ground indicators',
        confidence: 'HIGH',
      },
      {
        id: 'leg-a2',
        instruction: 'Cross 4th Avenue at pedestrian signal with audible chirps',
        distanceMeters: 60,
        durationSeconds: 50,
        type: 'crossing',
        accessibilityStatus: 'passable',
        provenance: 'OFFICIAL_SOURCE',
        details: 'Dual curb cuts with flush street transition and countdown timer',
        confidence: 'HIGH',
      },
      {
        id: 'leg-a3',
        instruction: 'Use West Transit Concourse Elevator to level 2',
        distanceMeters: 80,
        durationSeconds: 90,
        type: 'elevator',
        accessibilityStatus: 'passable',
        provenance: 'VERIFIED',
        details: 'Elevator verified operational today. 110cm door width.',
        confidence: 'HIGH',
      },
      {
        id: 'leg-a4',
        instruction: 'Proceed along covered ramp walkway directly to main station concourse',
        distanceMeters: 380,
        durationSeconds: 300,
        type: 'curb_ramp',
        accessibilityStatus: 'passable',
        provenance: 'VERIFIED',
        details: 'Gradual incline under 4.5% with continuous handrail',
        confidence: 'HIGH',
      },
      {
        id: 'leg-a5',
        instruction: 'Enter destination through automatic sliding doors',
        distanceMeters: 40,
        durationSeconds: 35,
        type: 'entrance',
        accessibilityStatus: 'passable',
        provenance: 'VERIFIED',
        details: 'Zero-step grade entry with automatic presence sensor',
        confidence: 'HIGH',
      },
    ];

    const inputRouteA: RouteEvaluationInput = {
      destination: destName,
      origin: origin || 'Current Location',
      rawDistanceMeters: 1010,
      rawDurationMinutes: 14,
      routeTitle: 'Accessible Promenade Route (Recommended)',
      summary: 'Via Grand Blvd & West Concourse Ramp',
      legs: accessibleLegs,
      nearbyReports: [], // Safely routes around known community obstructions
    };

    // Scenario B: Conventional "Fastest" Route (Shorter on traditional GPS, but contains blocking stairs!)
    const stairsLegs: RouteLeg[] = [
      {
        id: 'leg-b1',
        instruction: 'Head east on Direct Shortcut Alley',
        distanceMeters: 300,
        durationSeconds: 220,
        type: 'sidewalk',
        accessibilityStatus: 'caution',
        provenance: 'COMMUNITY_REPORTED',
        details: 'Narrow sidewalk with intermittent missing curb ramps',
        confidence: 'MEDIUM',
      },
      {
        id: 'leg-b2',
        instruction: 'Descend pedestrian underpass via granite staircase (18 steps)',
        distanceMeters: 120,
        durationSeconds: 150,
        type: 'stairs',
        accessibilityStatus: 'hazard',
        provenance: 'COMMUNITY_REPORTED',
        details: 'Flight of 18 steep steps. No ramp or lift present.',
        confidence: 'HIGH',
      },
      {
        id: 'leg-b3',
        instruction: 'Cross multi-lane highway without pedestrian signal',
        distanceMeters: 100,
        durationSeconds: 90,
        type: 'crossing',
        accessibilityStatus: 'caution',
        provenance: 'UNKNOWN',
        details: 'High-speed traffic crossing with high curb threshold',
        confidence: 'LOW',
      },
      {
        id: 'leg-b4',
        instruction: 'Arrive at East Station Portico steps',
        distanceMeters: 180,
        durationSeconds: 140,
        type: 'stairs',
        accessibilityStatus: 'hazard',
        provenance: 'COMMUNITY_REPORTED',
        details: 'Four entrance steps to doors. Revolving door only.',
        confidence: 'HIGH',
      },
    ];

    const inputRouteB: RouteEvaluationInput = {
      destination: destName,
      origin: origin || 'Current Location',
      rawDistanceMeters: 700,
      rawDurationMinutes: 10,
      routeTitle: 'Shortest Distance Route (Direct)',
      summary: 'Via Underpass & East Portico (Unsuitable for mobility profiles)',
      legs: stairsLegs,
      nearbyReports: communityReports.filter((r) => r.id === 'rep-001'),
    };

    // Scenario C: Alternative Route with unverified sidewalk sections
    const uncertainLegs: RouteLeg[] = [
      {
        id: 'leg-c1',
        instruction: 'Walk along Riverbank Esplanade',
        distanceMeters: 620,
        durationSeconds: 480,
        type: 'sidewalk',
        accessibilityStatus: 'unknown',
        provenance: 'UNKNOWN',
        details: 'Sidewalk surface conditions and curb cut status unverified',
        confidence: 'UNKNOWN',
      },
      {
        id: 'leg-c2',
        instruction: 'Cross pedestrian bridge at South Gate',
        distanceMeters: 250,
        durationSeconds: 200,
        type: 'curb_ramp',
        accessibilityStatus: 'passable',
        provenance: 'AI_INFERRED',
        details: 'Satellite analysis suggests gentle ramp approach',
        confidence: 'MEDIUM',
      },
      {
        id: 'leg-c3',
        instruction: 'Enter South Entrance',
        distanceMeters: 100,
        durationSeconds: 80,
        type: 'entrance',
        accessibilityStatus: 'unknown',
        provenance: 'UNKNOWN',
        details: 'Entrance threshold height unverified',
        confidence: 'UNKNOWN',
      },
    ];

    const inputRouteC: RouteEvaluationInput = {
      destination: destName,
      origin: origin || 'Current Location',
      rawDistanceMeters: 970,
      rawDurationMinutes: 13,
      routeTitle: 'Scenic River Path',
      summary: 'Via Riverbank Esplanade & South Gate',
      legs: uncertainLegs,
      nearbyReports: [],
    };

    // Calculate deterministic scores
    const evaluatedA = evaluateRouteAccessibility(inputRouteA, userProfile);
    const evaluatedB = evaluateRouteAccessibility(inputRouteB, userProfile);
    const evaluatedC = evaluateRouteAccessibility(inputRouteC, userProfile);

    // Contextualize with Gemini explanation in parallel with safety timeout
    try {
      const timeoutPromise = new Promise<string[]>((resolve) =>
        setTimeout(
          () =>
            resolve([
              evaluatedA.accessibilityScore >= 80
                ? 'Recommended for your profile: Continuous smooth sidewalks, zero stairs, and verified curb ramps.'
                : 'Caution: Potential barriers detected.',
              'Contains major barriers (flight of 18 steps without ramp). Avoid for wheeled mobility.',
              'Uncertain features present: Ground slope and entrance elevation unverified.',
            ]),
          4000
        )
      );

      const explanations = await Promise.race([
        Promise.all([
          explainRouteWithGemini(evaluatedA, userProfile),
          explainRouteWithGemini(evaluatedB, userProfile),
          explainRouteWithGemini(evaluatedC, userProfile),
        ]),
        timeoutPromise,
      ]);

      evaluatedA.geminiExplanation = explanations[0];
      evaluatedB.geminiExplanation = explanations[1];
      evaluatedC.geminiExplanation = explanations[2];
    } catch (explainErr) {
      console.warn('Gemini explanation fallback applied:', explainErr);
      evaluatedA.geminiExplanation = 'Recommended accessible path based on your mobility profile.';
      evaluatedB.geminiExplanation = 'Contains physical stairs and missing curb cuts.';
      evaluatedC.geminiExplanation = 'Contains unverified entrance elevation.';
    }

    res.json({
      destination: destName,
      profileUsed: userProfile,
      evaluatedRoutes: [evaluatedA, evaluatedB, evaluatedC],
    });
  } catch (err: any) {
    console.error('Route evaluation error:', err);
    res.status(500).json({ error: 'Failed to evaluate routes', details: err.message });
  }
});

// 5. Community Accessibility Reports
app.get('/api/reports', (req: Request, res: Response) => {
  res.json({
    reports: communityReports,
    total: communityReports.length,
  });
});

app.post('/api/reports', async (req: Request, res: Response) => {
  try {
    const { category, severity, description, location, authorName, imageBase64 } = req.body;

    if (!category || !description) {
      res.status(400).json({ error: 'Category and description are required' });
      return;
    }

    let aiClassification: any = undefined;
    if (imageBase64) {
      const visionResult = await analyzeEntrancePhotoWithGemini(imageBase64, 'image/jpeg', description);
      aiClassification = {
        detectedObstacle: visionResult.detectedBarriers.join(', ') || 'Obstacle analyzed from photo',
        aiConfidence: visionResult.confidence === 'HIGH' ? 0.94 : 0.76,
        visualObservations: visionResult.visualObservations,
      };
    }

    const newReport: CommunityReport = {
      id: `rep-${Date.now().toString(36)}`,
      userId: 'user-current',
      authorName: authorName || 'AccessAI Contributor',
      location: location || {
        lat: 13.0827,
        lng: 80.2707,
        address: 'Near Current Location',
      },
      category,
      severity: severity || 'medium',
      description,
      imageUrl: imageBase64 ? imageBase64.substring(0, 100) + '...' : undefined,
      aiClassification,
      provenance: 'COMMUNITY_REPORTED',
      status: 'active',
      createdAt: new Date().toISOString(),
      upvotes: 1,
    };

    communityReports.unshift(newReport);
    res.status(201).json({ success: true, report: newReport });
  } catch (err: any) {
    console.error('Create report error:', err);
    res.status(500).json({ error: 'Failed to submit report', details: err.message });
  }
});

// Upvote report
app.post('/api/reports/:id/upvote', (req: Request, res: Response) => {
  const report = communityReports.find(r => r.id === req.params.id);
  if (!report) {
    res.status(404).json({ error: 'Report not found' });
    return;
  }
  report.upvotes += 1;
  res.json({ success: true, upvotes: report.upvotes });
});

// 6. Accessible Place Discovery Endpoint
app.get('/api/places/search', (req: Request, res: Response) => {
  const { query, category } = req.query;

  const allPlaces = [
    {
      id: 'place-01',
      name: 'Central Harmony Library & Cultural Center',
      category: 'Public Facility / Library',
      address: '42 Civic Center Way, Central District',
      distanceKm: 0.6,
      matchScore: 96,
      entranceStatus: 'verified_accessible',
      restroomStatus: 'accessible',
      provenance: 'VERIFIED',
      confidence: 'HIGH',
      positivePoints: [
        'Automatic power-assist wide doors (120cm)',
        'Level grade throughout ground and elevator to all 4 floors',
        'Spacious accessible unisex restrooms with grab rails',
      ],
      cautionPoints: ['Heavy pedestrian traffic around main foyer between 3-5 PM'],
      location: { lat: 13.083, lng: 80.271 },
    },
    {
      id: 'place-02',
      name: 'Green Leaf Bistro & Garden Café',
      category: 'Restaurant / Café',
      address: '18 Garden Walk Avenue',
      distanceKm: 0.8,
      matchScore: 91,
      entranceStatus: 'ramp_available',
      restroomStatus: 'accessible',
      provenance: 'COMMUNITY_REPORTED',
      confidence: 'HIGH',
      positivePoints: [
        'Dedicated 1:12 slope ramp with dual handrails',
        'Movable outdoor and indoor seating with wheelchair clearances',
      ],
      cautionPoints: ['Restroom door is manual swing with medium tension'],
      location: { lat: 13.084, lng: 80.269 },
    },
    {
      id: 'place-03',
      name: 'St. Jude Comprehensive Medical Center & Pharmacy',
      category: 'Hospital / Healthcare',
      address: '100 Health Sciences Blvd',
      distanceKm: 1.2,
      matchScore: 98,
      entranceStatus: 'verified_accessible',
      restroomStatus: 'accessible',
      provenance: 'OFFICIAL_SOURCE',
      confidence: 'HIGH',
      positivePoints: [
        'Fully accessible medical campus with lowered check-in counters',
        'Wide elevators with braille and audio floor annunciators',
        'Designated accessible drop-off zone with flush curb ramp',
      ],
      cautionPoints: [],
      location: { lat: 13.086, lng: 80.274 },
    },
    {
      id: 'place-04',
      name: 'The Old Heritage Bakery & Tea House',
      category: 'Café / Bakery',
      address: '7 Old Town Square',
      distanceKm: 1.5,
      matchScore: 42,
      entranceStatus: 'step_access_only',
      restroomStatus: 'inaccessible',
      provenance: 'COMMUNITY_REPORTED',
      confidence: 'HIGH',
      positivePoints: ['Outdoor street-level tables available in dry weather'],
      cautionPoints: [
        'Three steps at main doorway with no ramp',
        'Restroom located down narrow winding basement staircase',
      ],
      location: { lat: 13.081, lng: 80.266 },
    },
  ];

  let filtered = [...allPlaces];
  if (category && category !== 'all') {
    const catLower = String(category).toLowerCase();
    filtered = filtered.filter((p) => p.category.toLowerCase().includes(catLower));
  }
  if (query) {
    const qLower = String(query).toLowerCase().trim();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(qLower) ||
        p.category.toLowerCase().includes(qLower) ||
        p.address.toLowerCase().includes(qLower) ||
        p.positivePoints.some((pt) => pt.toLowerCase().includes(qLower))
    );
  }

  res.json({ places: filtered });
});

// Vite Middleware for Development & Static serving for Production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AccessAI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
