import React from 'react';
import { X, CheckCircle2, TrendingUp, Search, Award, FileSpreadsheet, AlertTriangle } from 'lucide-react';

interface SEOInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SEOInsightsModal: React.FC<SEOInsightsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#161824] border border-[#2B2E42] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#23263B] bg-[#12131C]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Adobe Stock SEO & Ranking Mastery</h2>
              <p className="text-xs text-gray-400">How the search algorithm ranks your images to maximize sales</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#23263B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs text-gray-300">
          
          {/* Top 10 Keywords Rule */}
          <div className="p-4 rounded-xl bg-[#0F1017] border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Award className="w-4 h-4" />
              <span>Rule #1: The "Top 10 Keywords" Weighting Algorithm</span>
            </div>
            <p className="leading-relaxed text-gray-300">
              Unlike many search engines, <strong>Adobe Stock's search algorithm prioritizes keywords by position</strong>. The first 10 keywords receive the highest ranking weight. Our AI automatically places the most exact commercial search terms in positions 1 to 10.
            </p>
          </div>

          {/* Title Strategy */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200 flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-400" />
              Title Formula (Optimal: 180 - 200 Characters)
            </h3>
            <div className="bg-[#0F1017] p-3.5 rounded-xl border border-[#23263B] space-y-2 font-mono text-[11px]">
              <div className="text-indigo-300 font-semibold">
                [Primary Subject] + [Specific Action & Attire] + [Environment & Architecture] + [Atmosphere & Lighting] + [Artistic Medium & Commercial Context]
              </div>
              <p className="font-sans text-gray-400 text-xs">
                Adobe Stock searches match whole phrases and synonyms from the title. Keeping titles in the <strong>180–200 character sweet spot</strong> ensures you rank for 15+ different buyer search variations simultaneously!
              </p>
            </div>
          </div>

          {/* How to Bulk Upload via CSV on Adobe Stock */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              How to Bulk Upload with CSV on Adobe Stock
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-300 bg-[#0F1017] p-3.5 rounded-xl border border-[#23263B]">
              <li>Upload your image files (JPG/PNG/MP4) to Adobe Stock Contributor portal (via Web or SFTP).</li>
              <li>In this tool, click <strong>"Export Adobe CSV"</strong> to download your populated metadata sheet.</li>
              <li>On Adobe Stock Contributor Uploaded Files tab, click <strong>"Upload CSV"</strong>.</li>
              <li>Select the downloaded CSV. Adobe Stock will automatically match filenames and attach all Titles, Keywords, and Categories instantly!</li>
            </ol>
          </div>

          {/* Guidelines & Safety */}
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-red-300">
              <AlertTriangle className="w-4 h-4" />
              <span>Things to Avoid (Guaranteed Rejection Prevention)</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-gray-300">
              <li>No trademarked brands (e.g., Apple, Nike, Photoshop, ChatGPT).</li>
              <li>No keyword stuffing or random unrelated tags.</li>
              <li>Keep titles under 200 characters.</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#23263B] bg-[#12131C] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#23263B] hover:bg-[#2F334E] text-white transition-colors"
          >
            Got it, Let's Rank!
          </button>
        </div>

      </div>
    </div>
  );
};
