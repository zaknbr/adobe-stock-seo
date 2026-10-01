import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  RotateCw, 
  Trash2, 
  Edit3, 
  Tag, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  Layers, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { ImageMetadataItem } from '../types';
import { ADOBE_STOCK_CATEGORIES } from '../constants/categories';

interface ItemCardProps {
  item: ImageMetadataItem;
  index: number;
  onUpdate: (id: string, updates: Partial<ImageMetadataItem>) => void;
  onRegenerate: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  index,
  onUpdate,
  onRegenerate,
  onDelete
}) => {
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedKeywords, setCopiedKeywords] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isEditingKeywords, setIsEditingKeywords] = useState(false);

  const copyToClipboard = async (text: string, type: 'title' | 'keywords' | 'all') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'title') {
        setCopiedTitle(true);
        setTimeout(() => setCopiedTitle(false), 2000);
      } else if (type === 'keywords') {
        setCopiedKeywords(true);
        setTimeout(() => setCopiedKeywords(false), 2000);
      } else {
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    onUpdate(item.id, { title: newTitle });
  };

  const handleKeywordsRawChange = (raw: string) => {
    const splitKeywords = raw
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    onUpdate(item.id, {
      keywordsRaw: raw,
      keywords: splitKeywords
    });
  };

  const handleCategoryChange = (catId: number) => {
    const categoryObj = ADOBE_STOCK_CATEGORIES.find(c => c.id === catId);
    onUpdate(item.id, {
      category: catId,
      categoryName: categoryObj?.name || 'Graphic Resources'
    });
  };

  const titleCharCount = item.title ? item.title.length : 0;
  const keywordCount = item.keywords.length;

  return (
    <div className={`bg-[#141624] border rounded-2xl p-4 sm:p-5 transition-all shadow-lg ${
      item.status === 'processing'
        ? 'border-blue-500/50 ring-1 ring-blue-500/30'
        : item.status === 'error'
        ? 'border-red-500/40'
        : item.status === 'completed'
        ? 'border-[#272B40] hover:border-[#383D5C]'
        : 'border-[#1F2233]'
    }`}>
      <div className="flex flex-col lg:flex-row gap-5">
        
        {/* Left Column: Image Thumbnail & Meta Info */}
        <div className="w-full lg:w-48 shrink-0 flex flex-row lg:flex-col gap-3">
          
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 lg:w-full lg:h-44 rounded-xl bg-[#0C0D14] border border-[#23263B] overflow-hidden group shrink-0 flex items-center justify-center">
            {item.previewUrl ? (
              <img
                src={item.previewUrl}
                alt={item.fileName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="text-gray-600 text-xs font-mono">No Preview</div>
            )}

            {/* Index Badge */}
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-white font-mono text-[10px] font-bold">
              #{index + 1}
            </div>

            {/* Status Overlay */}
            {item.status === 'processing' && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-blue-400 gap-1.5">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-[11px] font-semibold">AI Inspecting...</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-1.5 flex flex-col justify-between lg:justify-start">
            <div>
              <p className="text-xs font-semibold text-gray-200 truncate" title={item.fileName}>
                {item.fileName}
              </p>
              <p className="text-[10px] text-gray-500 font-mono">
                {(item.fileSize / (1024 * 1024)).toFixed(2)} MB • {item.fileType.split('/')[1]?.toUpperCase() || 'IMG'}
              </p>
            </div>

            {/* Category Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                Category
              </label>
              <select
                value={item.category || 8}
                onChange={(e) => handleCategoryChange(Number(e.target.value))}
                disabled={item.status === 'processing'}
                className="w-full bg-[#0F101A] border border-[#282C44] rounded-lg px-2 py-1 text-[11px] text-gray-200 focus:outline-none focus:border-red-500 font-medium truncate"
              >
                {ADOBE_STOCK_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.id}. {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Card Action Buttons */}
            <div className="flex items-center gap-1.5 pt-1">
              <button
                onClick={() => onRegenerate(item.id)}
                disabled={item.status === 'processing'}
                className="p-1.5 rounded-lg bg-[#1B1E2E] hover:bg-[#25293E] text-gray-400 hover:text-white transition-colors"
                title="Regenerate AI SEO"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              
              <button
                onClick={() => copyToClipboard(`TITLE:\n${item.title}\n\nKEYWORDS:\n${item.keywords.join(', ')}`, 'all')}
                disabled={!item.title}
                className="p-1.5 rounded-lg bg-[#1B1E2E] hover:bg-[#25293E] text-gray-400 hover:text-white transition-colors"
                title="Copy Title + Keywords"
              >
                {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => onDelete(item.id)}
                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors ml-auto"
                title="Remove image"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>

        {/* Right Column: Title & Keywords Editing */}
        <div className="flex-1 space-y-3.5 min-w-0">
          
          {/* Error Banner */}
          {item.status === 'error' && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">AI Generation Failed:</span> {item.errorMessage || 'Please check your API key.'}
              </div>
            </div>
          )}

          {/* Title Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  SEO Title
                </label>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold border ${
                  titleCharCount > 200
                    ? 'bg-red-500/20 text-red-400 border-red-500/40'
                    : titleCharCount >= 180
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : titleCharCount >= 140
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {titleCharCount}/200 chars {titleCharCount >= 180 && titleCharCount <= 200 ? '★ SEO Optimal' : ''}
                </span>
              </div>

              <button
                onClick={() => copyToClipboard(item.title, 'title')}
                disabled={!item.title}
                className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white px-2 py-0.5 rounded hover:bg-[#202334] transition-colors"
              >
                {copiedTitle ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedTitle ? 'Copied' : 'Copy Title'}</span>
              </button>
            </div>

            <textarea
              value={item.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Descriptive, commercial intent title under 200 characters..."
              rows={2}
              className="w-full bg-[#0E101A] border border-[#262A40] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors leading-relaxed font-sans"
            />
          </div>

          {/* Keywords Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-400" />
                  Keywords (Rank Weighted)
                </label>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1D2032] text-indigo-300 font-semibold border border-indigo-500/20">
                  {keywordCount} Keywords
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsEditingKeywords(!isEditingKeywords)}
                  className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white px-2 py-0.5 rounded hover:bg-[#202334] transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isEditingKeywords ? 'View Tags' : 'Edit Comma List'}</span>
                </button>

                <button
                  onClick={() => copyToClipboard(item.keywords.join(', '), 'keywords')}
                  disabled={item.keywords.length === 0}
                  className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white px-2 py-0.5 rounded hover:bg-[#202334] transition-colors"
                >
                  {copiedKeywords ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKeywords ? 'Copied' : 'Copy Keywords'}</span>
                </button>
              </div>
            </div>

            {/* Keyword Pills Display or Raw Textarea */}
            {isEditingKeywords ? (
              <textarea
                value={item.keywordsRaw || item.keywords.join(', ')}
                onChange={(e) => handleKeywordsRawChange(e.target.value)}
                placeholder="keyword1, keyword2, keyword3..."
                rows={4}
                className="w-full bg-[#0E101A] border border-[#262A40] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors leading-relaxed font-mono"
              />
            ) : (
              <div className="p-3 bg-[#0E101A] border border-[#23273C] rounded-xl max-h-36 overflow-y-auto">
                {item.keywords.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {item.keywords.map((kw, kwIdx) => {
                      const isTop10 = kwIdx < 10;
                      return (
                        <span
                          key={kwIdx}
                          className={`text-[11px] px-2.5 py-0.5 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                            isTop10
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                              : 'bg-[#191B2B] text-gray-300 border border-[#292D46] hover:border-gray-500'
                          }`}
                          title={isTop10 ? `Top 10 High Priority Keyword (Rank #${kwIdx + 1})` : undefined}
                        >
                          {isTop10 && <span className="text-[9px] font-bold text-amber-400/80">#{kwIdx + 1}</span>}
                          <span>{kw}</span>
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-gray-600 text-xs py-2 text-center">
                    {item.status === 'processing' ? 'Generating keywords...' : 'No keywords yet. Click "Generate SEO" to start.'}
                  </div>
                )}
              </div>
            )}

            {/* Hint */}
            <p className="text-[10px] text-gray-500 flex items-center justify-between">
              <span>🌟 First 10 (gold badges) have top Adobe Stock search ranking priority</span>
              <span className="font-mono text-gray-400">Target: ~50 keywords</span>
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
