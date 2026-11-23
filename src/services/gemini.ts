import { ADOBE_STOCK_CATEGORIES } from '../constants/categories';
import { TitleSeoStyle } from '../types';
import { sanitizeStoredModel } from './storage';

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

Output ONLY valid JSON:
{
  "title": "180 to 200 character SEO title packed with description and high-volume search keywords",
  "keywords": ["keyword 1", "keyword 2", "...", "keyword 50"],
  "category": 19
}`;
}

let cachedDiscoveredModels: string[] = [];

export async function fetchAvailableModels(apiKey: string): Promise<string[]> {
  if (!apiKey?.trim()) return [];

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`);
    if (!res.ok) return [];
    const data = await res.json();
    if (data && Array.isArray(data.models)) {
      const models = data.models
        .filter((m: GeminiModelInfo) => {
          const id = m.name.replace('models/', '');
          // Exclude retired 1.x / 2.x models and non-vision TTS/embedding models
          if (id.startsWith('gemini-1.') || id.startsWith('gemini-2.')) return false;
          if (id.includes('tts') || id.includes('embedding') || id.includes('aqa')) return false;
          return m.supportedGenerationMethods?.includes('generateContent');
        })
        .map((m: GeminiModelInfo) => m.name.replace('models/', ''));
      cachedDiscoveredModels = models;
      return models;
    }
  } catch (e) {
    console.error('Failed to list Gemini models:', e);
  }
  return [];
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

/**
 * Ensures the title utilizes the full 180-200 character SEO allowance by appending
 * top unmentioned keywords if the AI generated a slightly shorter title (< 175 chars).
 */
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

function extractRetryDelayMs(errorMsg: string): number {
  const match = errorMsg.match(/retry in\s+([\d.]+)\s*s/i);
  if (match && match[1]) {
    const sec = parseFloat(match[1]);
    if (!isNaN(sec) && sec > 0) {
      return Math.min(Math.ceil(sec * 1000) + 1200, 60000);
    }
  }
  return 4500;
}

export async function analyzeImageForAdobeStock(
  base64Data: string,
  mimeType: string,
  fileName: string,
  apiKey: string,
  preferredModel: string = 'gemini-3.8-flash',
  isTransparent: boolean = false,
  titleStyle: TitleSeoStyle = 'hybrid_seo',
  onStatusUpdate?: (msg: string) => void
): Promise<GeminiAnalysisResult> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Google Gemini API Key is missing. Please add your API key in Settings.');
  }

  const cleanBase64 = base64Data.includes('base64,')
    ? base64Data.split('base64,')[1]
    : base64Data;

  const isPng = isTransparent || fileName.toLowerCase().endsWith('.png') || mimeType === 'image/png';

  const userPrompt = isPng
    ? `Visually inspect this transparent PNG image ("${fileName}"). It has an isolated transparent background (NO solid or black background). Generate an Adobe Stock Title (180-200 chars) combining a clear description ("... isolated on transparent background") followed by comma-separated high-volume search keyword clusters that buyers search for. Also generate 50 relevance-ordered keywords (top 10 most critical first) and category ID.`
    : `Visually inspect this image ("${fileName}"). Generate a high-converting Adobe Stock Title (180-200 chars) combining a clear visual description followed by comma-separated high-volume buyer search keyword clusters and synonyms to maximize search visibility. Also generate 50 relevance-ordered keywords (top 10 most critical first) and category ID.`;

  const requestBody = {
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
      parts: [
        { text: getSystemInstruction(titleStyle) }
      ]
    },
    generationConfig: {
      temperature: 0.25,
      topP: 0.95,
      responseMimeType: 'application/json'
    }
  };

  const activeModel = sanitizeStoredModel(preferredModel);

  // Strictly modern active Gemini 3.x models only — never retired 2.0 or 1.5 models
  const candidateModels: string[] = [
    activeModel,
    'gemini-3.8-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    ...cachedDiscoveredModels.map(sanitizeStoredModel)
  ];

  const uniqueModels = Array.from(new Set(candidateModels.filter(Boolean)));

  let lastError: any = null;

  // Try models with smart rate-limit cooldown support
  for (let round = 0; round < 2; round++) {
    for (const model of uniqueModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          const errorMsg = errorData?.error?.message || `HTTP ${response.status} ${response.statusText}`;

          // If model doesn't exist for this account (404 / not found / no longer available), skip immediately to next model
          if (
            response.status === 404 ||
            errorMsg.toLowerCase().includes('not found') ||
            errorMsg.toLowerCase().includes('no longer available') ||
            errorMsg.toLowerCase().includes('not supported')
          ) {
            console.warn(`Model ${model} not available, skipping...`);
            continue;
          }

          // If rate limit (429) or temporary overload (503)
          if (
            response.status === 429 ||
            response.status === 503 ||
            errorMsg.toLowerCase().includes('quota') ||
            errorMsg.toLowerCase().includes('high demand') ||
            errorMsg.toLowerCase().includes('rate')
          ) {
            lastError = new Error(errorMsg);
            // First try switching to the next available model immediately
            if (round === 0 && uniqueModels.indexOf(model) < uniqueModels.length - 1) {
              console.warn(`Rate limit on ${model}, trying alternate active model...`);
              continue;
            }
            // If all models hit rate limit, wait the exact cooldown requested by Google and retry automatically
            const waitMs = extractRetryDelayMs(errorMsg);
            if (onStatusUpdate) {
              onStatusUpdate(`Rate limit cooldown (${Math.round(waitMs / 1000)}s)...`);
            }
            await new Promise(r => setTimeout(r, waitMs));
            continue;
          }

          lastError = new Error(errorMsg);
          continue;
        }

        const data = await response.json();
        const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textOutput) {
          throw new Error(`Empty response from model ${model}.`);
        }

        const parsed = JSON.parse(textOutput);

        // Clean Keywords first
        let rawKeywordsList: string[] = Array.isArray(parsed.keywords)
          ? parsed.keywords
          : (typeof parsed.keywords === 'string' ? parsed.keywords.split(',') : []);

        const cleanedKeywords: string[] = [];
        const seen = new Set<string>();

        for (const kw of rawKeywordsList) {
          const trimmed = kw.trim().toLowerCase();
          if (isPng && (trimmed.includes('black background') || trimmed.includes('dark background'))) {
            continue;
          }
          if (trimmed && !seen.has(trimmed) && trimmed.length < 50) {
            seen.add(trimmed);
            cleanedKeywords.push(kw.trim());
          }
        }

        // Clean and maximize Title SEO length (180-200 chars packed with high-value keywords)
        let title = trimTitleSafely(parsed.title || '');
        if (isPng) {
          title = title
            .replace(/on\s+(a\s+)?(black|dark|solid)\s+background/gi, 'isolated on transparent background')
            .replace(/black\s+background/gi, 'transparent background');
        }
        title = maximizeTitleSeoLength(title, cleanedKeywords);

        let categoryId = Number(parsed.category) || 8;
        if (categoryId < 1 || categoryId > 21) {
          categoryId = 8;
        }

        const categoryObj = ADOBE_STOCK_CATEGORIES.find(c => c.id === categoryId) || ADOBE_STOCK_CATEGORIES[7];

        return {
          title,
          keywords: cleanedKeywords.slice(0, 50),
          keywordsRaw: cleanedKeywords.slice(0, 50).join(', '),
          category: categoryId,
          categoryName: categoryObj.name
        };
      } catch (err: any) {
        console.warn(`Model "${model}" attempt failed:`, err.message);
        lastError = err;
        continue;
      }
    }
  }

  throw lastError || new Error('Failed to generate metadata. Please verify your Gemini API key in Settings.');
}
