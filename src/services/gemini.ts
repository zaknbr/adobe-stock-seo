import { ADOBE_STOCK_CATEGORIES } from '../constants/categories';

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

const BASE_SYSTEM_INSTRUCTION = `You are the world's elite Adobe Stock SEO & Metadata Specialist and top-ranking Contributor Algorithm Master.
Your mission is to analyze stock images/media (including transparent PNG cutouts, AI-generated artwork, 3D renders, photos, and digital illustrations) and generate ultra-high-converting, top-ranking metadata strictly compliant with Adobe Stock's search algorithm.

### CRITICAL ADOBE STOCK SEO ALGORITHM RULES:

1. **TITLE GUIDELINES (STRICTLY 180 TO 200 CHARACTERS FOR MAXIMUM SEO RANKING)**:
   - **Target Length**: Must be between 180 and 200 characters long (Never exceed 200 chars, never write short titles under 170 chars). Maximize rich descriptive details to capture every possible buyer search query.
   - Flow naturally in fluent, grammatically correct English (do not make it just a list of keywords).
   - The first 4-6 words must contain the highest-volume commercial search query.
   - NEVER include brand names, trademarks, or model names (no "Apple", "Nike", "Midjourney", "DALL-E", "Photoshop").
   - NEVER use low-value filler words like "High quality image", "Wallpaper", "Best stock photo".

2. **TRANSPARENT PNG & ISOLATED CUTOUT ASSETS SPECIAL RULE**:
   - If the image is a transparent PNG or isolated cutout, the title MUST explicitly state that it is "isolated on transparent background", "PNG cutout with alpha channel", "transparent PNG element".
   - NEVER hallucinate or describe a transparent PNG as having a "black background", "dark background", or "solid background".
   - In keywords, prioritize: "transparent background", "png", "isolated", "cutout", "no background", "alpha channel", "isolated on transparent", "clipart", "transparent png", "isolated element", "graphic resource".

3. **KEYWORDS GUIDELINES (STRICTLY 45 TO 50 KEYWORDS, SORTED BY SEARCH RELEVANCE)**:
   - Adobe Stock search engine gives the HIGHEST RANKING WEIGHT to the first 10 keywords!
   - **Positions 1-10 (Primary Priority)**: The exact subject, key action, and direct focal points (e.g., 'robot cat', 'isolated cat', 'transparent png', 'cutout animal', 'cyborg feline').
   - **Positions 11-25 (Asset Details & Context)**: Composition, colors, lighting, cutout properties (e.g., 'transparent background', 'no background', 'alpha channel', 'isolated on transparent', 'neon glow').
   - **Positions 26-40 (Concepts & Buyer Intent)**: Abstract concepts, feelings, commercial uses (e.g., 'innovation', 'graphic resource', 'design element', 'clipart', 'overlay', 'banner', 'advertising').
   - **Positions 41-50 (Style, Medium & Details)**: Medium, rendering technique (e.g., 'generative ai', 'ai generated', '3d render', 'digital art', 'cgi', 'photorealistic', 'png asset').
   - Total keywords MUST be between 45 and 50 unique keywords.
   - Include high-value multi-word phrases (e.g., 'transparent background', 'copy space', 'isolated object').

4. **CATEGORY SELECTION (1 to 21)**:
   Select the single most accurate category ID from Adobe Stock's official list:
   1: Animals | 2: Buildings and Architecture | 3: Business | 4: Drinks | 5: The Environment | 6: States of Mind | 7: Food | 8: Graphic Resources | 9: Hobbies and Leisure | 10: Industry | 11: Landscapes | 12: Lifestyle | 13: People | 14: Plants and Flowers | 15: Culture and Religion | 16: Science | 17: Social Issues | 18: Sports | 19: Technology | 20: Transport | 21: Travel
   *(Note: For isolated PNG cutouts and graphic design elements, Category 8 "Graphic Resources" is often ideal unless it depicts specific subjects like Animals #1, Food #7, People #13, or Technology #19).*

Output ONLY valid JSON matching this schema:
{
  "title": "Rich descriptive title strictly between 180 and 200 characters containing subject, action, lighting, environment/transparent background, and artistic style",
  "keywords": ["keyword 1", "keyword 2", ..., "keyword 48"],
  "category": 8
}`;

let cachedDiscoveredModels: string[] = [];

/**
 * Fetches the active list of available models for the user's API key
 */
export async function fetchAvailableModels(apiKey: string): Promise<string[]> {
  if (!apiKey?.trim()) return [];

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`);
    if (!res.ok) return [];
    const data = await res.json();
    if (data && Array.isArray(data.models)) {
      const models = data.models
        .filter((m: GeminiModelInfo) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m: GeminiModelInfo) => m.name.replace('models/', ''));
      cachedDiscoveredModels = models;
      return models;
    }
  } catch (e) {
    console.error('Failed to list Gemini models:', e);
  }
  return [];
}

/**
 * Smartly trim title to under 200 characters without breaking words
 */
function trimTitleSafely(title: string): string {
  let clean = title.trim().replace(/^["']|["']$/g, '');
  if (clean.length <= 200) return clean;

  const sliced = clean.substring(0, 199);
  const lastSpace = sliced.lastIndexOf(' ');
  if (lastSpace > 160) {
    return sliced.substring(0, lastSpace).trim();
  }
  return sliced.trim();
}

export async function analyzeImageForAdobeStock(
  base64Data: string,
  mimeType: string,
  fileName: string,
  apiKey: string,
  preferredModel: string = 'gemini-3.5-flash-lite',
  isTransparent: boolean = false
): Promise<GeminiAnalysisResult> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Google Gemini API Key is missing. Please add your API key in Settings.');
  }

  const cleanBase64 = base64Data.includes('base64,')
    ? base64Data.split('base64,')[1]
    : base64Data;

  const isPng = isTransparent || fileName.toLowerCase().endsWith('.png') || mimeType === 'image/png';

  const promptText = isPng
    ? `IMPORTANT: This is a TRANSPARENT PNG CUTOUT asset with NO background (isolated alpha transparency). Visually inspect the subject ("${fileName}"). Generate an SEO title (STRICTLY 180 TO 200 CHARACTERS) explicitly highlighting that it is 'isolated on transparent background' for graphic designers, 45-50 top-weighted keywords (including 'transparent background', 'png', 'isolated', 'cutout', 'alpha channel'), and category ID. NEVER mention black or dark background.`
    : `Analyze this image filename ("${fileName}") and visually inspect all elements in detail. Generate an SEO-rich Adobe Stock title (STRICTLY 180 TO 200 CHARACTERS), top-weighted 45-50 keywords, and category ID.`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: promptText
          },
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
        {
          text: BASE_SYSTEM_INSTRUCTION
        }
      ]
    },
    generationConfig: {
      temperature: 0.25,
      topP: 0.95,
      responseMimeType: 'application/json'
    }
  };

  const activeModel = preferredModel && preferredModel !== 'gemini-2.5-flash' && preferredModel !== 'gemini-1.5-flash'
    ? preferredModel.replace('models/', '').trim()
    : 'gemini-3.5-flash-lite';

  const modelsToTry: string[] = [
    activeModel,
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-2.0-flash',
    ...cachedDiscoveredModels
  ];

  const uniqueModels = Array.from(new Set(modelsToTry.filter(Boolean)));

  let lastError: any = null;

  for (const model of uniqueModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMsg = errorData?.error?.message || `HTTP ${response.status} ${response.statusText}`;
        console.warn(`Model ${model} error (${errorMsg}). Trying next model...`);
        lastError = new Error(errorMsg);
        continue;
      }

      const data = await response.json();
      const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textOutput) {
        throw new Error(`Empty response from model ${model}.`);
      }

      const parsed = JSON.parse(textOutput);
      
      // Clean and safe trim Title to 180-200 characters
      let title = trimTitleSafely(parsed.title || '');

      // Extra safeguard for transparent PNG: ensure it doesn't accidentally say "on black background"
      if (isPng) {
        title = title
          .replace(/on\s+(a\s+)?(black|dark|solid)\s+background/gi, 'isolated on transparent background')
          .replace(/black\s+background/gi, 'transparent background')
          .replace(/dark\s+background/gi, 'transparent background');
        title = trimTitleSafely(title);
      }

      // Clean Keywords
      let rawKeywordsList: string[] = Array.isArray(parsed.keywords)
        ? parsed.keywords
        : (typeof parsed.keywords === 'string' ? parsed.keywords.split(',') : []);

      // If transparent PNG, ensure primary transparent keywords are in top keywords
      if (isPng) {
        const transparentBoost = ['isolated on transparent background', 'transparent background', 'png cutout', 'isolated', 'no background', 'alpha channel'];
        rawKeywordsList = [...transparentBoost, ...rawKeywordsList];
      }

      const cleanedKeywords: string[] = [];
      const seen = new Set<string>();

      for (const kw of rawKeywordsList) {
        const trimmed = kw.trim().toLowerCase();
        // Discard accidental black background keywords for PNG
        if (isPng && (trimmed.includes('black background') || trimmed.includes('dark background'))) {
          continue;
        }

        if (trimmed && !seen.has(trimmed) && trimmed.length < 50) {
          seen.add(trimmed);
          cleanedKeywords.push(kw.trim());
        }
      }

      // Ensure category is valid (1-21)
      let categoryId = Number(parsed.category) || (isPng ? 8 : 8);
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

  throw lastError || new Error('All model requests failed. Please check your API key.');
}
