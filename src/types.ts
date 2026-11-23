export interface AdobeCategory {
  id: number;
  name: string;
  description: string;
}

export type ProcessingStatus = 'idle' | 'pending' | 'processing' | 'completed' | 'error';

export type TitleSeoStyle = 'hybrid_seo' | 'keyword_power' | 'descriptive';

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
  geminiApiKey: string; // Can hold single key OR multiple newline/comma-separated keys for load balancing!
  model: string;
  concurrency: number; // How many batches/images to process simultaneously
  batchSize: number; // How many images to pack into a single Gemini API request (1 to 4, default 3)
  autoStartOnUpload: boolean;
  targetKeywordCount: number; // Default 50
  prefixAiStyle: boolean;
  titleStyle: TitleSeoStyle;
}

export interface CSVExportRow {
  Filename: string;
  Title: string;
  Keywords: string;
  Category: number;
  Releases?: string;
}
