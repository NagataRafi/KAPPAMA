import { useCallback, useEffect, useState } from 'react';
import { BookOpen, MapPin, Mail, Instagram, ShieldCheck, HeartHandshake, AlertCircle } from 'lucide-react';
import { getPublicOrg, type PublicOrgProfile } from '../../services/content-api';
import { BatikOrnament } from '../../components/common/BatikOrnament';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

const FALLBACK_EMAIL = 'kappama.malang@gmail.com';
const FALLBACK_INSTAGRAM = '@kappama.malang';

export function ProfilPage() {
  const [org, setOrg] = useState<PublicOrgProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPublicOrg();
      setOrg(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat profil organisasi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col w-full py-12 px-4">
      <div className="container mx-auto max-w-4xl space-y-12">
        {/* Header Seksi */}
        <div className="relative rounded-3xl bg-[#0F1E36] text-white p-8 sm:p-12 overflow-hidden shadow-lg">
          <BatikOrnament className="absolute inset-0 text-white/5" opacity={0.05} />
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">
              Profil Organisasi
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Tentang KAPPAMA
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Mengenal lebih dekat identitas, sejarah singkat, dan nilai luhur persaudaraan pelajar dan mahasiswa Pacitan di Kota Malang.
            </p>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton type="text" count={2} />
        ) : error ? (
          <div role="alert" className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-800 space-y-3">
            <p className="text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" aria-hidden="true" /> {error}
            </p>
            <button onClick={load} className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold">
              Coba Lagi
            </button>
          </div>
        ) : (
          <>
            {/* Definisi Resmi & Penjelasan */}
            <section className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3 text-[#0F1E36] pb-4 border-b border-slate-100">
                <BookOpen className="w-6 h-6 text-[#D97706]" />
                <h2 className="text-xl font-bold">Definisi Organisasi</h2>
              </div>

              {org?.aboutText ? (
                <div className="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line">
                  {org.aboutText}
                </div>
              ) : (
                <p className="p-4 rounded-xl bg-slate-50 text-xs sm:text-sm text-slate-600 leading-relaxed border border-slate-200/60">
                  [Placeholder - Menunggu Teks Resmi Pengurus]: Profil organisasi belum diisi oleh pengurus.
                </p>
              )}
            </section>

            {/* Kepengurusan */}
            <section className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3 text-[#0F1E36] pb-4 border-b border-slate-100">
                <ShieldCheck className="w-6 h-6 text-[#D97706]" />
                <h2 className="text-xl font-bold">Struktur & Kepengurusan</h2>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Susunan pengurus inti KAPPAMA per periode dapat dilihat pada halaman struktur organisasi.
                Dokumen AD/ART menjadi landasan hukum dan pedoman operasional organisasi.
              </p>
            </section>

            {/* Nilai Budaya & Kontak Resmi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-3 text-[#0F1E36]">
                  <HeartHandshake className="w-5 h-5 text-[#D97706]" />
                  <h3 className="font-bold text-lg">Nilai Budaya Pacitan</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  KAPPAMA senantiasa menanamkan falsafah luhur masyarakat Pacitan: ramah, berintegritas, ulet dalam menuntut ilmu, dan berbakti kepada tanah kelahiran (*Hamemayu Hayuning Bawana*).
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-3 text-[#0F1E36]">
                  <MapPin className="w-5 h-5 text-[#D97706]" />
                  <h3 className="font-bold text-lg">Sekretariat & Kontak</h3>
                </div>
                <div className="space-y-2 text-xs sm:text-sm text-slate-600">
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#D97706] shrink-0" />
                    <span>{org?.contactAddress || 'Kota Malang, Jawa Timur'}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#D97706] shrink-0" />
                    <span>{org?.contactEmail || FALLBACK_EMAIL}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-[#D97706] shrink-0" />
                    <span>{org?.contactInstagram || FALLBACK_INSTAGRAM}</span>
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
