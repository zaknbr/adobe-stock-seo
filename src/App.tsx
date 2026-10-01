import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { QueueControl } from './components/QueueControl';
import { ItemCard } from './components/ItemCard';
import { ApiKeyModal } from './components/ApiKeyModal';
import { SEOInsightsModal } from './components/SEOInsightsModal';
import { ImageMetadataItem, AppSettings } from './types';
import { loadSettings, saveSettings } from './services/storage';
import { fileToOptimizedBase64 } from './utils/imageHelpers';
import { analyzeImageForAdobeStock } from './services/gemini';
import { generateAdobeStockCSV, downloadCSV } from './services/csvExport';
import { recordApiUsage } from './services/quotaTracker';
import { Search, Sparkles, Image as ImageIcon, Zap, CheckCircle2 } from 'lucide-react';

export function App() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [items, setItems] = useState<ImageMetadataItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'error'>('all');
  
  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSEOInsightsOpen, setIsSEOInsightsOpen] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  // Queue state refs
  const isProcessingRef = useRef(false);
  const itemsRef = useRef<ImageMetadataItem[]>([]);
  itemsRef.current = items;
  isProcessingRef.current = isProcessing;

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Convert files into initial items
  const handleFilesSelected = async (newFiles: File[]) => {
    const newItems: ImageMetadataItem[] = newFiles.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      file,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || 'image/jpeg',
      previewUrl: URL.createObjectURL(file),
      mimeType: file.type || 'image/jpeg',
      title: '',
      keywords: [],
      keywordsRaw: '',
      category: 8,
      categoryName: 'Graphic Resources',
      status: 'pending'
    }));

    setItems(prev => [...prev, ...newItems]);

    // If autoStart is enabled and API key is present, start processing
    if (settings.autoStartOnUpload && settings.geminiApiKey?.trim()) {
      setIsProcessing(true);
    }
  };

  // Single item processor
  const processSingleItem = async (itemId: string): Promise<boolean> => {
    const currentItem = itemsRef.current.find(i => i.id === itemId);
    if (!currentItem) return false;

    // Set item status to processing
    setItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, status: 'processing', errorMessage: undefined } : item
      )
    );

    const startTime = Date.now();

    try {
      // 1. Get base64 representation with alpha transparency detection
      const { base64, mimeType, isTransparent } = await fileToOptimizedBase64(currentItem.file);

      // 2. Send to Gemini Vision AI
      const result = await analyzeImageForAdobeStock(
        base64,
        mimeType,
        currentItem.fileName,
        settings.geminiApiKey,
        settings.model || 'gemini-3.5-flash-lite',
        isTransparent
      );

      // Record quota consumption in real time
      recordApiUsage(settings.geminiApiKey);

      const durationMs = Date.now() - startTime;

      // 3. Update item with SEO results
      setItems(prev =>
        prev.map(item =>
          item.id === itemId
            ? {
                ...item,
                title: result.title,
                keywords: result.keywords,
                keywordsRaw: result.keywordsRaw,
                category: result.category,
                categoryName: result.categoryName,
                status: 'completed',
                durationMs,
                processedAt: Date.now()
              }
            : item
        )
      );
      return true;
    } catch (err: any) {
      console.error(`Error processing item ${currentItem.fileName}:`, err);
      setItems(prev =>
        prev.map(item =>
          item.id === itemId
            ? {
                ...item,
                status: 'error',
                errorMessage: err.message || 'Failed to generate SEO metadata.'
              }
            : item
        )
      );
      return false;
    }
  };

  // Main Queue Loop
  useEffect(() => {
    if (!isProcessing) return;

    let isMounted = true;

    const runQueue = async () => {
      const concurrencyLimit = settings.concurrency || 2;

      while (isProcessingRef.current && isMounted) {
        const currentList = itemsRef.current;
        const pendingItems = currentList.filter(i => i.status === 'pending' || i.status === 'idle');
        const activeProcessing = currentList.filter(i => i.status === 'processing');

        if (pendingItems.length === 0 && activeProcessing.length === 0) {
          // Finished all
          setIsProcessing(false);
          break;
        }

        const availableSlots = concurrencyLimit - activeProcessing.length;
        if (availableSlots > 0 && pendingItems.length > 0) {
          const nextBatch = pendingItems.slice(0, availableSlots);
          // Trigger batch with smooth dispatch pacing to respect RPM limits
          for (const item of nextBatch) {
            processSingleItem(item.id);
            await new Promise(r => setTimeout(r, 900));
          }
        }

        // Delay between loop checks
        await new Promise(r => setTimeout(r, 800));
      }
    };

    runQueue();

    return () => {
      isMounted = false;
    };
  }, [isProcessing, settings.concurrency]);

  // Actions
  const handleStartProcessing = () => {
    if (!settings.geminiApiKey || !settings.geminiApiKey.trim()) {
      setIsSettingsOpen(true);
      return;
    }
    setIsProcessing(true);
  };

  const handlePauseProcessing = () => {
    setIsProcessing(false);
  };

  const handleRetryFailed = () => {
    setItems(prev =>
      prev.map(i => (i.status === 'error' ? { ...i, status: 'pending', errorMessage: undefined } : i))
    );
    if (!isProcessing) {
      setIsProcessing(true);
    }
  };

  const handleRegenerateItem = (id: string) => {
    if (!settings.geminiApiKey || !settings.geminiApiKey.trim()) {
      setIsSettingsOpen(true);
      return;
    }
    setItems(prev =>
      prev.map(i => (i.id === id ? { ...i, status: 'pending', errorMessage: undefined } : i))
    );
    processSingleItem(id);
  };

  const handleUpdateItem = (id: string, updates: Partial<ImageMetadataItem>) => {
    setItems(prev => prev.map(i => (i.id === id ? { ...i, ...updates } : i)));
  };

  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all images from the list?')) {
      setIsProcessing(false);
      setItems([]);
    }
  };

  const handleExportCSV = () => {
    const csvData = generateAdobeStockCSV(items);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadCSV(csvData, `adobe_stock_bulk_metadata_${dateStr}.csv`);
  };

  const handleCopyAll = async () => {
    const completedItems = items.filter(i => i.status === 'completed' || i.title);
    if (completedItems.length === 0) return;

    const formattedText = completedItems
      .map((item, idx) => {
        return `[#${idx + 1}] File: ${item.fileName}\nCategory: ${item.category}. ${item.categoryName}\nTitle:\n${item.title}\nKeywords:\n${item.keywords.join(', ')}\n${'='.repeat(40)}`;
      })
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(formattedText);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    } catch (err) {
      console.error('Failed to copy all items', err);
    }
  };

  // Filtered items for display
  const filteredItems = items.filter(item => {
    const matchesSearch =
      item.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'completed') return item.status === 'completed';
    if (statusFilter === 'pending') return item.status === 'pending' || item.status === 'processing';
    if (statusFilter === 'error') return item.status === 'error';

    return true;
  });

  const completedCount = items.filter(i => i.status === 'completed').length;

  return (
    <div className="min-h-screen bg-[#0D0E15] text-[#E2E8F0] flex flex-col font-sans">
      
      {/* Top Navbar */}
      <Header
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSEOInsights={() => setIsSEOInsightsOpen(true)}
        onClearAll={handleClearAll}
        hasItems={items.length > 0}
        totalProcessed={completedCount}
        totalItems={items.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Hero Section if no items */}
        {items.length === 0 ? (
          <div className="space-y-6 max-w-3xl mx-auto text-center py-6">
            
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Specialized for Adobe Stock Search Algorithm</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Bulk AI Metadata & SEO Ranking for <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-amber-400">Adobe Stock</span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-xl mx-auto">
                Generate high-converting titles under 200 characters, 50 top-weighted keywords, category IDs, and 1-click bulk upload CSV.
              </p>
            </div>

            {/* Drop Zone */}
            <DropZone
              onFilesSelected={handleFilesSelected}
              isProcessing={isProcessing}
              hasApiKey={Boolean(settings.geminiApiKey?.trim())}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-left">
              <div className="p-4 rounded-xl bg-[#141624] border border-[#222538] space-y-1">
                <div className="flex items-center gap-2 text-white font-semibold text-xs">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Top 10 Keyword Priority</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-normal">
                  Positions 1-10 are weighted highest by Adobe Stock's ranking algorithm.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#141624] border border-[#222538] space-y-1">
                <div className="flex items-center gap-2 text-white font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Exact 200 Char Titles</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-normal">
                  Commercial search intent with subject, lighting, and style composition.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#141624] border border-[#222538] space-y-1">
                <div className="flex items-center gap-2 text-white font-semibold text-xs">
                  <ImageIcon className="w-4 h-4 text-indigo-400" />
                  <span>Bulk 200+ Image CSV</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-normal">
                  Export standard RFC 4180 CSV for immediate bulk upload into Adobe Contributor portal.
                </p>
              </div>
            </div>

          </div>
        ) : (
          /* When items exist */
          <div className="space-y-6">
            
            {/* Queue Control Bar */}
            <QueueControl
              items={items}
              isProcessing={isProcessing}
              onStartProcessing={handleStartProcessing}
              onPauseProcessing={handlePauseProcessing}
              onRetryFailed={handleRetryFailed}
              onExportCSV={handleExportCSV}
              onCopyAll={handleCopyAll}
              copiedAll={copiedAll}
            />

            {/* Compact Mini Drop Zone for Adding More */}
            <div className="border border-dashed border-[#262A40] hover:border-red-500/50 bg-[#121420]/50 hover:bg-[#151827] rounded-xl p-3 text-center transition-colors">
              <label className="cursor-pointer text-xs text-gray-400 hover:text-white flex items-center justify-center gap-2">
                <ImageIcon className="w-4 h-4 text-red-400" />
                <span>Drag more files here or <span className="text-red-400 underline font-medium">Browse Files</span></span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,video/mp4"
                  onChange={(e) => {
                    if (e.target.files) handleFilesSelected(Array.from(e.target.files));
                    e.target.value = '';
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#141624] p-3 rounded-xl border border-[#222538]">
              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search filename, title, keyword..."
                  className="w-full bg-[#0E101A] border border-[#282C44] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-red-500 text-white font-semibold'
                      : 'bg-[#1D2032] text-gray-400 hover:text-white'
                  }`}
                >
                  All ({items.length})
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === 'completed'
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'bg-[#1D2032] text-gray-400 hover:text-white'
                  }`}
                >
                  Done ({completedCount})
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === 'pending'
                      ? 'bg-amber-600 text-white font-semibold'
                      : 'bg-[#1D2032] text-gray-400 hover:text-white'
                  }`}
                >
                  Pending ({items.filter(i => i.status === 'pending' || i.status === 'processing').length})
                </button>
                <button
                  onClick={() => setStatusFilter('error')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === 'error'
                      ? 'bg-rose-600 text-white font-semibold'
                      : 'bg-[#1D2032] text-gray-400 hover:text-white'
                  }`}
                >
                  Errors ({items.filter(i => i.status === 'error').length})
                </button>
              </div>
            </div>

            {/* List of Image Cards */}
            <div className="space-y-4">
              {filteredItems.map((item, index) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  index={index}
                  onUpdate={handleUpdateItem}
                  onRegenerate={handleRegenerateItem}
                  onDelete={handleDeleteItem}
                />
              ))}

              {filteredItems.length === 0 && (
                <div className="text-center py-12 text-gray-500 text-xs">
                  No images match your filter criteria.
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* Settings Modal */}
      <ApiKeyModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      {/* SEO Insights Modal */}
      <SEOInsightsModal
        isOpen={isSEOInsightsOpen}
        onClose={() => setIsSEOInsightsOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-[#1C1E2D] py-4 text-center text-xs text-gray-500 bg-[#10111A]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Adobe Stock AI SEO Metadata Generator • Built for maximum contributor sales</span>
          <span className="text-gray-400 font-mono text-[11px]">Ready for smartconverterbd.com deployment</span>
        </div>
      </footer>

    </div>
  );
}
export default App;
