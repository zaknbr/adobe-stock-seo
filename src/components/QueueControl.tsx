import React from 'react';
import { Play, Pause, RotateCcw, FileSpreadsheet, Copy, Check, Sparkles, Loader2 } from 'lucide-react';
import { ImageMetadataItem } from '../types';

interface QueueControlProps {
  items: ImageMetadataItem[];
  isProcessing: boolean;
  onStartProcessing: () => void;
  onPauseProcessing: () => void;
  onRetryFailed: () => void;
  onExportCSV: () => void;
  onCopyAll: () => void;
  copiedAll: boolean;
}

export const QueueControl: React.FC<QueueControlProps> = ({
  items,
  isProcessing,
  onStartProcessing,
  onPauseProcessing,
  onRetryFailed,
  onExportCSV,
  onCopyAll,
  copiedAll
}) => {
  const total = items.length;
  const completed = items.filter(i => i.status === 'completed').length;
  const processing = items.filter(i => i.status === 'processing').length;
  const failed = items.filter(i => i.status === 'error').length;
  const pending = items.filter(i => i.status === 'pending' || i.status === 'idle').length;

  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="bg-[#141624] border border-[#222538] rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      
      {/* Top Bar: Progress & Status Counts */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Status Badges */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-[#1C1F30] border border-[#2B2F48] text-gray-200 font-semibold">
            Total: <span className="text-white font-bold">{total}</span>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">
            Done: <span className="font-bold">{completed}</span>
          </span>
          {processing > 0 && (
            <span className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 font-medium flex items-center gap-1.5 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Processing: <span className="font-bold">{processing}</span>
            </span>
          )}
          {pending > 0 && (
            <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-medium">
              Waiting: <span className="font-bold">{pending}</span>
            </span>
          )}
          {failed > 0 && (
            <span className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-medium">
              Failed: <span className="font-bold">{failed}</span>
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Start / Pause Queue */}
          {pending > 0 && !isProcessing && (
            <button
              onClick={onStartProcessing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-semibold shadow-lg shadow-red-600/25 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Generate All SEO ({pending})</span>
            </button>
          )}

          {isProcessing && (
            <button
              onClick={onPauseProcessing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause Queue</span>
            </button>
          )}

          {/* Retry Failed */}
          {failed > 0 && !isProcessing && (
            <button
              onClick={onRetryFailed}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry ({failed})</span>
            </button>
          )}

          {/* Copy All */}
          {completed > 0 && (
            <button
              onClick={onCopyAll}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#202334] hover:bg-[#282C42] border border-[#2F344F] text-gray-200 text-xs font-medium transition-all"
              title="Copy all titles & keywords to clipboard"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
              <span>{copiedAll ? 'Copied!' : 'Copy All Text'}</span>
            </button>
          )}

          {/* Export CSV */}
          {completed > 0 && (
            <button
              onClick={onExportCSV}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all"
              title="Download official Adobe Stock compatible CSV file"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Adobe CSV</span>
            </button>
          )}

        </div>

      </div>

      {/* Progress Bar */}
      {total > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span>Overall Progress: {completed} / {total} Completed</span>
            <span className="font-mono font-bold text-gray-300">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-[#1B1D2C] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 via-rose-500 to-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

    </div>
  );
};
