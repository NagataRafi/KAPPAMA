import { useCallback, useEffect, useRef, useState } from 'react';
import { FileText, Loader2, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { useAppAuth } from '../../components/auth/AuthContext';
import {
  createBylaw,
  deleteBylaw,
  getAdminBylaws,
  updateBylaw,
  type AdminBylaw,
} from '../../services/content-api';
import { uploadBylawPdf } from '../../services/upload';
import { ConfirmDialog, Field, FormMessage, inputClass } from '../../components/admin/AdminForm';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

interface BylawForm {
  id: string | null;
  title: string;
  effectiveDate: string;
  isActive: boolean;
  fileKey: string;
}

const emptyForm = (): BylawForm => ({
  id: null,
  title: 'Anggaran Dasar dan Anggaran Rumah Tangga KAPPAMA',
  effectiveDate: new Date().toISOString().slice(0, 10),
  isActive: true,
  fileKey: '',
});

export function AdArtAdminPage() {
  const { token } = useAppAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<AdminBylaw[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [form, setForm] = useState<BylawForm>(emptyForm());
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await getAdminBylaws(token);
      setRows(res.data);
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Gagal memuat AD/ART.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const handlePdf = async (file: File | undefined) => {
    if (!file) return;
    setMessage(null);
    setProgress(0);
    try {
      const key = await uploadBylawPdf(file, setProgress);
      setForm((current) => ({ ...current, fileKey: key }));
      setMessage({ text: 'PDF berhasil diunggah. Simpan untuk menerbitkan.', type: 'success' });
    } catch (err) {
      setMessage({
        text:
          err instanceof Error
            ? `${err.message} Gunakan kolom tautan di bawah sebagai cadangan.`
            : 'Gagal mengunggah PDF.',
        type: 'error',
      });
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.fileKey.trim()) {
      setMessage({ text: 'Unggah PDF atau isi tautan dokumen terlebih dahulu.', type: 'error' });
      return;
    }
    setBusy(true);
    setMessage(null);
    const payload = {
      title: form.title,
      effectiveDate: form.effectiveDate,
      isActive: form.isActive,
      fileKey: form.fileKey.trim(),
    };
    try {
      if (form.id) {
        await updateBylaw(form.id, payload, token);
      } else {
        await createBylaw(payload, token);
      }
      setForm(emptyForm());
      await load();
      setMessage({ text: 'Dokumen AD/ART berhasil disimpan.', type: 'success' });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Gagal menyimpan dokumen.', type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const runDelete = async () => {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await deleteBylaw(pendingDelete, token);
      await load();
      setMessage({ text: 'Dokumen dihapus.', type: 'success' });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Gagal menghapus dokumen.', type: 'error' });
    } finally {
      setPendingDelete(null);
      setBusy(false);
    }
  };

  if (loading) return <LoadingSkeleton type="text" count={2} />;

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-extrabold text-[#0F1E36]">Dokumen AD/ART</h1>
        <p className="text-xs text-slate-600">
          Unggah PDF maksimal 10 MB. Hanya satu dokumen yang ditandai aktif dan ditampilkan sebagai dokumen utama di
          halaman publik. Bila Cloudinary menolak PDF, tempel tautan Google Drive atau berkas di{' '}
          <code className="text-[11px] bg-slate-100 px-1 rounded">/docs/nama-berkas.pdf</code>.
        </p>
      </header>

      <FormMessage message={message} />

      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
        <h2 className="font-bold text-sm text-[#0F1E36]">Riwayat Dokumen</h2>
        {rows.length === 0 ? (
          <p className="text-xs text-slate-500">Belum ada dokumen AD/ART.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li key={row.id} className="p-3 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3">
                <FileText className="w-5 h-5 text-[#0F1E36] shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <span className="block text-sm font-bold text-[#0F1E36] truncate">{row.title}</span>
                  <span className="text-[11px] text-slate-500">
                    Berlaku {row.effectiveDate}
                    {row.isActive ? ' · Dokumen aktif' : ''}
                  </span>
                </div>
                {row.fileUrl && (
                  <a
                    href={row.fileUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-[11px] font-bold text-[#D97706] hover:underline"
                  >
                    Lihat
                  </a>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      id: row.id,
                      title: row.title,
                      effectiveDate: row.effectiveDate,
                      isActive: row.isActive,
                      fileKey: row.fileKey,
                    })
                  }
                  aria-label={`Ubah dokumen ${row.title}`}
                  className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-50 border border-slate-200"
                >
                  <Pencil className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(row.id)}
                  aria-label={`Hapus dokumen ${row.title}`}
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-100"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form onSubmit={save} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <h2 className="font-bold text-sm text-[#0F1E36]">
          {form.id ? 'Ubah Dokumen' : 'Tambah Dokumen'}
        </h2>

        <Field label="Judul dokumen" htmlFor="bylaw-title">
          <input
            id="bylaw-title"
            required
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            className={inputClass}
          />
        </Field>

        <Field label="Tanggal berlaku" htmlFor="bylaw-date">
          <input
            id="bylaw-date"
            type="date"
            required
            value={form.effectiveDate}
            onChange={(event) => setForm({ ...form, effectiveDate: event.target.value })}
            className={inputClass}
          />
        </Field>

        <div className="space-y-2">
          <span className="block text-xs font-bold text-slate-700">Unggah PDF</span>
          <input
            ref={inputRef}
            id="bylaw-pdf"
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={(event) => void handlePdf(event.target.files?.[0])}
          />
          <label
            htmlFor="bylaw-pdf"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F1E36] text-white text-xs font-bold cursor-pointer"
          >
            {progress === null ? <Upload className="w-3.5 h-3.5" /> : <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{progress === null ? 'Pilih PDF' : `Mengunggah ${progress}%`}</span>
          </label>
          <p className="text-[11px] text-slate-500">
            {form.fileKey
              ? form.fileKey.startsWith('http') || form.fileKey.startsWith('/')
                ? `Tautan: ${form.fileKey}`
                : 'PDF sudah terunggah ke penyimpanan.'
              : 'Belum ada berkas dipilih.'}
          </p>
        </div>

        <Field
          label="Atau tautan dokumen (Google Drive / berkas public/docs)"
          htmlFor="bylaw-link"
          hint="Contoh: https://drive.google.com/file/d/.../view atau /docs/ad-art-kappama.pdf"
        >
          <input
            id="bylaw-link"
            value={form.fileKey.startsWith('http') || form.fileKey.startsWith('/') ? form.fileKey : ''}
            onChange={(event) => setForm({ ...form, fileKey: event.target.value })}
            placeholder="https://drive.google.com/..."
            className={inputClass}
          />
        </Field>

        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
            className="w-4 h-4 rounded border-slate-300"
          />
          Jadikan dokumen aktif
        </label>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D97706] text-white text-xs font-bold disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Simpan Dokumen
          </button>
          {form.id && (
            <button
              type="button"
              onClick={() => setForm(emptyForm())}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
            >
              Batal
            </button>
          )}
        </div>
      </form>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Hapus dokumen AD/ART ini?"
        description="Dokumen dan berkas PDF-nya akan dihapus. Riwayat versi lain tidak terpengaruh."
        busy={busy}
        onCancel={() => setPendingDelete(null)}
        onConfirm={runDelete}
      />
    </div>
  );
}
