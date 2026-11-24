import React, { useState, useEffect } from 'react';
import { X, Key, ExternalLink, CheckCircle, ShieldCheck, Zap, Sliders, Sparkles } from 'lucide-react';
import { AppSettings, TitleSeoStyle } from '../types';
import { testGeminiConnection } from '../services/gemini';
import { sanitizeStoredModel, parseApiKeys } from '../services/storage';

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

  useEffect(() => {
    if (isOpen) {
      setApiKey(settings.geminiApiKey || '');
      setModel(sanitizeStoredModel(settings.model));
      setTitleStyle(settings.titleStyle || 'hybrid_seo');
      setConcurrency(settings.concurrency || 1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const detectedKeys = parseApiKeys(apiKey);

  const handleSave = () => {
    onSaveSettings({
      ...settings,
      geminiApiKey: apiKey.trim(),
      model: sanitizeStoredModel(model),
      concurrency: Number(concurrency),
      batchSize: 1,
      autoStartOnUpload: autoStart,
      titleStyle
    });
    onClose();
  };

  const handleTestKey = async () => {
    if (detectedKeys.length === 0) {
      setTestStatus('failed');
      setTestMessage('Please enter at least one valid Gemini API key.');
      return;
    }

    const activeModel = sanitizeStoredModel(model);
    setTestStatus('testing');
    setTestMessage(`Testing Official Interactions API with ${activeModel}...`);

    const res = await testGeminiConnection(apiKey, activeModel);
    if (res.ok) {
      setTestStatus('success');
      setModel(res.model);
      setTestMessage(res.message);
    } else {
      setTestStatus('failed');
      setTestMessage(`Test note: ${res.message}`);
    }
  };

  const modelOptions = [
    {
      id: 'gemini-4-hydrogen',
      name: 'Gemini 4 Hydrogen',
      tag: 'Recommended GA',
      desc: 'Latest Gemini 4 daily driver on GA Interactions API (Zero High-Demand Errors)'
    },
    {
      id: 'gemini-3.5-flash-lite',
      name: 'Gemini 3.5 Flash-Lite',
      tag: 'Ultra High Speed',
      desc: 'Fastest, high-throughput vision model for bulk batches'
    },
    {
      id: 'gemini-3.1-flash-lite',
      name: 'Gemini 3.1 Flash-Lite',
      tag: 'Lightweight',
      desc: 'High-frequency lightweight vision model'
    },
    {
      id: 'gemma-4-31b-it',
      name: 'Gemma 4 31B Vision',
      tag: 'Open Pool',
      desc: 'Separate dedicated quota pool for continuous processing'
    }
  ];

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
              <h2 className="text-base font-bold text-white">Gemini 4 Interactions API & SEO Settings</h2>
              <p className="text-xs text-gray-400">Official @google/genai v3.6 Interactions API (Zero High-Demand Errors)</p>
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
          
          {/* API Key Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                <span>Google Gemini API Key(s)</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                  {detectedKeys.length} Key{detectedKeys.length !== 1 ? 's' : ''} Active
                </span>
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 hover:underline font-medium"
              >
                <span>Get Free Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <textarea
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              rows={2}
              placeholder="Paste your Gemini API Key (AIzaSy...) — you can also paste multiple keys on separate lines!"
              className="w-full px-3.5 py-2 bg-[#0F1017] border border-[#2B2E42] rounded-xl text-white font-mono text-xs placeholder:text-gray-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
            />

            <div className="flex items-center justify-between pt-0.5">
              <p className="text-[11px] text-gray-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline shrink-0" />
                <span>Stored safely in your browser only.</span>
              </p>
              <button
                onClick={handleTestKey}
                disabled={testStatus === 'testing'}
                className="text-xs px-2.5 py-1 rounded bg-[#23263B] hover:bg-[#2C304A] text-gray-300 hover:text-white transition-colors shrink-0"
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
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Active Interactions API Model (Auto-Failover Pool)
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {modelOptions.map(opt => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setModel(opt.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    model === opt.id
                      ? 'bg-red-500/15 border-red-500/60 text-white ring-1 ring-red-500/30'
                      : 'bg-[#0F1017] border-[#25283B] text-gray-400 hover:border-[#353952]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-white">{opt.name}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                      {opt.tag}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-snug">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Title SEO Strategy Mode Selector */}
          <div className="space-y-2.5 pt-2 border-t border-[#23263B]">
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
                  Starts with a clear visual description, then packs 4-6 high-volume comma-separated buyer search phrases (180-200 chars).
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTitleStyle('keyword_power')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  titleStyle === 'keyword_power'
                    ? 'bg-red-500/15 border-red-500/60 text-white ring-1 ring-red-500/30'
                    : 'bg-[#0F1017] border-[#25283B] text-gray-400 hover:border-[#353952]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">⚡ Maximum Keyword Density (Heavy Keyword Stuffing)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-semibold">
                    Aggressive SEO
                  </span>
                </div>
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

          {/* Queue Pacing Control */}
          <div className="space-y-2.5 pt-2 border-t border-[#23263B]">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              Queue Stability & Speed
            </label>
            <div className="bg-[#0F1017] p-3.5 rounded-xl border border-[#25283B] flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-white">Processing Mode</span>
                <p className="text-[11px] text-gray-400">1-by-1 Steady Mode processes 100 images in ~8-12 mins with ZERO errors</p>
              </div>
              <select
                value={concurrency}
                onChange={(e) => setConcurrency(Number(e.target.value))}
                className="bg-[#1B1D2A] border border-[#2E3146] text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-500 shrink-0"
              >
                <option value={1}>1-by-1 Steady (Recommended - Zero Errors)</option>
                <option value={2}>2 at a time (Faster)</option>
              </select>
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
