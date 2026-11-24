import { ADOBE_STOCK_CATEGORIES } from '../constants/categories';
import { TitleSeoStyle } from '../types';
import { sanitizeStoredModel, parseApiKeys } from './storage';

export interface GeminiAnalysisResult {
  title: string;
  keywords: string[];
  keywordsRaw: string;
  category: number;
  categoryName: string;
}

export interface GeminiModelInfo {
  name: string;
  displayName: string;
  description: string;
  supportedGenerationMethods: string[];
}

function getSystemInstruction(titleStyle: TitleSeoStyle): string {
  const styleGuidelines =
    titleStyle === 'hybrid_seo'
      ? `1. **TITLE FORMULA — HIGH-CONVERTING HYBRID (DESCRIPTION + BUYER SEARCH KEYWORD CLUSTERS) [STRICTLY 180 TO 200 CHARACTERS]**:
   - **Why this sells #1 on Adobe Stock**: Top-selling Adobe Stock assets combine a clear, high-intent visual description in the first half with comma-separated high-volume buyer search phrases & keyword synonyms in the second half!
   - **Exact Structure to follow**:
     [Core Visual Description of Subject, Action & Details (first 85-110 chars)], [4 to 6 high-volume commercial search keyword phrases, synonyms & buyer use-cases separated by commas (filling up to 185-200 chars)]
   - **Example 1 (JPG Photo/Render)**:
     "Futuristic glowing blue AI brain circuit on dark tech motherboard, artificial intelligence concept, deep learning neural network, big data analytics, cyber technology background, future innovation" (197 chars)
   - **Example 2 (Transparent PNG Cutout)**:
     "Fresh ripe red strawberry with green leaf and water drops isolated on transparent background, organic berry fruit cutout, healthy sweet food ingredient, summer juice dessert element, natural vitamin" (198 chars)
   - **Crucial Rules**:
     * First 4-6 words MUST be the exact main subject buyers search for.
     * Pack zero-fluff, high-demand search nouns and commercial phrases into the title so the item matches 15+ different search queries in Adobe Stock's title weight engine.
     * Total length MUST be between 180 and 200 characters.`
      : titleStyle === 'keyword_power'
      ? `1. **TITLE FORMULA — MAXIMUM KEYWORD DENSITY & SEARCH CLUSTERS [STRICTLY 180 TO 200 CHARACTERS]**:
   - Pack the title with maximum commercial search phrases, synonyms, niche terms, and visual descriptors separated by commas.
   - Start with the exact primary subject phrase, followed by 7-9 high-converting search keyword clusters that buyers type into Adobe Stock search.
   - Example: "Golden bitcoin cryptocurrency coin on financial trading chart, digital money investment, blockchain finance technology, crypto market exchange, wealth profit growth, virtual currency banking concept" (198 chars)
   - Total length MUST be between 180 and 200 characters.`
      : `1. **TITLE FORMULA — NATURAL EDITORIAL & COMMERCIAL DESCRIPTION [STRICTLY 180 TO 200 CHARACTERS]**:
   - Write a detailed, natural, descriptive sentence explaining the subject, materials, colors, lighting, angle, and commercial context.
   - If isolated on a transparent background, naturally state "isolated on transparent background".
   - Total length MUST be between 180 and 200 characters.`;

  return `You are the world's #1 Top-Selling Adobe Stock SEO & Search Algorithm Specialist.
Your job is to inspect stock media (photos, AI art, 3D renders, vectors, and isolated transparent PNGs) and engineer metadata that ranks on Page 1 of Adobe Stock search and maximizes downloads/sales.

### CRITICAL ADOBE STOCK RANKING RULES:

${styleGuidelines}

2. **STRICT PROHIBITIONS IN TITLE**:
   - NEVER use useless filler words like "as a high quality PNG cutout graphic resource", "best wallpaper", "stock photo", "image of", "picture of". Every single word in the 200-character limit must be a real search keyword that buyers actually type into the search bar!
   - NEVER include brand names, company names, or trademarks (Apple, Nike, Midjourney, Photoshop, Tesla, etc.).

3. **50 KEYWORDS (STRICTLY ORDERED BY ADOBE STOCK WEIGHTING ALGORITHM)**:
   - Adobe Stock gives **70% of ranking power to the FIRST 10 KEYWORDS** and words that appear in BOTH the Title and the Top 10 Keywords!
   - **Keywords 1 to 10 (Highest Priority)**: Must be the top 10 highest-volume single words and 2-word search terms directly matching the main subject and the key terms in your Title.
   - **Keywords 11 to 25 (Secondary Subject & Visuals)**: Synonyms, specific parts, colors, lighting, mood, angle, background type (include "transparent background", "isolated", "cutout", "png" ONLY if the image is a transparent PNG).
   - **Keywords 26 to 40 (Commercial Buyer Intent & Industry)**: Industry niches, marketing concepts, use cases, buyer themes (e.g., advertising, banner, business, healthcare, finance, holiday, web design, copy space).
   - **Keywords 41 to 50 (Style & Medium)**: Format and rendering terms (e.g., generative ai, 3d render, illustration, digital art, photorealistic, modern, closeup).
   - Provide strictly 46 to 50 unique, comma-free keywords in the JSON array.

4. **CATEGORY (1 to 21)**:
   Select the single best fitting Adobe Stock category ID:
   1: Animals | 2: Buildings and Architecture | 3: Business | 4: Drinks | 5: The Environment | 6: States of Mind | 7: Food | 8: Graphic Resources | 9: Hobbies and Leisure | 10: Industry | 11: Landscapes | 12: Lifestyle | 13: People | 14: Plants and Flowers | 15: Culture and Religion | 16: Science | 17: Social Issues | 18: Sports | 19: Technology | 20: Transport | 21: Travel

Output ONLY valid JSON (do not wrap in markdown code fences):
{
  "title": "180 to 200 character SEO title packed with description and high-volume search keywords",
  "keywords": ["keyword 1", "keyword 2", "...", "keyword 50"],
  "category": 19
}`;
}

let cachedDiscoveredModels: string[] = [];
let lastKeyUsedForDiscovery = '';
let keyRoundRobinCounter = 0;
const deadModelsCache = new Set<string>();
let currentBestModel = '';

export function getNextApiKey(rawKeyString: string): string {
  const keys = parseApiKeys(rawKeyString);
  if (keys.length === 0) return '';
  const selected = keys[keyRoundRobinCounter % keys.length];
  keyRoundRobinCounter = (keyRoundRobinCounter + 1) % keys.length;
  return selected;
}

export async function fetchAvailableModels(rawKeyString: string): Promise<string[]> {
  const keys = parseApiKeys(rawKeyString);
  const apiKey = keys[0];
  if (!apiKey) return [];

  if (cachedDiscoveredModels.length > 0 && lastKeyUsedForDiscovery === apiKey) {
    return cachedDiscoveredModels;
  }

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!res.ok) return [];
    const data = await res.json();
    if (data && Array.isArray(data.models)) {
      const models = data.models
        .filter((m: GeminiModelInfo) => {
          const id = m.name.replace('models/', '').toLowerCase();
          if (id.startsWith('gemini-1.') || id.startsWith('gemini-2.0') || id.startsWith('gemini-2.5-flash')) {
            if (!id.includes('tts')) return false;
          }
          // Exclude non-vision/text-generation specialized models
          if (
            id.includes('tts') ||
            id.includes('embedding') ||
            id.includes('aqa') ||
            id.includes('audio') ||
            id.includes('imagen') ||
            id.includes('veo') ||
            id.includes('robotics') ||
            id.includes('computer-use') ||
            id.includes('thinking') ||
            id.includes('learnlm') ||
            id.includes('gemma-2-') ||
            id.includes('gemma-3-1b') ||
            id.includes('gemma-3-4b')
          ) {
            return false;
          }
          return m.supportedGenerationMethods?.includes('generateContent');
        })
        .map((m: GeminiModelInfo) => m.name.replace('models/', ''));

      cachedDiscoveredModels = models;
      lastKeyUsedForDiscovery = apiKey;
      return models;
    }
  } catch (e) {
    console.error('Failed to list Gemini models:', e);
  }
  return [];
}

function parseJsonSafely(rawText: string): any {
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
    }
    throw new Error('Could not parse JSON from model output');
  }
}

function trimTitleSafely(title: string): string {
  let clean = title.trim().replace(/^["']|["']$/g, '');
  if (clean.length <= 200) return clean;

  const sliced = clean.substring(0, 199);
  const lastComma = sliced.lastIndexOf(',');
  const lastSpace = sliced.lastIndexOf(' ');
  if (lastComma > 165) {
    return sliced.substring(0, lastComma).trim();
  }
  if (lastSpace > 150) {
    return sliced.substring(0, lastSpace).trim();
  }
  return sliced.trim();
}

function maximizeTitleSeoLength(title: string, keywords: string[]): string {
  let current = trimTitleSafely(title).replace(/\.$/, '');
  if (current.length >= 178) return current;

  const titleLower = current.toLowerCase();
  for (const kw of keywords) {
    const cleanKw = kw.trim();
    if (!cleanKw) continue;
    if (!titleLower.includes(cleanKw.toLowerCase())) {
      const candidate = `${current}, ${cleanKw}`;
      if (candidate.length <= 198) {
        current = candidate;
        if (current.length >= 182) break;
      }
    }
  }
  return trimTitleSafely(current);
}

function extractRetrySeconds(errorMsg: string): number {
  const match = errorMsg.match(/retry in\s+([\d.]+)\s*s/i);
  if (match && match[1]) {
    const s = parseFloat(match[1]);
    if (!isNaN(s) && s > 0) return Math.min(Math.ceil(s) + 1, 55);
  }
  return 0;
}

function buildRequestPayload(model: string, userPrompt: string, mimeType: string, cleanBase64: string, systemText: string) {
  const isGemma = model.toLowerCase().includes('gemma');

  if (isGemma) {
    return {
      contents: [
        {
          parts: [
            { text: `${systemText}\n\n---\n\n${userPrompt}` },
            {
              inline_data: {
                mime_type: mimeType || 'image/jpeg',
                data: cleanBase64
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.25,
        topP: 0.95
      }
    };
  }

  return {
    contents: [
      {
        parts: [
          { text: userPrompt },
          {
            inline_data: {
              mime_type: mimeType || 'image/jpeg',
              data: cleanBase64
            }
          }
        ]
      }
    ],
    systemInstruction: {
      parts: [{ text: systemText }]
    },
    generationConfig: {
      temperature: 0.25,
      topP: 0.95,
      responseMimeType: 'application/json'
    }
  };
}

/**
 * Unstoppable Image Analyzer:
 * - Discovers all live models on the user's account via `v1beta/models`.
 * - Cycles across every active vision model (`gemini-3.8-flash`, `gemini-3.5-flash-lite`, plus all discovered models including Gemma 4 31B/26B).
 * - When Google has a temporary "High Demand" spike, it waits and retries with live countdown feedback instead of failing!
 */
export async function analyzeImageForAdobeStock(
  base64Data: string,
  mimeType: string,
  fileName: string,
  rawApiKeys: string,
  preferredModel: string = 'gemini-3.8-flash',
  isTransparent: boolean = false,
  titleStyle: TitleSeoStyle = 'hybrid_seo',
  onStatusUpdate?: (msg: string) => void
): Promise<GeminiAnalysisResult> {
  const keys = parseApiKeys(rawApiKeys);
  if (keys.length === 0) {
    throw new Error('Google Gemini API Key is missing. Please add your API key in Settings.');
  }

  // Auto-discover exact model IDs enabled on this API key
  const discovered = await fetchAvailableModels(rawApiKeys);

  const cleanBase64 = base64Data.includes('base64,')
    ? base64Data.split('base64,')[1]
    : base64Data;

  const isPng = isTransparent || fileName.toLowerCase().endsWith('.png') || mimeType === 'image/png';

  const userPrompt = isPng
    ? `Visually inspect this transparent PNG image ("${fileName}"). It has an isolated transparent background (NO solid or black background). Generate an Adobe Stock Title (180-200 chars) combining a clear description ("... isolated on transparent background") followed by comma-separated high-volume search keyword clusters that buyers search for. Also generate 50 relevance-ordered keywords (top 10 most critical first) and category ID.`
    : `Visually inspect this image ("${fileName}"). Generate a high-converting Adobe Stock Title (180-200 chars) combining a clear visual description followed by comma-separated high-volume buyer search keyword clusters and synonyms to maximize search visibility. Also generate 50 relevance-ordered keywords (top 10 most critical first) and category ID.`;

  const systemText = getSystemInstruction(titleStyle);
  const primaryModel = sanitizeStoredModel(preferredModel);

  // Build ordered pool of all candidate vision models on the user's account
  const candidatePool = Array.from(
    new Set(
      [
        currentBestModel,
        primaryModel,
        'gemini-3.8-flash',
        'gemini-3.5-flash-lite',
        ...discovered
      ]
        .filter(Boolean)
        .filter(m => !deadModelsCache.has(m))
    )
  );

  let lastError: any = null;

  // Up to 12 attempts across our model pool so temporary 30-60 second Google "High Demand" spikes never break the batch
  for (let attempt = 1; attempt <= 12; attempt++) {
    const model = candidatePool[(attempt - 1) % candidatePool.length] || 'gemini-3.8-flash';
    const currentKey = getNextApiKey(rawApiKeys);

    if (onStatusUpdate && attempt > 1) {
      onStatusUpdate(`Trying ${model} (Attempt ${attempt})...`);
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${currentKey}`;
      const requestBody = buildRequestPayload(model, userPrompt, mimeType, cleanBase64, systemText);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMsg = errorData?.error?.message || `HTTP ${response.status} ${response.statusText}`;

        // If model is not found or doesn't support image input (400/404), blacklist it for this session and immediately try next model!
        if (
          response.status === 404 ||
          response.status === 400 ||
          errorMsg.toLowerCase().includes('not found') ||
          errorMsg.toLowerCase().includes('no longer available') ||
          errorMsg.toLowerCase().includes('not supported') ||
          errorMsg.toLowerCase().includes('multimodal') ||
          errorMsg.toLowerCase().includes('image')
        ) {
          deadModelsCache.add(model);
          continue;
        }

        lastError = new Error(errorMsg);

        // If we haven't tried all models in the pool yet, immediately try the next model without waiting!
        if (attempt < candidatePool.length) {
          continue;
        }

        // All models in pool were checked and Google is experiencing a temporary High Demand / 429 spike
        const retrySec = extractRetrySeconds(errorMsg);
        const waitSec = retrySec > 0 ? retrySec : Math.min(4 + attempt * 2, 20);

        if (onStatusUpdate) {
          onStatusUpdate(`Google AI Busy — Auto-waiting ${waitSec}s...`);
        }
        await new Promise(r => setTimeout(r, waitSec * 1000));
        continue;
      }

      const data = await response.json();
      const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textOutput) {
        throw new Error(`Empty response from ${model}`);
      }

      const parsed = parseJsonSafely(textOutput);

      let rawKeywordsList: string[] = Array.isArray(parsed?.keywords)
        ? parsed.keywords
        : typeof parsed?.keywords === 'string'
        ? parsed.keywords.split(',')
        : [];

      const cleanedKeywords: string[] = [];
      const seen = new Set<string>();

      for (const kw of rawKeywordsList) {
        const trimmed = String(kw || '').trim().toLowerCase();
        if (isPng && (trimmed.includes('black background') || trimmed.includes('dark background'))) {
          continue;
        }
        if (trimmed && !seen.has(trimmed) && trimmed.length < 50) {
          seen.add(trimmed);
          cleanedKeywords.push(String(kw).trim());
        }
      }

      let title = trimTitleSafely(String(parsed?.title || ''));
      if (isPng) {
        title = title
          .replace(/on\s+(a\s+)?(black|dark|solid)\s+background/gi, 'isolated on transparent background')
          .replace(/black\s+background/gi, 'transparent background');
      }
      title = maximizeTitleSeoLength(title, cleanedKeywords);

      let categoryId = Number(parsed?.category) || 8;
      if (categoryId < 1 || categoryId > 21) {
        categoryId = 8;
      }

      const categoryObj = ADOBE_STOCK_CATEGORIES.find(c => c.id === categoryId) || ADOBE_STOCK_CATEGORIES[7];

      // Remember this model as the current healthy winner!
      currentBestModel = model;

      return {
        title,
        keywords: cleanedKeywords.slice(0, 50),
        keywordsRaw: cleanedKeywords.slice(0, 50).join(', '),
        category: categoryId,
        categoryName: categoryObj.name
      };
    } catch (err: any) {
      lastError = err;
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  throw lastError || new Error('Google AI servers are temporarily overloaded. Will auto-retry.');
}
