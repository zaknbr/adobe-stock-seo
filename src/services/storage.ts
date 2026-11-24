import { AppSettings } from '../types';

const SETTINGS_KEY = 'adobe_stock_seo_settings_v3';

const LEGACY_OR_DEPRECATED_MODELS = new Set([
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash'
]);

export const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: '',
  model: 'gemini-4-hydrogen',
  concurrency: 1,
  batchSize: 1,
  autoStartOnUpload: true,
  targetKeywordCount: 50,
  prefixAiStyle: true,
  titleStyle: 'hybrid_seo'
};

export function sanitizeStoredModel(modelName?: string): string {
  if (!modelName) return 'gemini-4-hydrogen';
  const clean = modelName.replace('models/', '').trim();
  if (
    !clean ||
    LEGACY_OR_DEPRECATED_MODELS.has(clean) ||
    clean.startsWith('gemini-1.') ||
    clean.startsWith('gemini-2.')
  ) {
    return 'gemini-4-hydrogen';
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
    const rawV3 = localStorage.getItem(SETTINGS_KEY);
    const rawV2 = localStorage.getItem('adobe_stock_seo_settings_v2');
    const rawV1 = localStorage.getItem('adobe_stock_seo_settings_v1');
    const raw = rawV3 || rawV2 || rawV1;

    if (raw) {
      const parsed = JSON.parse(raw);
      const settings: AppSettings = {
        ...DEFAULT_SETTINGS,
        ...parsed,
        model: sanitizeStoredModel(parsed.model),
        titleStyle: parsed.titleStyle || 'hybrid_seo',
        concurrency: rawV3 ? Number(parsed.concurrency) || 1 : 1,
        batchSize: 1
      };
      if (!rawV3) {
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
