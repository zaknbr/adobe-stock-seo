import React from 'react';
import { Key, HelpCircle, Trash2, Cpu, Code2 } from 'lucide-react';
import { AppSettings } from '../types';
import { QuotaBadge } from './QuotaBadge';

interface HeaderProps {
  settings: AppSettings;
  onOpenSettings: () => void;
  onOpenSEOInsights: () => void;
  onClearAll: () => void;
  hasItems: boolean;
  totalProcessed: number;
  totalItems: number;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onOpenSettings,
  onOpenSEOInsights,
  onClearAll,
  hasItems,
  totalProcessed,
  totalItems
}) => {
  const hasApiKey = Boolean(settings.geminiApiKey && settings.geminiApiKey.trim());

  return (
    <header className="border-b border-[#1E202F] bg-[#12131C]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo, Title & Developer Credit */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 p-[2px] shadow-lg shadow-red-500/20 shrink-0">
            <div className="w-full h-full bg-[#12131C] rounded-[10px] flex items-center justify-center">
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-400 text-lg">
                St
              </span>
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Adobe Stock <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 font-semibold">AI SEO PRO</span>
              </h1>
              
              {/* Developer Credit Badge */}
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-red-500/10 via-rose-500/10 to-amber-500/10 border border-red-500/20 text-[11px] shadow-sm">
                <Code2 className="w-3 h-3 text-red-400 shrink-0" />
                <span className="text-gray-400 font-normal">Developed by</span>
                <span className="font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-amber-400">
                  ZAKARIA MASUD
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400 hidden md:block">
              Bulk Titles, Top-10 Weighted Keywords & Adobe Stock CSV Generator
            </p>
          </div>
        </div>

        {/* Action Buttons & Live Quota */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Real-time Quota Telemetry Pill */}
          {hasApiKey && (
            <QuotaBadge apiKey={settings.geminiApiKey} />
          )}

          {/* SEO Algorithm Guide Button */}
          <button
            onClick={onOpenSEOInsights}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1A1C29] text-gray-300 hover:text-white hover:bg-[#232638] border border-[#2B2E42] transition-colors shadow-sm"
            title="Adobe Stock SEO Algorithm Insights"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">SEO Guide</span>
          </button>

          {/* Model Display Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-[#161824] border border-[#25283B] text-gray-400">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-gray-300 font-mono text-[11px]">{settings.model}</span>
          </div>

          {/* API Key Configure Button */}
          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm ${
              hasApiKey
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/40 hover:bg-red-500/20 animate-pulse'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{hasApiKey ? 'Settings' : 'Set API Key'}</span>
          </button>

          {/* Clear Button */}
          {hasItems && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors"
              title="Clear all images"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
