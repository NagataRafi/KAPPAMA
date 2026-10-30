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
  /** 'auto' dipakai untuk PDF AD/ART; default 'image' untuk gambar. */
  resourceType?: 'image' | 'raw' | 'auto';
  /** Batasi format di sisi Cloudinary, mis. 'jpg,png,webp' atau 'pdf'. */
  allowedFormats?: string;
}

export interface UploadSignatureResult {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  publicId?: string;
  uploadUrl: string;
  resourceType: 'image' | 'raw' | 'auto';
  allowedFormats?: string;
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
   * Menghapus berkas dari penyimpanan berdasarkan publicId.
   */
  deleteImage(publicId: string, resourceType?: 'image' | 'raw'): Promise<boolean>;

  /**
   * Unggah langsung berkas ke penyimpanan (misal: untuk seeder atau pengujian).
   */
  upload(
    file: Blob | ArrayBuffer | string,
    options: UploadSignatureOptions
  ): Promise<DirectUploadResult>;
}
