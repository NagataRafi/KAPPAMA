import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useAppAuth } from '../../components/auth/AuthContext';
import {
  createAlbum,
  getAdminAlbum,
  getAdminPrograms,
  updateAlbum,
  type AdminAlbumDetail,
  type AdminProgramSummary,
} from '../../services/content-api';
import { Field, FormMessage, inputClass } from '../../components/admin/AdminForm';
import { ImageField } from '../../components/admin/ImageField';
import { MediaManager } from '../../components/admin/MediaManager';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

interface FormState {
  title: string;
  slug: string;
  year: string;
  eventDate: string;
  description: string;
  programId: string;
  status: 'draft' | 'published';
  coverKey: string | null;
}

const emptyForm = (): FormState => ({
  title: '',
  slug: '',
  year: String(new Date().getFullYear()),
  eventDate: '',
  description: '',
  programId: '',
  status: 'draft',
  coverKey: null,
});

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

export function GaleriFormPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'baru';
  const { token } = useAppAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(emptyForm());
  const [detail, setDetail] = useState<AdminAlbumDetail | null>(null);
  const [programs, setPrograms] = useState<AdminProgramSummary[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    void getAdminPrograms(token)
      .then((res) => setPrograms(res.data))
      .catch(() => setPrograms([]));
  }, [token]);

  const load = useCallback(async () => {
    if (isNew || !id) return;
    setLoading(true);
    try {
      const res = await getAdminAlbum(id, token);
      setDetail(res.data);
      setForm({
        title: res.data.title,
        slug: res.data.slug,
        year: String(res.data.year),
        eventDate: res.data.eventDate ?? '',
        description: res.data.description ?? '',
        programId: res.data.programId ?? '',
        status: res.data.status,
        coverKey: res.data.coverKey,
      });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Gagal memuat album.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [id, isNew, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (event: React.FormEvent, statusOverride?: 'draft' | 'published') => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const payload = {
      title: form.title,
      slug: form.slug || toSlug(form.title),
      year: Number(form.year),
      eventDate: form.eventDate || null,
      description: form.description,
      programId: form.programId || null,
      status: statusOverride ?? form.status,
      coverKey: form.coverKey,
    };
    try {
      if (isNew) {
        const res = await createAlbum(payload, token);
        navigate(`/admin/galeri/${res.data.id}`, { replace: true });
      } else if (id) {
        await updateAlbum(id, payload, token);
        setForm({ ...form, slug: payload.slug, status: payload.status });
        await load();
        setMessage({ text: 'Album berhasil disimpan.', type: 'success' });
      }
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Gagal menyimpan album.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSkeleton type="text" count={3} />;

  return (
    <div className="space-y-5 max-w-4xl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-extrabold text-[#0F1E36]">
            {isNew ? 'Tambah Album Galeri' : 'Ubah Album Galeri'}
          </h1>
          <p className="text-xs text-slate-600">
            Album dapat dihubungkan ke program kerja. Unggah banyak foto setelah album disimpan.
          </p>
        </div>
        <Link
          to="/admin/galeri"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Daftar Album
        </Link>
      </header>

      <FormMessage message={message} />

      <form onSubmit={(event) => void save(event)} className="space-y-5">
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <Field label="Judul album" htmlFor="album-title">
            <input
              id="album-title"
              required
              value={form.title}
              onChange={(event) =>
                setForm({
                  ...form,
                  title: event.target.value,
                  slug: isNew && !form.slug ? toSlug(event.target.value) : form.slug,
                })
              }
              className={inputClass}
            />
          </Field>

          <Field label="Slug URL" htmlFor="album-slug" hint="Huruf kecil, angka, dan tanda hubung.">
            <input
              id="album-slug"
              required
              value={form.slug}
              onChange={(event) => setForm({ ...form, slug: toSlug(event.target.value) })}
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Tahun" htmlFor="album-year">
              <input
                id="album-year"
                type="number"
                min={2000}
                max={2100}
                required
                value={form.year}
                onChange={(event) => setForm({ ...form, year: event.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Tanggal kegiatan (opsional)" htmlFor="album-date">
              <input
                id="album-date"
                type="date"
                value={form.eventDate}
                onChange={(event) => setForm({ ...form, eventDate: event.target.value })}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Program kerja terkait (opsional)" htmlFor="album-program">
            <select
              id="album-program"
              value={form.programId}
              onChange={(event) => setForm({ ...form, programId: event.target.value })}
              className={inputClass}
            >
              <option value="">Tidak terhubung program</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.title} ({program.year})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Deskripsi album (opsional)" htmlFor="album-description">
            <textarea
              id="album-description"
              rows={4}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              className={inputClass}
            />
          </Field>

          <Field label="Status" htmlFor="album-status">
            <select
              id="album-status"
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value as 'draft' | 'published' })}
              className={inputClass}
            >
              <option value="draft">Draf (tidak tampil di publik)</option>
              <option value="published">Terbit</option>
            </select>
          </Field>

          <ImageField
            label="Sampul album"
            kind="album"
            value={form.coverKey}
            previewUrl={detail?.coverUrl ?? null}
            onChange={(key) => setForm({ ...form, coverKey: key })}
            hint="JPG/PNG/WebP maks 5 MB. Sampul tampil di halaman galeri publik."
          />
        </section>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#D97706] hover:bg-amber-600 text-white text-sm font-bold disabled:opacity-50"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            {saving ? 'Menyimpan...' : isNew ? 'Simpan & Lanjut Unggah Foto' : 'Simpan Perubahan'}
          </button>
          {!isNew && form.status === 'draft' && (
            <button
              type="button"
              disabled={saving}
              onClick={(event) => void save(event, 'published')}
              className="px-4 py-2.5 rounded-xl bg-[#0F1E36] text-white text-sm font-bold disabled:opacity-50"
            >
              Simpan & Terbitkan
            </button>
          )}
        </div>
      </form>

      {!isNew && detail && (
        <MediaManager
          kind="album"
          ownerId={detail.id}
          media={detail.media}
          token={token}
          maxPhotos={60}
          onChanged={load}
        />
      )}

      {isNew && (
        <p className="text-xs text-slate-500">Foto dapat diunggah setelah album disimpan pertama kali.</p>
      )}
    </div>
  );
}
