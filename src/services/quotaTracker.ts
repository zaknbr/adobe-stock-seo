export interface QuotaStats {
  dailyLimit: number;
  dailyUsed: number;
  dailyRemaining: number;
  dailyPercentUsed: number;
  rpmLimit: number;
  rpmUsed: number;
  resetHours: number;
  resetMinutes: number;
  lastUpdated: number;
}

const QUOTA_STORAGE_PREFIX = 'adobe_stock_quota_';

function getTodayKey(): string {
  // Use UTC date as Google AI Studio quotas reset at 00:00 UTC
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

function getApiKeyHash(apiKey: string): string {
  if (!apiKey) return 'default';
  // simple hash
  let hash = 0;
  for (let i = 0; i < apiKey.length; i++) {
    hash = (hash << 5) - hash + apiKey.charCodeAt(i);
    hash |= 0;
  }
  return `key_${Math.abs(hash)}`;
}

interface StoredQuota {
  date: string;
  requests: number[]; // Timestamps of requests made today
}

function getStoredData(apiKey: string): StoredQuota {
  const keyId = getApiKeyHash(apiKey);
  const raw = localStorage.getItem(`${QUOTA_STORAGE_PREFIX}${keyId}`);
  const today = getTodayKey();

  if (raw) {
    try {
      const parsed: StoredQuota = JSON.parse(raw);
      if (parsed.date === today && Array.isArray(parsed.requests)) {
        return parsed;
      }
    } catch (e) {
      console.error('Error parsing quota data', e);
    }
  }

  // Reset for new day
  const fresh: StoredQuota = { date: today, requests: [] };
  saveStoredData(apiKey, fresh);
  return fresh;
}

function saveStoredData(apiKey: string, data: StoredQuota): void {
  const keyId = getApiKeyHash(apiKey);
  try {
    localStorage.setItem(`${QUOTA_STORAGE_PREFIX}${keyId}`, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving quota data', e);
  }
}

/**
 * Records a single API request consumption
 */
export function recordApiUsage(apiKey: string): void {
  if (!apiKey?.trim()) return;
  const data = getStoredData(apiKey);
  const now = Date.now();
  data.requests.push(now);
  saveStoredData(apiKey, data);

  // Trigger custom event for real-time UI synchronization
  window.dispatchEvent(new CustomEvent('gemini_quota_updated'));
}

/**
 * Computes live quota statistics for the given API key
 */
export function getQuotaStats(apiKey: string): QuotaStats {
  const DAILY_LIMIT = 1500;
  const RPM_LIMIT = 15;

  if (!apiKey?.trim()) {
    return {
      dailyLimit: DAILY_LIMIT,
      dailyUsed: 0,
      dailyRemaining: DAILY_LIMIT,
      dailyPercentUsed: 0,
      rpmLimit: RPM_LIMIT,
      rpmUsed: 0,
      resetHours: 0,
      resetMinutes: 0,
      lastUpdated: Date.now()
    };
  }

  const data = getStoredData(apiKey);
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;

  // Requests in last 60 seconds
  const recentRequests = data.requests.filter(ts => ts > oneMinuteAgo);
  const rpmUsed = recentRequests.length;

  const dailyUsed = data.requests.length;
  const dailyRemaining = Math.max(0, DAILY_LIMIT - dailyUsed);
  const dailyPercentUsed = Math.min(100, Math.round((dailyUsed / DAILY_LIMIT) * 100));

  // Calculate time remaining until midnight UTC (Google AI Studio reset time)
  const nowUtc = new Date();
  const midnightUtc = new Date(Date.UTC(
    nowUtc.getUTCFullYear(),
    nowUtc.getUTCMonth(),
    nowUtc.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  const diffMs = midnightUtc.getTime() - nowUtc.getTime();
  const resetHours = Math.floor(diffMs / (1000 * 60 * 60));
  const resetMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return {
    dailyLimit: DAILY_LIMIT,
    dailyUsed,
    dailyRemaining,
    dailyPercentUsed,
    rpmLimit: RPM_LIMIT,
    rpmUsed,
    resetHours,
    resetMinutes,
    lastUpdated: now
  };
}
