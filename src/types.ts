export type AppMode = 'encrypt' | 'decrypt';
export type PayloadType = 'text' | 'file';
export type AppTheme = 'neural' | 'high-contrast' | 'minimalist';
export type KeyAlgorithm = 'aes-gcm' | 'rsa-oaep' | 'aes-cbc';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  timestamp: number;
}

export interface FileItem {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  stage?: string;
  resultBlob?: Blob;
  resultFileName?: string;
  errorMessage?: string;
}
