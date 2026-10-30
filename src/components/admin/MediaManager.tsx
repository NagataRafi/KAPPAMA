import { useState } from 'react';
import { Loader2, Plus, Trash2, Video } from 'lucide-react';
import { addMedia, deleteMedia, updateMedia, type PublicMediaItem } from '../../services/content-api';
import { uploadImage } from '../../services/upload';
import { ConfirmDialog, FormMessage, inputClass } from './AdminForm';

interface MediaManagerProps {
  kind: 'program' | 'album';
  ownerId: string;
  media: PublicMediaItem[];
  token: string | null;
  onChanged: () => Promise<void> | void;
  maxPhotos: number;
}

function MediaRow({
  kind,
  item,
  token,
  onChanged,
  onRequestDelete,
}: {
  kind: 'program' | 'album';
  item: PublicMediaItem;
  token: string | null;
  onChanged: () => Promise<void> | void;
  onRequestDelete: (id: string) => void;
}) {
  const [caption, setCaption] = useState(item.caption ?? '');
  const [order, setOrder] = useState(String(item.sortOrder));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateMedia(kind, item.id, { caption: caption.trim() || null, sortOrder: Number(order) || 1 }, token);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan media.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="p-3 rounded-xl border border-slate-200 bg-white space-y-2">
      <div className="flex items-start gap-3">
        <div className="w-20 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
          {item.mediaType === 'image' && item.url ? (
            <img src={item.url} alt={caption || 'Foto media'} className="w-full h-full object-cover" />
          ) : (
            <Video className="w-6 h-6 text-red-600" aria-hidden="true" />
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          {item.mediaType === 'youtube' && (
            <p className="text-[11px] text-slate-500 truncate">YouTube ID: {item.youtubeId}</p>
          )}
          <label className="sr-only" htmlFor={`caption-${item.id}`}>
            Keterangan media
          </label>
          <input
            id={`caption-${item.id}`}
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="Keterangan foto/video"
            className={inputClass}
          />
          <div className="flex items-center gap-2">
            <label htmlFor={`order-${item.id}`} className="text-[11px] font-semibold text-slate-500">
              Urutan
            </label>
            <input
              id={`order-${item.id}`}
              type="number"
              min={1}
              max={999}
              value={order}
              onChange={(event) => setOrder(event.target.value)}
              className="w-20 px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
            />
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="px-3 py-1.5 rounded-lg bg-[#0F1E36] text-white text-[11px] font-bold disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button
              type="button"
              onClick={() => onRequestDelete(item.id)}
              aria-label="Hapus media"
              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-100"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          {error && (
            <p role="alert" className="text-[11px] font-semibold text-rose-600">
              {error}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

export function MediaManager({ kind, ownerId, media, token, onChanged, maxPhotos }: MediaManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeCaption, setYoutubeCaption] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const photoCount = media.filter((item) => item.mediaType === 'image').length;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    setMessage(null);
    setUploading(true);
    setProgress({ done: 0, total: list.length });
    try {
      for (const [index, file] of list.entries()) {
        if (photoCount + index >= maxPhotos) {
          setMessage({ text: `Batas ${maxPhotos} foto per ${kind === 'program' ? 'program' : 'album'} tercapai.`, type: 'error' });
          break;
        }
        const { key } = await uploadImage(file, kind);
        await addMedia(kind, ownerId, { mediaType: 'image', fileKey: key }, token);
        setProgress({ done: index + 1, total: list.length });
      }
      await onChanged();
      setMessage({ text: 'Foto berhasil diunggah.', type: 'success' });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Gagal mengunggah foto.', type: 'error' });
    } finally {
      setUploading(false);
      setProgress(null);
    }
  };

  const handleAddYoutube = async () => {
    setMessage(null);
    if (!youtubeUrl.trim()) {
      setMessage({ text: 'URL YouTube wajib diisi.', type: 'error' });
      return;
    }
    setUploading(true);
    try {
      await addMedia(
        kind,
        ownerId,
        { mediaType: 'youtube', youtubeUrl: youtubeUrl.trim(), caption: youtubeCaption.trim() || null },
        token
      );
      setYoutubeUrl('');
      setYoutubeCaption('');
      await onChanged();
      setMessage({ text: 'Video YouTube ditambahkan.', type: 'success' });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Gagal menambah video.', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteMedia(kind, pendingDelete, token);
      setPendingDelete(null);
      await onChanged();
      setMessage({ text: 'Media dihapus.', type: 'success' });
    } catch (err) {
      setPendingDelete(null);
      setMessage({ text: err instanceof Error ? err.message : 'Gagal menghapus media.', type: 'error' });
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold text-sm text-[#0F1E36]">Foto & Video</h2>
        <span className="text-[11px] text-slate-500">
          {photoCount}/{maxPhotos} foto
        </span>
      </div>

      <FormMessage message={message} />

      {media.length === 0 ? (
        <p className="text-xs text-slate-500">Belum ada foto atau video. Unggah minimal satu foto kegiatan.</p>
      ) : (
        <ul className="space-y-3">
          {media.map((item) => (
            <MediaRow
              key={item.id}
              kind={kind}
              item={item}
              token={token}
              onChanged={onChanged}
              onRequestDelete={setPendingDelete}
            />
          ))}
        </ul>
      )}

      <div className="pt-3 border-t border-slate-100 space-y-3">
        <div>
          <label
            htmlFor={`media-files-${kind}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D97706] hover:bg-amber-600 text-white text-xs font-bold cursor-pointer"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>
              {progress ? `Mengunggah ${progress.done}/${progress.total}` : 'Unggah Banyak Foto'}
            </span>
          </label>
          <input
            id={`media-files-${kind}`}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={uploading || photoCount >= maxPhotos}
            onChange={(event) => {
              void handleFiles(event.target.files);
              event.target.value = '';
            }}
          />
          <p className="text-[11px] text-slate-500 mt-1">JPG/PNG/WebP, maks 5 MB per berkas. Otomatis dikompres ke WebP.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
          <div>
            <label htmlFor={`youtube-url-${kind}`} className="block text-[11px] font-bold text-slate-700 mb-1">
              URL YouTube
            </label>
            <input
              id={`youtube-url-${kind}`}
              value={youtubeUrl}
              onChange={(event) => setYoutubeUrl(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor={`youtube-caption-${kind}`} className="block text-[11px] font-bold text-slate-700 mb-1">
              Keterangan video (opsional)
            </label>
            <input
              id={`youtube-caption-${kind}`}
              value={youtubeCaption}
              onChange={(event) => setYoutubeCaption(event.target.value)}
              className={inputClass}
            />
          </div>
          <button
            type="button"
            onClick={handleAddYoutube}
            disabled={uploading}
            className="px-4 py-2.5 rounded-xl bg-[#0F1E36] text-white text-xs font-bold disabled:opacity-50"
          >
            Tambah Video
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Hapus media ini?"
        description="Media akan dihapus dari entri ini dan asetnya di penyimpanan ikut dihapus. Tindakan ini tidak dapat dibatalkan."
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </section>
  );
}
