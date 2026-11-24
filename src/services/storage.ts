import { AppSettings } from '../types';

const SETTINGS_KEY = 'adobe_stock_seo_settings_v2';

const RETIRED_MODELS = new Set([
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite'
]);

export const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: '',
  model: 'gemini-3.8-flash',
  concurrency: 1, // Rock-solid 1-by-1 steady pacing (100 images in ~10-12 minutes with ZERO errors)
  batchSize: 1,
  autoStartOnUpload: true,
  targetKeywordCount: 50,
  prefixAiStyle: true,
  titleStyle: 'hybrid_seo'
};

export function sanitizeStoredModel(modelName?: string): string {
  if (!modelName) return 'gemini-3.8-flash';
  const clean = modelName.replace('models/', '').trim();
  if (
    !clean ||
    RETIRED_MODELS.has(clean) ||
    clean.startsWith('gemini-1.') ||
    clean.startsWith('gemini-2.') ||
    clean.includes('gemma')
  ) {
    return 'gemini-3.8-flash';
  }
  return clean;
}

export function parseApiKeys(rawKeys: string): string[] {
  if (!rawKeys) return [];
  return Array.from(
    new Set(
      rawKeys
        .split(/[\n,\s]+/)
        .map(k => k.trim())
        .filter(k => k.length > 15)
    )
  );
}

export function loadSettings(): AppSettings {
  try {
    // Also migrate API key from v1 if user had it saved earlier
    const rawV2 = localStorage.getItem(SETTINGS_KEY);
    const rawV1 = localStorage.getItem('adobe_stock_seo_settings_v1');
    const raw = rawV2 || rawV1;

    if (raw) {
      const parsed = JSON.parse(raw);
      const settings: AppSettings = {
        ...DEFAULT_SETTINGS,
        ...parsed,
        model: sanitizeStoredModel(parsed.model),
        titleStyle: parsed.titleStyle || 'hybrid_seo',
        // If migrating from v1, reset concurrency to 1 and batchSize to 1 for rock-solid stability
        concurrency: rawV2 ? Number(parsed.concurrency) || 1 : 1,
        batchSize: 1
      };
      if (!rawV2) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      }
      return settings;
    }
  } catch (e) {
    console.error('Error loading settings from localStorage', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  try {
    const cleanSettings: AppSettings = {
      ...settings,
      model: sanitizeStoredModel(settings.model),
      batchSize: 1
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(cleanSettings));
  } catch (e) {
    console.error('Error saving settings to localStorage', e);
  }
}
