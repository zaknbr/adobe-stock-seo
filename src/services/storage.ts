import { AppSettings } from '../types';

const SETTINGS_KEY = 'adobe_stock_seo_settings_v1';

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
  concurrency: 1,
  autoStartOnUpload: true,
  targetKeywordCount: 50,
  prefixAiStyle: true,
  titleStyle: 'hybrid_seo'
};

export function sanitizeStoredModel(modelName?: string): string {
  if (!modelName) return 'gemini-3.8-flash';
  const clean = modelName.replace('models/', '').trim();
  if (!clean || RETIRED_MODELS.has(clean) || clean.startsWith('gemini-1.') || clean.startsWith('gemini-2.')) {
    return 'gemini-3.8-flash';
  }
  return clean;
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      parsed.model = sanitizeStoredModel(parsed.model);
      if (!parsed.titleStyle) {
        parsed.titleStyle = 'hybrid_seo';
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Error loading settings from localStorage', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  try {
    const cleanSettings = {
      ...settings,
      model: sanitizeStoredModel(settings.model)
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(cleanSettings));
  } catch (e) {
    console.error('Error saving settings to localStorage', e);
  }
}
