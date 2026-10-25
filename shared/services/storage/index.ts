import { StorageService } from './types';
import { CloudinaryStorageAdapter, CloudinaryConfig } from './cloudinary-storage';
import { MockStorageAdapter } from './mock-storage';

export * from './types';
export * from './cloudinary-storage';
export * from './mock-storage';

/**
 * Factory untuk instansiasi StorageService berdasarkan ketersediaan konfigurasi Cloudinary.
 * Jika konfigurasi Cloudinary tidak disediakan atau tidak lengkap, otomatis fallback ke MockStorageAdapter.
 */
export function createStorageService(config?: Partial<CloudinaryConfig>): StorageService {
  if (config?.cloudName && config?.apiKey) {
    return new CloudinaryStorageAdapter({
      cloudName: config.cloudName,
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
    });
  }
  return new MockStorageAdapter();
}
