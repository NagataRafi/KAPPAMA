import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAppAuth } from '../../components/auth/AuthContext';
import { getMembers, getDistricts, getUniversities, getStudyPrograms, ApiMemberProfile } from '../../services/api';
import { Search, MessageCircle, Mail, MapPin, GraduationCap, Briefcase, ChevronRight, X } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

export function DirektoriPage() {
  const { token } = useAppAuth();

  const [members, setMembers] = useState<ApiMemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, limit: 20, count: 0, total: 0 });

  // Filter state
  const [search, setSearch] = useState('');
  const [type, setType] = useState<'all' | 'active' | 'alumni'>('all');
  const [cohort, setCohort] = useState<string>('');
  const [universityId, setUniversityId] = useState<string>('');
  const [districtId, setDistrictId] = useState<string>('');
  const [studyProgramId, setStudyProgramId] = useState<string>('');

  // Master data filter
  const [districts, setDistricts] = useState<Array<{ id: string; name: string }>>([]);
  const [universities, setUniversities] = useState<Array<{ id: string; name: string; abbreviation: string }>>([]);
  const [studyPrograms, setStudyPrograms] = useState<Array<{ id: string; name: string }>>([]);

  // Load master data filter
  useEffect(() => {
    Promise.all([getDistricts(), getUniversities()])
      .then(([distData, univData]) => {
        setDistricts(distData);
        setUniversities(univData);
      })
      .catch((err) => console.error('Gagal memuat filter data:', err));
  }, []);

  // Program studi bergantung pada kampus terpilih
  useEffect(() => {
    getStudyPrograms(universityId || undefined)
      .then((programs) => setStudyPrograms(programs))
      .catch((err: unknown) => console.error('Gagal memuat prodi:', err));
  }, [universityId]);

  // Kembali ke halaman 1 saat filter berubah
  useEffect(() => {
    setMeta((prev) => (prev.page === 1 ? prev : { ...prev, page: 1 }));
  }, [search, type, cohort, universityId, districtId, studyProgramId]);

  // Fetch data direktori
  const fetchMembersList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMembers(
        {
          search: search.trim() || undefined,
          type,
          cohort: cohort ? parseInt(cohort) : undefined,
          universityId: universityId || undefined,
          districtId: districtId || undefined,
          studyProgramId: studyProgramId || undefined,
          page: meta.page,
          limit: meta.limit,
        },
        token
      );
      setMembers(res.data);
      setMeta(res.meta);
    } catch (err) {
      console.error('Gagal mengambil daftar anggota:', err);
    } finally {
      setLoading(false);
    }
  }, [search, type, cohort, universityId, districtId, studyProgramId, meta.page, meta.limit, token]);

  useEffect(() => {
    fetchMembersList();
  }, [fetchMembersList]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMembersList();
  };

  const handleResetFilter = () => {
    setSearch('');
    setType('all');
    setCohort('');
    setUniversityId('');
    setDistrictId('');
    setStudyProgramId('');
    setMeta((prev) => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters = Boolean(search || type !== 'all' || cohort || universityId || districtId || studyProgramId);
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Direktori */}
        <div className="bg-[#0F1E36] rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="text-xs uppercase font-extrabold tracking-wider bg-amber-400/20 text-amber-300 px-3 py-1 rounded-full">
              Jejaring Internal Anggota Terverifikasi
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Direktori Anggota & Alumni
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Temukan sesama mahasiswa dan alumni asal Kabupaten Pacitan yang sedang atau pernah menempuh pendidikan tinggi di Kota Malang.
            </p>
          </div>
        </div>

        {/* Baris Pencarian & Tab Kategori */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
            {/* Tab Tipe: Semua · Mahasiswa Aktif · Alumni */}
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl w-full sm:w-auto">
              <button
                onClick={() => setType('all')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  type === 'all'
                    ? 'bg-white text-[#0F1E36] shadow-sm'
                    : 'text-slate-600 hover:text-[#0F1E36]'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setType('active')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  type === 'active'
                    ? 'bg-white text-[#0F1E36] shadow-sm'
                    : 'text-slate-600 hover:text-[#0F1E36]'
                }`}
              >
                Mahasiswa Aktif
              </button>
              <button
                onClick={() => setType('alumni')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  type === 'alumni'
                    ? 'bg-white text-[#0F1E36] shadow-sm'
                    : 'text-slate-600 hover:text-[#0F1E36]'
                }`}
              >
                Alumni
              </button>
            </div>

            {/* Form Pencarian Teks */}
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau username..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#D97706]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </form>
          </div>

          {/* Baris Filter Terperinci */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-1">
            {/* Filter Universitas */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Perguruan Tinggi</label>
              <select
                value={universityId}
                onChange={(e) => {
                  setUniversityId(e.target.value);
                  setStudyProgramId('');
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#D97706]"
              >
                <option value="">Semua Kampus</option>
                {universities.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.abbreviation || u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Program Studi */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Program Studi</label>
              <select
                value={studyProgramId}
                onChange={(e) => setStudyProgramId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#D97706]"
              >
                <option value="">Semua Prodi</option>
                {studyPrograms.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Kecamatan Pacitan */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Kecamatan Asal</label>
              <select
                value={districtId}
                onChange={(e) => setDistrictId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#D97706]"
              >
                <option value="">Semua Kecamatan</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    Kec. {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Angkatan */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tahun Angkatan</label>
              <select
                value={cohort}
                onChange={(e) => setCohort(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#D97706]"
              >
                <option value="">Semua Angkatan</option>
                {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                  <option key={year} value={year}>
                    Angkatan {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filter Button */}
            <div className="flex items-end">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilter}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Daftar Anggota */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <LoadingSkeleton type="card" count={6} />
          </div>
        ) : members.length === 0 ? (
          <EmptyState
            title="Tidak Ada Anggota Ditemukan"
            description="Tidak ada profil yang cocok dengan kriteria pencarian atau filter yang Anda tentukan."
            actionText="Reset Pencarian"
            onAction={handleResetFilter}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((m) => {
              const isAlumni = m.memberType === 'alumni';
              const initial = m.fullName ? m.fullName.charAt(0).toUpperCase() : 'K';

              return (
                <div
                  key={m.id}
                  className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-amber-200 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Header Kartu: Avatar & Tipe */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#0F1E36] text-white flex items-center justify-center font-extrabold text-lg shadow-sm">
                          {initial}
                        </div>
                        <div>
                          <h2 className="font-bold text-sm text-[#0F172A] group-hover:text-[#D97706] transition-colors line-clamp-1">
                            {m.fullName}
                          </h2>
                          <span className="text-xs text-slate-400">@{m.username}</span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                          isAlumni
                            ? 'bg-amber-100 text-[#D97706]'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isAlumni ? 'Alumni' : 'Aktif'}
                      </span>
                    </div>

                    {/* Informasi Akademik & Asal */}
                    <div className="space-y-2 text-xs text-slate-600 mb-4">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-[#D97706] flex-shrink-0" />
                        <span className="font-medium text-slate-800 line-clamp-1">
                          {m.universityAbbr || m.universityName} • {m.studyProgramName} ('{String(m.cohortYear).slice(-2)})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="line-clamp-1">
                          Kec. {m.districtName}, Desa {m.villageName}
                        </span>
                      </div>

                      {/* Khusus Alumni: Pekerjaan */}
                      {isAlumni && m.alumni && (
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                          <Briefcase className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <span className="line-clamp-1 text-slate-700 font-medium">
                            {m.alumni.jobTitle ? `${m.alumni.jobTitle} di ${m.alumni.organization || 'Mandiri'}` : 'Alumni KAPPAMA'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Kartu: Kontak & Aksi */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {m.whatsapp ? (
                        <a
                          href={`https://wa.me/${m.whatsapp.replace('+', '')}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Hubungi via WhatsApp"
                          className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      ) : (
                        <span
                          title="Kontak disembunyikan oleh anggota"
                          className="text-[11px] text-slate-400 italic"
                        >
                          Kontak privat
                        </span>
                      )}

                      {m.email && !m.hideContact && (
                        <a
                          href={`mailto:${m.email}`}
                          title="Kirim Email"
                          className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                    <Link
                      to={`/anggota/${m.username}`}
                      className="text-xs font-bold text-[#0F1E36] hover:text-[#D97706] flex items-center gap-1 transition-colors"
                    >
                      <span>Lihat Profil</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Kontrol Pagination */}
        {!loading && members.length > 0 && (
          <div className="flex items-center justify-between gap-3 pt-2">
            <p className="text-xs text-slate-500">
              Halaman {meta.page} dari {totalPages} · {meta.total} anggota
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMeta((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={meta.page <= 1}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                onClick={() =>
                  setMeta((prev) => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))
                }
                disabled={meta.page >= totalPages}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
