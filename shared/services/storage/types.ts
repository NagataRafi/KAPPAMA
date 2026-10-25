export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: 'auto' | number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
  crop?: 'fill' | 'fit' | 'limit' | 'thumb';
  aspectRatio?: string;
}

export interface UploadSignatureOptions {
  folder: string; // e.g. "kappama/programs", "kappama/albums", "kappama/leaders"
  publicId?: string;
  tags?: string[];
  maxFileSize?: number; // in bytes
}

export interface UploadSignatureResult {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  publicId?: string;
  uploadUrl: string;
}

export interface DirectUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  width?: number;
  height?: number;
  bytes?: number;
}

export interface StorageService {
  /**
   * Menghasilkan signature autentikasi untuk pengunggahan langsung (direct signed upload) dari browser ke Cloudinary.
   */
  createUploadSignature(options: UploadSignatureOptions): Promise<UploadSignatureResult>;

  /**
   * Membangun URL gambar responsif dan teroptimasi dari publicId.
   */
  buildImageUrl(publicId: string, options?: ImageTransformOptions): string;

  /**
   * Menghapus berkas gambar dari penyimpanan berdasarkan publicId.
   */
  deleteImage(publicId: string): Promise<boolean>;

  /**
   * Unggah langsung berkas ke penyimpanan (misal: untuk seeder atau pengujian).
   */
  upload(
    file: Blob | ArrayBuffer | string,
    options: UploadSignatureOptions
  ): Promise<DirectUploadResult>;
}
