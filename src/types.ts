export interface AdobeCategory {
  id: number;
  name: string;
  description: string;
}

export type ProcessingStatus = 'idle' | 'pending' | 'processing' | 'completed' | 'error';

export interface ImageMetadataItem {
  id: string;
  file: File;
  fileName: string;
  fileSize: number;
  fileType: string;
  previewUrl: string;
  base64Data?: string;
  mimeType: string;
  
  // SEO Output
  title: string;
  keywords: string[]; // List of keywords
  keywordsRaw: string; // Comma-separated
  category: number; // Adobe Stock Category ID (1-21)
  categoryName: string;
  
  // Status & Timing
  status: ProcessingStatus;
  errorMessage?: string;
  processedAt?: number;
  durationMs?: number;
}

export interface AppSettings {
  geminiApiKey: string;
  model: string;
  concurrency: number; // How many images to process simultaneously (default: 2)
  autoStartOnUpload: boolean;
  targetKeywordCount: number; // Default 45-50
  prefixAiStyle: boolean; // Add generative ai keywords
}

export interface CSVExportRow {
  Filename: string;
  Title: string;
  Keywords: string;
  Category: number;
  Releases?: string;
}
