import { useCallback, useEffect, useState } from 'react';
import { useAppAuth } from '../../components/auth/AuthContext';
import { getAdminOrg, saveAdminOrg } from '../../services/content-api';
import { Field, FormMessage, inputClass } from '../../components/admin/AdminForm';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

export function ProfilOrganisasiPage() {
  const { token } = useAppAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [aboutText, setAboutText] = useState('');
  const [visionText, setVisionText] = useState('');
  const [missions, setMissions] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactInstagram, setContactInstagram] = useState('');
  const [contactAddress, setContactAddress] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminOrg(token);
      if (res.data) {
        setAboutText(res.data.aboutText ?? '');
        setVisionText(res.data.visionText ?? '');
        setMissions((res.data.missions ?? []).join('\n'));
        setContactEmail(res.data.contactEmail ?? '');
        setContactInstagram(res.data.contactInstagram ?? '');
        setContactAddress(res.data.contactAddress ?? '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat profil organisasi.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await saveAdminOrg(
        {
          aboutText,
          visionText,
          missions: missions
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean),
          contactEmail: contactEmail.trim(),
          contactInstagram: contactInstagram.trim(),
          contactAddress: contactAddress.trim(),
        },
        token
      );
      setMessage({ text: 'Profil organisasi berhasil disimpan.', type: 'success' });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Gagal menyimpan.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSkeleton type="text" count={2} />;

  if (error) {
    return (
      <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-6 space-y-3">
        <p className="text-sm font-semibold">{error}</p>
        <button type="button" onClick={load} className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold">
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
      <header className="space-y-1">
        <h1 className="text-xl font-extrabold text-[#0F1E36]">Profil Organisasi</h1>
        <p className="text-xs text-slate-600">
          Teks disimpan sebagai teks biasa. Tag HTML otomatis dibuang di server agar aman dari XSS.
          Gunakan baris baru untuk memisahkan paragraf atau misi.
        </p>
      </header>

      <FormMessage message={message} />

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <Field label="Tentang KAPPAMA" htmlFor="about">
          <textarea
            id="about"
            required
            rows={5}
            value={aboutText}
            onChange={(event) => setAboutText(event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Visi" htmlFor="vision">
          <textarea
            id="vision"
            required
            rows={3}
            value={visionText}
            onChange={(event) => setVisionText(event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Misi (satu misi per baris)" htmlFor="missions" hint="Minimal 1, maksimal 10 misi.">
          <textarea
            id="missions"
            required
            rows={6}
            value={missions}
            onChange={(event) => setMissions(event.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-bold text-[#0F1E36]">Kontak Resmi</h2>
        <Field label="Email" htmlFor="email">
          <input
            id="email"
            type="email"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
            className={inputClass}
            placeholder="kappama.malang@gmail.com"
          />
        </Field>
        <Field label="Instagram (tanpa URL)" htmlFor="instagram">
          <input
            id="instagram"
            value={contactInstagram}
            onChange={(event) => setContactInstagram(event.target.value)}
            className={inputClass}
            placeholder="kappama_malang"
          />
        </Field>
        <Field label="Alamat sekretariat" htmlFor="address">
          <textarea
            id="address"
            rows={2}
            value={contactAddress}
            onChange={(event) => setContactAddress(event.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2.5 rounded-xl bg-[#D97706] hover:bg-amber-600 text-white text-sm font-bold disabled:opacity-50"
      >
        {saving ? 'Menyimpan...' : 'Simpan Profil'}
      </button>
    </form>
  );
}
