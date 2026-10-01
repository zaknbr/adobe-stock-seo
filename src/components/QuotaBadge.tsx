import React, { useState, useEffect } from 'react';
import { Activity, Clock, Zap, ExternalLink, ShieldCheck, ChevronDown } from 'lucide-react';
import { getQuotaStats, QuotaStats } from '../services/quotaTracker';

interface QuotaBadgeProps {
  apiKey: string;
}

export const QuotaBadge: React.FC<QuotaBadgeProps> = ({ apiKey }) => {
  const [stats, setStats] = useState<QuotaStats>(getQuotaStats(apiKey));
  const [isOpen, setIsOpen] = useState(false);

  const refreshStats = () => {
    setStats(getQuotaStats(apiKey));
  };

  useEffect(() => {
    refreshStats();

    // Listen for custom quota updates and periodic refresh
    const handleUpdate = () => refreshStats();
    window.addEventListener('gemini_quota_updated', handleUpdate);
    const interval = setInterval(refreshStats, 5000);

    return () => {
      window.removeEventListener('gemini_quota_updated', handleUpdate);
      clearInterval(interval);
    };
  }, [apiKey]);

  if (!apiKey?.trim()) return null;

  const isLow = stats.dailyRemaining < 150;
  const isExhausted = stats.dailyRemaining === 0;

  return (
    <div className="relative">
      
      {/* Trigger Pill */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all shadow-sm ${
          isExhausted
            ? 'bg-red-500/15 border-red-500/40 text-red-400'
            : isLow
            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
        }`}
        title="Click to view full real-time daily quota breakdown"
      >
        <div className={`w-2 h-2 rounded-full ${
          isExhausted ? 'bg-red-500' : isLow ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'
        }`} />
        <span className="font-mono">
          {stats.dailyRemaining.toLocaleString()} / {stats.dailyLimit.toLocaleString()} Left
        </span>
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-[#161824] border border-[#2B2E42] rounded-2xl shadow-2xl p-4 z-50 space-y-3.5 animate-fadeIn text-xs text-gray-200">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#23263B] pb-2.5">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white">Daily Quota Telemetry</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                100% Free Tier
              </span>
            </div>

            {/* Daily Usage Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-400">Used Today: <strong className="text-white font-mono">{stats.dailyUsed}</strong></span>
                <span className="text-emerald-400 font-bold font-mono">{stats.dailyRemaining} Images Left</span>
              </div>
              <div className="w-full h-2 bg-[#0F101A] rounded-full overflow-hidden border border-[#23263B]">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(4, 100 - stats.dailyPercentUsed)}%` }}
                />
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
              <div className="bg-[#0F101A] p-2.5 rounded-xl border border-[#23263B] space-y-0.5">
                <span className="text-[10px] text-gray-400 font-sans block flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" /> Current Speed
                </span>
                <span className="text-white font-bold text-xs">{stats.rpmUsed} / {stats.rpmLimit} RPM</span>
                <span className="text-[9px] text-gray-500 block font-sans">Requests in last 60s</span>
              </div>

              <div className="bg-[#0F101A] p-2.5 rounded-xl border border-[#23263B] space-y-0.5">
                <span className="text-[10px] text-gray-400 font-sans block flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-400" /> Daily Reset In
                </span>
                <span className="text-white font-bold text-xs">{stats.resetHours}h {stats.resetMinutes}m</span>
                <span className="text-[9px] text-gray-500 block font-sans">Resets at 00:00 UTC</span>
              </div>
            </div>

            {/* Link to Google AI Studio */}
            <div className="pt-1 border-t border-[#23263B] flex items-center justify-between">
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Live synced
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 hover:underline font-medium"
              >
                <span>Google Console Quotas</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

          </div>
        </>
      )}

    </div>
  );
};
