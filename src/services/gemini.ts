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

const SYSTEM_INSTRUCTION = `You are the world's elite Adobe Stock SEO & Metadata Specialist and top-ranking Contributor Algorithm Master.
Your mission is to analyze stock images/media (including AI-generated artwork, 3D renders, photos, and digital illustrations) and generate ultra-high-converting, top-ranking metadata strictly compliant with Adobe Stock's search algorithm.

### CRITICAL ADOBE STOCK SEO ALGORITHM RULES:

1. **TITLE GUIDELINES (STRICTLY 180 TO 200 CHARACTERS FOR MAXIMUM SEO RANKING)**:
   - **Target Length**: Must be between 180 and 200 characters long (Never exceed 200 chars, never write short titles under 170 chars). Maximize rich descriptive details to capture every possible buyer search query.
   - **Structure formula**:
     [Primary Subject with commercial search terms] + [Specific action, attire or emotion] + [Surrounding environment, architecture or nature] + [Lighting, atmosphere, color palette] + [Style/Medium, composition & copy space context]
   - The first 4-6 words must contain the highest-volume commercial search query.
   - Flow naturally in fluent, grammatically correct English (do not make it just a list of keywords).
   - NEVER include brand names, trademarks, or model names (no "Apple", "Nike", "Midjourney", "DALL-E", "Photoshop").
   - NEVER use low-value filler words like "High quality image", "Wallpaper", "Best stock photo".

2. **KEYWORDS GUIDELINES (STRICTLY 45 TO 50 KEYWORDS, SORTED BY SEARCH RELEVANCE)**:
   - Adobe Stock search engine gives the HIGHEST RANKING WEIGHT to the first 10 keywords!
   - **Positions 1-10 (Primary Priority)**: The exact subject, key action, and direct focal points (e.g., 'robot cat', 'cybernetic feline', 'robotic pet', 'ai animal', 'cyborg cat', 'artificial pet').
   - **Positions 11-25 (Setting & Atmosphere)**: Environment, architecture, lighting, color mood (e.g., 'cyberpunk city', 'neon illumination', 'dark background', 'glowing circuits', 'futuristic architecture').
   - **Positions 26-40 (Concepts & Buyer Intent)**: Abstract concepts, feelings, commercial uses (e.g., 'innovation', 'artificial intelligence', 'future technology', 'science fiction', 'copy space', 'banner', 'smart city').
   - **Positions 41-50 (Style, Medium & Details)**: Medium, rendering technique (e.g., 'generative ai', 'ai generated', '3d render', 'digital art', 'cgi', 'concept art', 'photorealistic', 'cinematic lighting').
   - Total keywords MUST be between 45 and 50 unique keywords.
   - Include high-value multi-word phrases (e.g., 'artificial intelligence', 'copy space', 'smart technology').

3. **CATEGORY SELECTION (1 to 21)**:
   Select the single most accurate category ID from Adobe Stock's official list:
   1: Animals | 2: Buildings and Architecture | 3: Business | 4: Drinks | 5: The Environment | 6: States of Mind | 7: Food | 8: Graphic Resources | 9: Hobbies and Leisure | 10: Industry | 11: Landscapes | 12: Lifestyle | 13: People | 14: Plants and Flowers | 15: Culture and Religion | 16: Science | 17: Social Issues | 18: Sports | 19: Technology | 20: Transport | 21: Travel

Output ONLY valid JSON matching this schema:
{
  "title": "Rich descriptive title strictly between 180 and 200 characters containing subject, action, lighting, environment, and artistic style",
  "keywords": ["keyword 1", "keyword 2", ..., "keyword 48"],
  "category": 19
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
 * Execute single request with retry for temporary high demand (503 / 429)
 */
async function callGeminiApiWithRetry(
  url: string,
  requestBody: any,
  maxRetries: number = 2
): Promise<any> {
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
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

        const isTransient =
          response.status === 429 ||
          response.status === 503 ||
          errorMsg.toLowerCase().includes('high demand') ||
          errorMsg.toLowerCase().includes('quota') ||
          errorMsg.toLowerCase().includes('overloaded') ||
          errorMsg.toLowerCase().includes('resource has been exhausted');

        if (isTransient && attempt < maxRetries) {
          const delayMs = attempt * 1200;
          console.warn(`Gemini API busy (${errorMsg}). Retrying in ${delayMs}ms...`);
          await new Promise(r => setTimeout(r, delayMs));
          continue;
        }

        throw new Error(errorMsg);
      }

      return await response.json();
    } catch (err: any) {
      lastError = err;
      if (attempt < maxRetries && (err.message?.includes('high demand') || err.message?.includes('fetch'))) {
        await new Promise(r => setTimeout(r, attempt * 1200));
        continue;
      }
      break;
    }
  }

  throw lastError || new Error('Failed to reach Gemini API after retries.');
}

/**
 * Smartly trim title to under 200 characters without breaking words
 */
function trimTitleSafely(title: string): string {
  let clean = title.trim().replace(/^["']|["']$/g, '');
  if (clean.length <= 200) return clean;

  // Trim to last space before 200 chars
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
  preferredModel: string = 'gemini-3.8-flash'
): Promise<GeminiAnalysisResult> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Google Gemini API Key is missing. Please add your API key in Settings.');
  }

  const cleanBase64 = base64Data.includes('base64,')
    ? base64Data.split('base64,')[1]
    : base64Data;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `Analyze this image filename ("${fileName}") and visually inspect all elements in detail. Generate an SEO-rich Adobe Stock title (STRICTLY 180 TO 200 CHARACTERS), top-weighted 45-50 keywords, and category ID.`
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
          text: SYSTEM_INSTRUCTION
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
    : 'gemini-3.8-flash';

  const modelsToTry: string[] = [activeModel, 'gemini-3.8-flash', ...cachedDiscoveredModels];
  const uniqueModels = Array.from(new Set(modelsToTry.filter(Boolean)));

  let lastError: any = null;

  for (const model of uniqueModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
      const data = await callGeminiApiWithRetry(url, requestBody, 2);
      
      const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textOutput) {
        throw new Error(`Empty response from model ${model}.`);
      }

      const parsed = JSON.parse(textOutput);
      
      // Clean and safe trim Title to 180-200 characters max
      const title = trimTitleSafely(parsed.title || '');

      // Clean Keywords
      let rawKeywordsList: string[] = Array.isArray(parsed.keywords)
        ? parsed.keywords
        : (typeof parsed.keywords === 'string' ? parsed.keywords.split(',') : []);

      const cleanedKeywords: string[] = [];
      const seen = new Set<string>();

      for (const kw of rawKeywordsList) {
        const trimmed = kw.trim().toLowerCase();
        if (trimmed && !seen.has(trimmed) && trimmed.length < 50) {
          seen.add(trimmed);
          cleanedKeywords.push(kw.trim());
        }
      }

      // Ensure category is valid (1-21)
      let categoryId = Number(parsed.category) || 8;
      if (categoryId < 1 || categoryId > 21) {
        categoryId = 8;
      }

      const categoryObj = ADOBE_STOCK_CATEGORIES.find(c => c.id === categoryId) || ADOBE_STOCK_CATEGORIES[7];

      return {
        title,
        keywords: cleanedKeywords,
        keywordsRaw: cleanedKeywords.join(', '),
        category: categoryId,
        categoryName: categoryObj.name
      };
    } catch (err: any) {
      console.warn(`Model "${model}" attempt failed:`, err.message);
      lastError = err;
      continue;
    }
  }

  throw lastError || new Error('All Gemini model requests failed. Please check your API key and network connection.');
}
