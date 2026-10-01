import { AppSettings } from '../types';

const SETTINGS_KEY = 'adobe_stock_seo_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: '',
  model: 'gemini-3.8-flash',
  concurrency: 2,
  autoStartOnUpload: true,
  targetKeywordCount: 50,
  prefixAiStyle: true
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Auto upgrade deprecated model name if found
      if (parsed.model === 'gemini-2.5-flash') {
        parsed.model = 'gemini-3.8-flash';
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
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings to localStorage', e);
  }
}
