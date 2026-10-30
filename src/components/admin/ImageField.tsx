import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { uploadImage, type UploadKind } from '../../services/upload';

interface ImageFieldProps {
  label: string;
  kind: Exclude<UploadKind, 'bylaws'>;
  value: string | null;
  previewUrl: string | null;
  onChange: (key: string | null) => void;
  hint?: string;
}

export function ImageField({ label, kind, value, previewUrl, onChange, hint }: ImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const shown = localPreview ?? previewUrl;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setProgress(0);
    try {
      const objectUrl = URL.createObjectURL(file);
      setLocalPreview(objectUrl);
      const result = await uploadImage(file, kind, setProgress);
      onChange(result.key);
    } catch (err) {
      setLocalPreview(null);
      setError(err instanceof Error ? err.message : 'Gagal mengunggah gambar.');
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <span className="block text-xs font-bold text-slate-700">{label}</span>
      <div className="flex items-start gap-4">
        <div className="w-28 h-28 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
          {shown ? (
            <img src={shown} alt="Pratinjau gambar" className="w-full h-full object-cover" />
          ) : (
            <ImagePlus className="w-8 h-8 text-slate-400" aria-hidden="true" />
          )}
        </div>
        <div className="space-y-2">
          <input
            ref={inputRef}
            id={`upload-${kind}-${label.replace(/\s+/g, '-').toLowerCase()}`}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
          <label
            htmlFor={`upload-${kind}-${label.replace(/\s+/g, '-').toLowerCase()}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F1E36] hover:bg-[#162C4E] text-white text-xs font-bold cursor-pointer"
          >
            {progress === null ? 'Pilih Gambar' : <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{progress === null ? 'Pilih Gambar' : `Mengunggah ${progress}%`}</span>
          </label>
          {value && (
            <button
              type="button"
              onClick={() => {
                setLocalPreview(null);
                onChange(null);
              }}
              className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Hapus
            </button>
          )}
          {hint && <p className="text-[11px] text-slate-500 max-w-xs">{hint}</p>}
          {error && (
            <p role="alert" className="text-[11px] font-semibold text-rose-600 max-w-xs">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
