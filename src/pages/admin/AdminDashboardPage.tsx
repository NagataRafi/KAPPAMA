import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CalendarDays, Clock, FileText, Images, RefreshCw, Users } from 'lucide-react';
import { useAppAuth } from '../../components/auth/AuthContext';
import { getContentSummary, type ContentSummary } from '../../services/content-api';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

export function AdminDashboardPage() {
  const { token, role } = useAppAuth();
  const [summary, setSummary] = useState<ContentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getContentSummary(token);
      setSummary(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat ringkasan.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const cards = summary
    ? [
        {
          label: 'Pendaftar Menunggu Persetujuan',
          value: summary.pendingMembers,
          to: '/admin/persetujuan',
          icon: Clock,
          accent: 'text-amber-600 bg-amber-50',
        },
        {
          label: 'Program Kerja Terbit',
          value: summary.publishedPrograms,
          to: '/admin/program-kerja',
          icon: CalendarDays,
          accent: 'text-emerald-600 bg-emerald-50',
        },
        {
          label: 'Program Kerja Draf',
          value: summary.draftPrograms,
          to: '/admin/program-kerja',
          icon: CalendarDays,
          accent: 'text-slate-600 bg-slate-100',
        },
        {
          label: 'Album Galeri Terbit',
          value: summary.publishedAlbums,
          to: '/admin/galeri',
          icon: Images,
          accent: 'text-emerald-600 bg-emerald-50',
        },
        {
          label: 'Album Galeri Draf',
          value: summary.draftAlbums,
          to: '/admin/galeri',
          icon: Images,
          accent: 'text-slate-600 bg-slate-100',
        },
        {
          label: 'Periode Kepengurusan',
          value: summary.periods,
          to: '/admin/struktur',
          icon: Users,
          accent: 'text-[#0F1E36] bg-slate-100',
        },
        {
          label: 'Dokumen AD/ART',
          value: summary.bylaws,
          to: '/admin/ad-art',
          icon: FileText,
          accent: 'text-[#0F1E36] bg-slate-100',
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <header className="bg-[#0F1E36] text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold">Dashboard Pengurus</h1>
          <p className="text-slate-300 text-xs sm:text-sm">
            Ringkasan tugas konten dan pendaftaran. Masuk sebagai{' '}
            {role === 'super_admin' ? 'Super Admin' : 'Admin Konten'}.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Segarkan
        </button>
      </header>

      {loading ? (
        <LoadingSkeleton type="card" count={4} />
      ) : error ? (
        <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-6 space-y-3">
          <p className="text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" aria-hidden="true" /> {error}
          </p>
          <button
            type="button"
            onClick={load}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold"
          >
            Coba Lagi
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <Link
              key={card.label}
              to={card.to}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4"
            >
              <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.accent}`}>
                <card.icon className="w-5 h-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-2xl font-extrabold text-[#0F1E36]">{card.value}</span>
                <span className="block text-xs text-slate-600 font-semibold">{card.label}</span>
              </span>
            </Link>
          ))}
        </div>
      )}

      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h2 className="font-bold text-sm text-[#0F1E36] mb-3">Aksi Cepat</h2>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/program-kerja/baru" className="px-4 py-2 rounded-xl bg-[#D97706] text-white text-xs font-bold">
            Tambah Program Kerja
          </Link>
          <Link to="/admin/galeri/baru" className="px-4 py-2 rounded-xl bg-[#0F1E36] text-white text-xs font-bold">
            Tambah Album Galeri
          </Link>
          <Link to="/admin/profil-organisasi" className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
            Ubah Profil Organisasi
          </Link>
        </div>
      </section>
    </div>
  );
}
