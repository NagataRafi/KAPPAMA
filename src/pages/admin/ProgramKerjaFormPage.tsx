import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useAppAuth } from '../../components/auth/AuthContext';
import {
  createProgram,
  getAdminProgram,
  updateProgram,
  type AdminProgramDetail,
} from '../../services/content-api';
import { getUniversities } from '../../services/api';
import { Field, FormMessage, inputClass } from '../../components/admin/AdminForm';
import { ImageField } from '../../components/admin/ImageField';
import { MediaManager } from '../../components/admin/MediaManager';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

interface University {
  id: string;
  name: string;
  abbreviation: string;
  city: string;
}

interface FormState {
  title: string;
  slug: string;
  year: string;
  eventDate: string;
  location: string;
  summary: string;
  description: string;
  objectives: string;
  targets: string;
  picName: string;
  universityId: string;
  status: 'draft' | 'published';
  coverKey: string | null;
}

const emptyForm = (): FormState => ({
  title: '',
  slug: '',
  year: String(new Date().getFullYear()),
  eventDate: '',
  location: '',
  summary: '',
  description: '',
  objectives: '',
  targets: '',
  picName: '',
  universityId: '',
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

export function ProgramKerjaFormPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'baru';
  const { token } = useAppAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(emptyForm());
  const [detail, setDetail] = useState<AdminProgramDetail | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    void getUniversities()
      .then(setUniversities)
      .catch(() => setUniversities([]));
  }, []);

  const load = useCallback(async () => {
    if (isNew || !id) return;
    setLoading(true);
    try {
      const res = await getAdminProgram(id, token);
      setDetail(res.data);
      setForm({
        title: res.data.title,
        slug: res.data.slug,
        year: String(res.data.year),
        eventDate: res.data.eventDate ?? '',
        location: res.data.location ?? '',
        summary: res.data.summary,
        description: res.data.description,
        objectives: res.data.objectives ?? '',
        targets: res.data.targets ?? '',
        picName: res.data.picName ?? '',
        universityId: res.data.universityId ?? '',
        status: res.data.status,
        coverKey: res.data.coverKey,
      });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Gagal memuat program kerja.', type: 'error' });
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
      location: form.location,
      summary: form.summary,
      description: form.description,
      objectives: form.objectives,
      targets: form.targets,
      picName: form.picName,
      coverKey: form.coverKey,
      universityId: form.universityId || null,
      status: statusOverride ?? form.status,
    };
    try {
      if (isNew) {
        const res = await createProgram(payload, token);
        navigate(`/admin/program-kerja/${res.data.id}`, { replace: true });
      } else if (id) {
        await updateProgram(id, payload, token);
        setForm({ ...form, slug: payload.slug, status: payload.status });
        await load();
        setMessage({ text: 'Program kerja berhasil disimpan.', type: 'success' });
      }
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Gagal menyimpan program kerja.', type: 'error' });
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
            {isNew ? 'Tambah Program Kerja' : 'Ubah Program Kerja'}
          </h1>
          <p className="text-xs text-slate-600">
            Teks disimpan sebagai teks biasa (aman dari XSS). Baris baru dipertahankan pada halaman publik.
          </p>
        </div>
        <Link
          to="/admin/program-kerja"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Daftar Program
        </Link>
      </header>

      <FormMessage message={message} />

      <form onSubmit={(event) => void save(event)} className="space-y-5">
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <Field label="Judul program" htmlFor="program-title">
            <input
              id="program-title"
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

          <Field label="Slug URL" htmlFor="program-slug" hint="Huruf kecil, angka, dan tanda hubung. Harus unik.">
            <input
              id="program-slug"
              required
              value={form.slug}
              onChange={(event) => setForm({ ...form, slug: toSlug(event.target.value) })}
              className={inputClass}
              placeholder="bakti-sosial-pacitan-2026"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Tahun" htmlFor="program-year">
              <input
                id="program-year"
                type="number"
                min={2000}
                max={2100}
                required
                value={form.year}
                onChange={(event) => setForm({ ...form, year: event.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Tanggal kegiatan (opsional)" htmlFor="program-date">
              <input
                id="program-date"
                type="date"
                value={form.eventDate}
                onChange={(event) => setForm({ ...form, eventDate: event.target.value })}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Lokasi (opsional)" htmlFor="program-location">
              <input
                id="program-location"
                value={form.location}
                onChange={(event) => setForm({ ...form, location: event.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Universitas terkait (opsional)" htmlFor="program-university">
              <select
                id="program-university"
                value={form.universityId}
                onChange={(event) => setForm({ ...form, universityId: event.target.value })}
                className={inputClass}
              >
                <option value="">Umum / lintas kampus</option>
                {universities.map((university) => (
                  <option key={university.id} value={university.id}>
                    {university.name} ({university.abbreviation})
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Ringkasan singkat" htmlFor="program-summary" hint="Tampil di kartu daftar program.">
            <textarea
              id="program-summary"
              required
              rows={2}
              value={form.summary}
              onChange={(event) => setForm({ ...form, summary: event.target.value })}
              className={inputClass}
            />
          </Field>

          <Field label="Deskripsi lengkap" htmlFor="program-description">
            <textarea
              id="program-description"
              required
              rows={8}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              className={inputClass}
            />
          </Field>

          <Field label="Tujuan (satu poin per baris, opsional)" htmlFor="program-objectives">
            <textarea
              id="program-objectives"
              rows={4}
              value={form.objectives}
              onChange={(event) => setForm({ ...form, objectives: event.target.value })}
              className={inputClass}
            />
          </Field>

          <Field label="Sasaran peserta (opsional)" htmlFor="program-targets">
            <textarea
              id="program-targets"
              rows={2}
              value={form.targets}
              onChange={(event) => setForm({ ...form, targets: event.target.value })}
              className={inputClass}
            />
          </Field>

          <Field label="Penanggung jawab (opsional)" htmlFor="program-pic">
            <input
              id="program-pic"
              value={form.picName}
              onChange={(event) => setForm({ ...form, picName: event.target.value })}
              className={inputClass}
            />
          </Field>

          <Field label="Status" htmlFor="program-status">
            <select
              id="program-status"
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value as 'draft' | 'published' })}
              className={inputClass}
            >
              <option value="draft">Draf (tidak tampil di publik)</option>
              <option value="published">Terbit</option>
            </select>
          </Field>

          <ImageField
            label="Foto sampul"
            kind="program"
            value={form.coverKey}
            previewUrl={detail?.coverUrl ?? null}
            onChange={(key) => setForm({ ...form, coverKey: key })}
            hint="JPG/PNG/WebP maks 5 MB. Disarankan lanskap 16:9."
          />
        </section>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#D97706] hover:bg-amber-600 text-white text-sm font-bold disabled:opacity-50"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            {saving ? 'Menyimpan...' : isNew ? 'Simpan & Lanjut Unggah Media' : 'Simpan Perubahan'}
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
          kind="program"
          ownerId={detail.id}
          media={detail.media}
          token={token}
          maxPhotos={30}
          onChanged={load}
        />
      )}

      {isNew && (
        <p className="text-xs text-slate-500">
          Foto dan video dapat diunggah setelah program kerja disimpan pertama kali.
        </p>
      )}
    </div>
  );
}
