import {
  StorageService,
  ImageTransformOptions,
  UploadSignatureOptions,
  UploadSignatureResult,
  DirectUploadResult,
} from './types';

export class MockStorageAdapter implements StorageService {
  private baseUrl: string;

  constructor(baseUrl: string = '/media-mock') {
    this.baseUrl = baseUrl;
  }

  async createUploadSignature(options: UploadSignatureOptions): Promise<UploadSignatureResult> {
    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = options.publicId || `mock_${timestamp}_${Math.random().toString(36).substring(2, 9)}`;

    return {
      signature: 'mock_signature_dev',
      timestamp,
      apiKey: 'mock_api_key',
      cloudName: 'kappama-mock',
      folder: options.folder,
      publicId,
      uploadUrl: '/api/mock/uploads',
      resourceType: options.resourceType ?? 'image',
      allowedFormats: options.allowedFormats,
    };
  }

  buildImageUrl(publicId: string, options?: ImageTransformOptions): string {
    if (!publicId) return '';
    // Jika publicId sudah berupa URL lengkap (misal placeholder atau avatar Google)
    if (publicId.startsWith('http://') || publicId.startsWith('https://') || publicId.startsWith('/')) {
      return publicId;
    }

    const params: string[] = [];
    if (options?.width) params.push(`w_${options.width}`);
    if (options?.height) params.push(`h_${options.height}`);
    if (options?.crop) params.push(`c_${options.crop}`);

    const transformStr = params.length > 0 ? `/${params.join(',')}` : '';
    return `${this.baseUrl}${transformStr}/${publicId}`;
  }

  async deleteImage(_publicId: string, _resourceType: 'image' | 'raw' = 'image'): Promise<boolean> {
    return true;
  }

  async upload(
    _file: Blob | ArrayBuffer | string,
    options: UploadSignatureOptions
  ): Promise<DirectUploadResult> {
    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = options.publicId || `${options.folder}/mock_${timestamp}`;
    const url = `${this.baseUrl}/${publicId}`;

    return {
      publicId,
      url,
      secureUrl: url,
      format: 'webp',
      width: 800,
      height: 600,
      bytes: 102400,
    };
  }
}
