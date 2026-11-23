import React, { useState, useEffect } from 'react';
import { X, Key, ExternalLink, CheckCircle, ShieldCheck, Zap, Sliders, RefreshCw, Info, Sparkles } from 'lucide-react';
import { AppSettings, TitleSeoStyle } from '../types';
import { fetchAvailableModels } from '../services/gemini';
import { sanitizeStoredModel } from '../services/storage';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings
}) => {
  const [apiKey, setApiKey] = useState(settings.geminiApiKey || '');
  const [model, setModel] = useState(sanitizeStoredModel(settings.model));
  const [concurrency, setConcurrency] = useState(settings.concurrency || 1);
  const [autoStart, setAutoStart] = useState(settings.autoStartOnUpload ?? true);
  const [titleStyle, setTitleStyle] = useState<TitleSeoStyle>(settings.titleStyle || 'hybrid_seo');
  
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [discoveredModels, setDiscoveredModels] = useState<string[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setModel(sanitizeStoredModel(settings.model));
      setTitleStyle(settings.titleStyle || 'hybrid_seo');
      if (apiKey.trim()) {
        handleDiscoverModels();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings({
      ...settings,
      geminiApiKey: apiKey.trim(),
      model: sanitizeStoredModel(model),
      concurrency: Number(concurrency),
      autoStartOnUpload: autoStart,
      titleStyle
    });
    onClose();
  };

  const handleDiscoverModels = async () => {
    if (!apiKey.trim()) return;
    setIsDiscovering(true);
    try {
      const list = await fetchAvailableModels(apiKey.trim());
      if (list.length > 0) {
        setDiscoveredModels(list);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      setTestStatus('failed');
      setTestMessage('Please enter an API key first.');
      return;
    }

    const activeModel = sanitizeStoredModel(model);
    setTestStatus('testing');
    setTestMessage(`Testing API connection with ${activeModel}...`);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${apiKey.trim()}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Respond with OK' }] }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errMsg = errorData?.error?.message || `HTTP ${response.status}`;

        if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('rate')) {
          setTestStatus('success');
          setTestMessage(`API Key is Valid! (${errMsg}). Auto-cooldown & fallback will automatically handle rate limits.`);
          return;
        }

        throw new Error(errMsg);
      }

      setTestStatus('success');
      setTestMessage(`Connection successful! ${activeModel} is active and ready.`);
      handleDiscoverModels();
    } catch (err: any) {
      setTestStatus('failed');
      setTestMessage(`Test note: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#161824] border border-[#2B2E42] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#23263B] bg-[#12131C]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Gemini API & SEO Strategy Settings</h2>
              <p className="text-xs text-gray-400">Configure your Google AI key & Title Keyword Strategy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#23263B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Title SEO Strategy Mode Selector */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Adobe Stock Title SEO Formula (Sales Booster)
            </label>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setTitleStyle('hybrid_seo')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  titleStyle === 'hybrid_seo'
                    ? 'bg-amber-500/15 border-amber-500/60 text-white ring-1 ring-amber-500/30'
                    : 'bg-[#0F1017] border-[#25283B] text-gray-400 hover:border-[#353952]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-white">🔥 Hybrid: Description + Search Keyword Clusters</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                    #1 Best Seller Mode
                  </span>
                </div>
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  Starts with a clear visual description, then packs 4-6 high-volume comma-separated buyer search phrases (180-200 chars) so your item ranks for 15+ search queries at once!
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTitleStyle('keyword_power')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  titleStyle === 'keyword_power'
                    ? 'bg-red-500/15 border-red-500/60 text-white ring-1 ring-red-500/30'
                    : 'bg-[#0F1017] border-[#25283B] text-gray-400 hover:border-[#353952]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-white">⚡ Maximum Keyword Density (Heavy Keyword Stuffing)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-semibold">
                    Aggressive SEO
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Packs 7-9 commercial search keyword phrases and synonyms separated by commas across the entire 180-200 character title.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTitleStyle('descriptive')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  titleStyle === 'descriptive'
                    ? 'bg-indigo-500/15 border-indigo-500/60 text-white'
                    : 'bg-[#0F1017] border-[#25283B] text-gray-400 hover:border-[#353952]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-white">📝 Pure Descriptive Sentence</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">Editorial</span>
                </div>
              </button>
            </div>
          </div>

          {/* API Key Input */}
          <div className="space-y-2 pt-2 border-t border-[#23263B]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                Google Gemini API Key <span className="text-red-400">*</span>
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 hover:underline font-medium"
              >
                <span>Get Free Key (Instant)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 bg-[#0F1017] border border-[#2B2E42] rounded-xl text-white font-mono text-xs placeholder:text-gray-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-gray-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline" />
                Key stored in your browser only.
              </p>
              <button
                onClick={handleTestKey}
                disabled={testStatus === 'testing'}
                className="text-xs px-2.5 py-1 rounded bg-[#23263B] hover:bg-[#2C304A] text-gray-300 hover:text-white transition-colors"
              >
                {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
              </button>
            </div>

            {testStatus === 'success' && (
              <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 shrink-0" />
                {testMessage}
              </p>
            )}

            {testStatus === 'failed' && (
              <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg">
                {testMessage}
              </p>
            )}
          </div>

          {/* Model Selection */}
          <div className="space-y-2.5 pt-2 border-t border-[#23263B]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Active Vision AI Model (Gemini 3.8 / 3.5)
              </label>
              <button
                type="button"
                onClick={handleDiscoverModels}
                disabled={isDiscovering || !apiKey.trim()}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isDiscovering ? 'animate-spin' : ''}`} />
                <span>Fetch Live Models</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setModel('gemini-3.8-flash')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  model === 'gemini-3.8-flash'
                    ? 'bg-red-500/15 border-red-500/60 text-white shadow-sm ring-1 ring-red-500/30'
                    : 'bg-[#0F1017] border-[#25283B] text-gray-400 hover:border-[#353952]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs text-white">Gemini 3.8 Flash</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold font-mono">
                    Recommended
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Latest official Google vision model with highest SEO precision.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setModel('gemini-3.5-flash-lite')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  model === 'gemini-3.5-flash-lite'
                    ? 'bg-red-500/15 border-red-500/60 text-white shadow-sm ring-1 ring-red-500/30'
                    : 'bg-[#0F1017] border-[#25283B] text-gray-400 hover:border-[#353952]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs text-white">Gemini 3.5 Flash Lite</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-semibold font-mono">
                    Fast Backup
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">
                  High-speed companion pool with automatic rate-limit switching.
                </p>
              </button>
            </div>

            {discoveredModels.length > 0 && (
              <div className="pt-2">
                <label className="text-[11px] text-gray-400 block mb-1">
                  Active models verified on your API key ({discoveredModels.length}):
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-[#0F101A] border border-[#2B2E42] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                >
                  {discoveredModels.map(dm => (
                    <option key={dm} value={dm}>
                      {dm}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Performance & Queue Options */}
          <div className="space-y-3 pt-2 border-t border-[#23263B]">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              Batch Queue Speed
            </label>

            <div className="bg-[#0F1017] p-3.5 rounded-xl border border-[#25283B] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-white">Parallel Concurrency</span>
                  <p className="text-[11px] text-gray-400">1 at a time prevents Google 20 RPM burst errors completely</p>
                </div>
                <select
                  value={concurrency}
                  onChange={(e) => setConcurrency(Number(e.target.value))}
                  className="bg-[#1B1D2A] border border-[#2E3146] text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-500"
                >
                  <option value={1}>1 at a time (Zero Rate-Limit Errors)</option>
                  <option value={2}>2 at a time (Balanced)</option>
                  <option value={3}>3 at a time (Fast)</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#1C1E2D]">
                <div>
                  <span className="text-xs font-medium text-white">Auto-Start on Upload</span>
                  <p className="text-[11px] text-gray-400">Instantly generate SEO metadata as soon as images are dropped</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoStart}
                  onChange={(e) => setAutoStart(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 bg-[#161824] border-gray-700 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#23263B] bg-[#12131C]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 transition-all"
          >
            Save Settings
          </button>
        </div>

      </div>
    </div>
  );
};
