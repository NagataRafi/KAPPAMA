import { describe, it, expect } from 'vitest';
import { MockStorageAdapter, CloudinaryStorageAdapter, createStorageService } from './index';

describe('StorageService & Cloudinary Adapter', () => {
  it('MockStorageAdapter membangun URL gambar dengan benar', () => {
    const mock = new MockStorageAdapter('/mock-images');
    const url = mock.buildImageUrl('banner.webp', { width: 800, height: 600, crop: 'fill' });
    expect(url).toBe('/mock-images/w_800,h_600,c_fill/banner.webp');
  });

  it('MockStorageAdapter mempertahankan URL eksternal penuh', () => {
    const mock = new MockStorageAdapter();
    const externalUrl = 'https://lh3.googleusercontent.com/a/sample-photo';
    expect(mock.buildImageUrl(externalUrl)).toBe(externalUrl);
  });

  it('CloudinaryStorageAdapter membangun URL Cloudinary teroptimasi dengan f_auto,q_auto', () => {
    const cloudinary = new CloudinaryStorageAdapter({
      cloudName: 'kappama-org',
      apiKey: 'test_key',
      apiSecret: 'test_secret',
    });

    const url = cloudinary.buildImageUrl('kappama/programs/proker-1', {
      width: 1200,
      crop: 'fill',
    });

    expect(url).toBe(
      'https://res.cloudinary.com/kappama-org/image/upload/f_auto,q_auto,w_1200,c_fill/kappama/programs/proker-1'
    );
  });

  it('CloudinaryStorageAdapter menghasilkan signature unggah yang valid', async () => {
    const cloudinary = new CloudinaryStorageAdapter({
      cloudName: 'kappama-org',
      apiKey: 'test_key',
      apiSecret: 'test_secret',
    });

    const signatureResult = await cloudinary.createUploadSignature({
      folder: 'kappama/programs',
      publicId: 'proker_2026_sample',
    });

    expect(signatureResult.cloudName).toBe('kappama-org');
    expect(signatureResult.apiKey).toBe('test_key');
    expect(signatureResult.folder).toBe('kappama/programs');
    expect(signatureResult.publicId).toBe('proker_2026_sample');
    expect(typeof signatureResult.signature).toBe('string');
    expect(signatureResult.signature.length).toBe(40); // SHA-1 hex length
    expect(signatureResult.uploadUrl).toBe('https://api.cloudinary.com/v1_1/kappama-org/image/upload');
  });

  it('createStorageService fallback ke MockStorageAdapter jika kredensial kosong', () => {
    const service = createStorageService();
    expect(service).toBeInstanceOf(MockStorageAdapter);
  });
});
