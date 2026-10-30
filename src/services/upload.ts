import { fetchApi } from './api';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_PDF_BYTES = 10 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export type UploadKind = 'program' | 'album' | 'leader' | 'org' | 'bylaws';

interface SignatureResponse {
  data: {
    signature: string;
    timestamp: number;
    apiKey: string;
    cloudName: string;
    folder: string;
    publicId?: string;
    uploadUrl: string;
    resourceType: string;
    allowedFormats?: string;
  };
}

/**
 * Kompres gambar ke WebP (sisi terpanjang maks 1600 px, sampul 1920 px).
 * Bila hasil kompresi tidak lebih kecil, berkas asli dipakai.
 */
export async function prepareImageFile(file: File, maxWidth = 1600): Promise<File> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Format gambar harus JPG, PNG, atau WebP.');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Ukuran gambar maksimal 5 MB sebelum dikompres.');
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxWidth / bitmap.width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', 0.82)
    );
    if (!blob || blob.size >= file.size) return file;
    const name = `${file.name.replace(/\.[^.]+$/, '') || 'gambar'}.webp`;
    return new File([blob], name, { type: 'image/webp' });
  } catch {
    return file;
  }
}

function postToStorage(
  signature: SignatureResponse['data'],
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);
    form.append('api_key', signature.apiKey);
    form.append('timestamp', String(signature.timestamp));
    form.append('signature', signature.signature);
    form.append('folder', signature.folder);
    if (signature.publicId) form.append('public_id', signature.publicId);
    if (signature.allowedFormats) form.append('allowed_formats', signature.allowedFormats);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', signature.uploadUrl);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onerror = () => reject(new Error('Koneksi ke penyimpanan gagal. Periksa jaringan lalu coba lagi.'));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const body = JSON.parse(xhr.responseText) as { public_id?: string };
          if (!body.public_id) {
            reject(new Error('Penyimpanan tidak mengembalikan identitas berkas.'));
            return;
          }
          resolve(body.public_id);
        } catch {
          reject(new Error('Respons penyimpanan tidak dapat dibaca.'));
        }
        return;
      }
      reject(
        new Error(
          xhr.status === 401 || xhr.status === 403
            ? 'Penyimpanan menolak berkas ini. Untuk PDF, gunakan tautan Google Drive atau berkas di public/docs.'
            : `Unggahan gagal (HTTP ${xhr.status}). Coba lagi beberapa saat.`
        )
      );
    };
    xhr.send(form);
  });
}

/** Unggah gambar lewat signed upload. Mengembalikan public_id Cloudinary. */
export async function uploadImage(
  file: File,
  kind: Exclude<UploadKind, 'bylaws'>,
  onProgress?: (percent: number) => void,
  maxWidth = 1600
): Promise<{ key: string; prepared: File }> {
  const prepared = await prepareImageFile(file, maxWidth);
  const signature = await fetchApi<SignatureResponse>(
    '/admin/uploads/signature',
    {
      method: 'POST',
      body: JSON.stringify({ kind, contentType: prepared.type, bytes: prepared.size }),
    }
  );
  const key = await postToStorage(signature.data, prepared, onProgress);
  return { key, prepared };
}

/** Unggah PDF AD/ART (maks 10 MB). Bila Cloudinary menolak, admin memakai tautan cadangan. */
export async function uploadBylawPdf(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  if (file.type !== 'application/pdf') {
    throw new Error('Dokumen AD/ART harus berformat PDF.');
  }
  if (file.size > MAX_PDF_BYTES) {
    throw new Error('Ukuran PDF maksimal 10 MB.');
  }
  const signature = await fetchApi<SignatureResponse>(
    '/admin/uploads/signature',
    {
      method: 'POST',
      body: JSON.stringify({ kind: 'bylaws', contentType: file.type, bytes: file.size }),
    }
  );
  return postToStorage(signature.data, file, onProgress);
}
