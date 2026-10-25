import {
  StorageService,
  ImageTransformOptions,
  UploadSignatureOptions,
  UploadSignatureResult,
  DirectUploadResult,
} from './types';

export interface CloudinaryConfig {
  cloudName?: string;
  apiKey?: string;
  apiSecret?: string; // Rahasia, hanya di server
  cloudinaryUrl?: string; // Format: cloudinary://api_key:api_secret@cloud_name
}

/**
 * Helper untuk mengekstrak cloudName, apiKey, dan apiSecret dari CLOUDINARY_URL.
 */
export function parseCloudinaryUrl(url?: string): {
  cloudName?: string;
  apiKey?: string;
  apiSecret?: string;
} {
  if (!url) return {};
  const match = url.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
  if (match) {
    return {
      apiKey: match[1],
      apiSecret: match[2],
      cloudName: match[3],
    };
  }
  return {};
}

/**
 * Helper untuk menghitung SHA-1 hex digest yang berjalan di browser, Node.js, dan Cloudflare Workers.
 */
async function sha1Hex(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export class CloudinaryStorageAdapter implements StorageService {
  private cloudName: string;
  private apiKey: string;
  private apiSecret?: string;

  constructor(config: CloudinaryConfig) {
    const fromUrl = parseCloudinaryUrl(config.cloudinaryUrl);
    this.cloudName = config.cloudName || fromUrl.cloudName || '';
    this.apiKey = config.apiKey || fromUrl.apiKey || '';
    this.apiSecret = config.apiSecret || fromUrl.apiSecret;

    if (!this.cloudName) {
      console.warn('[StorageService] Peringatan: CLOUDINARY_CLOUD_NAME tidak ditemukan.');
    }
  }

  async createUploadSignature(options: UploadSignatureOptions): Promise<UploadSignatureResult> {
    if (!this.apiSecret) {
      throw new Error(
        'CLOUDINARY_API_SECRET diperlukan untuk membuat signature unggah di server. Pastikan CLOUDINARY_API_SECRET atau CLOUDINARY_URL telah diatur di .dev.vars.'
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign: Record<string, string> = {
      folder: options.folder,
      timestamp: timestamp.toString(),
    };

    if (options.publicId) {
      paramsToSign.public_id = options.publicId;
    }

    // Urutkan parameter secara alfabetis sesuai spesifikasi Cloudinary
    const sortedKeys = Object.keys(paramsToSign).sort();
    const serializedParams = sortedKeys.map((k) => `${k}=${paramsToSign[k]}`).join('&');
    const signature = await sha1Hex(`${serializedParams}${this.apiSecret}`);

    return {
      signature,
      timestamp,
      apiKey: this.apiKey,
      cloudName: this.cloudName,
      folder: options.folder,
      publicId: options.publicId,
      uploadUrl: `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
    };
  }

  buildImageUrl(publicId: string, options?: ImageTransformOptions): string {
    if (!publicId) return '';
    // Jika sudah URL eksternal lengkap (misal avatar Google atau URL statis lokal)
    if (publicId.startsWith('http://') || publicId.startsWith('https://') || publicId.startsWith('/')) {
      return publicId;
    }

    const transforms: string[] = ['f_auto', 'q_auto'];

    if (options?.width) transforms.push(`w_${options.width}`);
    if (options?.height) transforms.push(`h_${options.height}`);
    if (options?.crop) transforms.push(`c_${options.crop}`);
    if (options?.aspectRatio) transforms.push(`ar_${options.aspectRatio}`);

    const transformPath = transforms.join(',');
    return `https://res.cloudinary.com/${this.cloudName}/image/upload/${transformPath}/${publicId}`;
  }

  async deleteImage(publicId: string): Promise<boolean> {
    if (!this.apiSecret) {
      throw new Error('CLOUDINARY_API_SECRET diperlukan untuk menghapus berkas di Cloudinary.');
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}${this.apiSecret}`;
    const signature = await sha1Hex(paramsToSign);

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('timestamp', timestamp.toString());
    formData.append('api_key', this.apiKey);
    formData.append('signature', signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${this.cloudName}/image/destroy`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) return false;
    const result = (await response.json()) as { result?: string };
    return result.result === 'ok';
  }

  async upload(
    file: Blob | ArrayBuffer | string,
    options: UploadSignatureOptions
  ): Promise<DirectUploadResult> {
    const signatureData = await this.createUploadSignature(options);
    const formData = new FormData();

    if (file instanceof Blob) {
      formData.append('file', file);
    } else if (file instanceof ArrayBuffer) {
      formData.append('file', new Blob([file]));
    } else {
      formData.append('file', file);
    }

    formData.append('api_key', signatureData.apiKey);
    formData.append('timestamp', signatureData.timestamp.toString());
    formData.append('signature', signatureData.signature);
    formData.append('folder', signatureData.folder);
    if (signatureData.publicId) {
      formData.append('public_id', signatureData.publicId);
    }

    const response = await fetch(signatureData.uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gagal mengunggah ke Cloudinary: ${err}`);
    }

    const resJson = (await response.json()) as {
      public_id: string;
      url: string;
      secure_url: string;
      format: string;
      width: number;
      height: number;
      bytes: number;
    };

    return {
      publicId: resJson.public_id,
      url: resJson.url,
      secureUrl: resJson.secure_url,
      format: resJson.format,
      width: resJson.width,
      height: resJson.height,
      bytes: resJson.bytes,
    };
  }
}
