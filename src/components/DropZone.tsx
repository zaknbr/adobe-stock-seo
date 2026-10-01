import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Film, FolderUp, Sparkles, AlertCircle } from 'lucide-react';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
  hasApiKey: boolean;
  onOpenSettings: () => void;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  isProcessing,
  hasApiKey,
  onOpenSettings
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files).filter(file =>
        file.type.startsWith('image/') || file.type.startsWith('video/')
      );
      if (filesArray.length > 0) {
        onFilesSelected(filesArray);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files).filter(file =>
        file.type.startsWith('image/') || file.type.startsWith('video/')
      );
      if (filesArray.length > 0) {
        onFilesSelected(filesArray);
      }
      e.target.value = ''; // Reset input
    }
  };

  return (
    <div className="w-full">
      {!hasApiKey && (
        <div className="mb-4 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Gemini API Key Required:</strong> To enable unlimited AI SEO metadata generation, please add your free Google API key.
            </span>
          </div>
          <button
            onClick={onOpenSettings}
            className="px-3 py-1 bg-amber-500 text-black font-semibold rounded-lg hover:bg-amber-400 transition-colors shrink-0"
          >
            Enter Key
          </button>
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative rounded-2xl border-2 border-dashed transition-all cursor-pointer p-8 sm:p-12 text-center flex flex-col items-center justify-center overflow-hidden ${
          isDragOver
            ? 'border-red-500 bg-red-500/10 scale-[1.008]'
            : 'border-[#2B2E42] bg-[#141622]/70 hover:border-red-500/50 hover:bg-[#181A28]'
        }`}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <input
          ref={folderInputRef}
          type="file"
          // @ts-ignore
          webkitdirectory="true"
          directory="true"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* Center Icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#1D2032] border border-[#2D314D] flex items-center justify-center text-red-400 group-hover:text-red-300 group-hover:scale-110 transition-transform mb-4 shadow-xl shadow-red-900/10">
          <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        {/* Text descriptions */}
        <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 flex items-center gap-2">
          <span>Drag & Drop 50, 100, 200+ Stock Images Here</span>
          <Sparkles className="w-4 h-4 text-amber-400" />
        </h3>
        <p className="text-xs sm:text-sm text-gray-400 max-w-md mb-5 leading-relaxed">
          Upload bulk JPG, PNG, WEBP or MP4 files. Our AI will analyze each image and generate SEO-optimized Titles, 50 Weighted Keywords & Categories.
        </p>

        {/* Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 relative z-10" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-semibold shadow-lg shadow-red-600/25 transition-all"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Select Files</span>
          </button>

          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#202334] hover:bg-[#282C42] border border-[#2E334D] text-gray-200 text-xs font-semibold transition-all"
          >
            <FolderUp className="w-3.5 h-3.5 text-indigo-400" />
            <span>Upload Whole Folder</span>
          </button>
        </div>

        {/* Footer info pills */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] text-gray-500">
          <span className="px-2.5 py-1 rounded-md bg-[#161824] border border-[#222538]">✨ Zero Upload Limits</span>
          <span className="px-2.5 py-1 rounded-md bg-[#161824] border border-[#222538]">⚡ Bulk Queue Processing</span>
          <span className="px-2.5 py-1 rounded-md bg-[#161824] border border-[#222538]">📊 Ready Adobe Stock CSV</span>
        </div>
      </div>
    </div>
  );
};
