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

const BASE_SYSTEM_INSTRUCTION = `You are a world-class Adobe Stock metadata and SEO specialist.
Analyze stock media (photos, 3D renders, vector illustrations, and isolated PNG elements) with deep visual precision. Generate high-converting, organically descriptive metadata strictly adhering to Adobe Stock search algorithms.

### CORE SEO GUIDELINES:

1. **TITLE (STRICTLY 180 TO 200 CHARACTERS)**:
   - **Deep Visual Specificity**: Thoroughly describe the actual subject, visible components, materials, colors, textures, lighting, perspective, action, and realistic commercial application.
   - **Target 180-200 Characters**: Use the full length to describe the scene/object in rich natural English without generic filler phrases.
   - **Background Context**: If the image has a transparent background / isolated cutout, simply and naturally mention "isolated on transparent background" or "isolated cutout".
   - **FORBIDDEN ROBOTIC FILLER**: NEVER use repetitive stock clichés such as "graphic resource", "as a high quality PNG cutout", "for design purposes", "best wallpaper", "stock photo". Every title must be unique, natural, and directly describe what is in the image.
   - **No Brand Names**: Never mention trademarked names (Apple, Nike, Photoshop, Midjourney, etc.).

2. **KEYWORDS (STRICTLY 45 TO 50 RELEVANT KEYWORDS)**:
   - Ordered strictly by relevance (Adobe Stock gives maximum ranking weight to the first 10 keywords).
   - **1-10**: Core subject, specific object parts, primary visual features.
   - **11-25**: Visual details, materials, colors, lighting, perspective, background type (e.g. transparent background, isolated if applicable).
   - **26-40**: Industry, functional use cases, concepts, commercial themes.
   - **41-50**: Medium/style (e.g. 3d render, generative ai, photography, illustration, photorealistic).
   - Ensure every keyword is unique, accurate, and relevant.

3. **CATEGORY (1 to 21)**:
   Select the single best fitting category ID:
   1: Animals | 2: Buildings and Architecture | 3: Business | 4: Drinks | 5: The Environment | 6: States of Mind | 7: Food | 8: Graphic Resources | 9: Hobbies and Leisure | 10: Industry | 11: Landscapes | 12: Lifestyle | 13: People | 14: Plants and Flowers | 15: Culture and Religion | 16: Science | 17: Social Issues | 18: Sports | 19: Technology | 20: Transport | 21: Travel

Output ONLY valid JSON:
{
  "title": "Natural, rich, descriptive sentence strictly between 180 and 200 characters describing the exact subject, details, and context",
  "keywords": ["keyword 1", "keyword 2", ..., "keyword 48"],
  "category": 10
}`;

let cachedDiscoveredModels: string[] = [];

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

function trimTitleSafely(title: string): string {
  let clean = title.trim().replace(/^["']|["']$/g, '');
  if (clean.length <= 200) return clean;

  const sliced = clean.substring(0, 199);
  const lastSpace = sliced.lastIndexOf(' ');
  if (lastSpace > 150) {
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

  const userPrompt = isPng
    ? `Visually inspect this image ("${fileName}"). Note that it is isolated on a transparent background with no solid backdrop. Describe the exact object, its materials, components, colors, angle, and functions in rich detail. Generate a natural SEO title (STRICTLY 180 TO 200 CHARACTERS), 45-50 relevant keywords, and the category ID. Avoid repetitive clichés.`
    : `Visually inspect this image ("${fileName}"). Describe all elements, colors, lighting, action, and context in rich detail. Generate a natural SEO title (STRICTLY 180 TO 200 CHARACTERS), 45-50 relevant keywords, and the category ID.`;

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
        { text: BASE_SYSTEM_INSTRUCTION }
      ]
    },
    generationConfig: {
      temperature: 0.3,
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMsg = errorData?.error?.message || `HTTP ${response.status} ${response.statusText}`;
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

  throw lastError || new Error('All model requests failed. Please check your API key.');
}
