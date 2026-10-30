import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, ArrowRight, Filter, AlertCircle } from 'lucide-react';
import { getPublicPrograms, type PublicProgram } from '../../services/content-api';
import { BatikOrnament } from '../../components/common/BatikOrnament';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

export function ProgramKerjaPage() {
  const [programs, setPrograms] = useState<PublicProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedUniv, setSelectedUniv] = useState<string>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPublicPrograms();
      setPrograms(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat program kerja.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const years = useMemo(
    () => Array.from(new Set(programs.map((program) => program.year))).sort((a, b) => b - a),
    [programs]
  );
  const universities = useMemo(
    () =>
      Array.from(
        new Set(programs.map((program) => program.universityName).filter((name): name is string => Boolean(name)))
      ).sort(),
    [programs]
  );

  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      const keyword = searchQuery.toLowerCase();
      const matchSearch =
        p.title.toLowerCase().includes(keyword) || p.summary.toLowerCase().includes(keyword);
      const matchYear = selectedYear === 'all' || p.year.toString() === selectedYear;
      const matchUniv = selectedUniv === 'all' || p.universityName === selectedUniv;
      return matchSearch && matchYear && matchUniv;
    });
  }, [programs, searchQuery, selectedYear, selectedUniv]);

  return (
    <div className="flex flex-col w-full py-12 px-4">
      <div className="container mx-auto max-w-5xl space-y-10">
        {/* Header Seksi */}
        <div className="relative rounded-3xl bg-[#0F1E36] text-white p-8 sm:p-12 overflow-hidden shadow-lg">
          <BatikOrnament className="absolute inset-0 text-white/5" opacity={0.05} />
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">
              Agenda & Kegiatan
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Program Kerja KAPPAMA
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Daftar kegiatan, pengabdian masyarakat, malam keakraban, dan program kolaboratif mahasiswa Pacitan di Malang.
            </p>
          </div>
        </div>

        {/* Bar Filter & Pencarian */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Input Pencarian */}
            <div className="relative md:col-span-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <label htmlFor="search-program" className="sr-only">
                Cari program kerja
              </label>
              <input
                id="search-program"
                type="text"
                placeholder="Cari program kerja..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] placeholder:text-slate-400"
              />
            </div>

            {/* Filter Tahun */}
            <div>
              <label htmlFor="filter-year" className="sr-only">
                Filter tahun pelaksanaan
              </label>
              <select
                id="filter-year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#D97706] cursor-pointer"
              >
                <option value="all">Semua Tahun Pelaksanaan</option>
                {years.map((year) => (
                  <option key={year} value={String(year)}>
                    Tahun {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Universitas (Label Opsional PRD F2) */}
            <div>
              <label htmlFor="filter-university" className="sr-only">
                Filter universitas mitra
              </label>
              <select
                id="filter-university"
                value={selectedUniv}
                onChange={(e) => setSelectedUniv(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#D97706] cursor-pointer"
              >
                <option value="all">Semua Universitas Mitra</option>
                {universities.map((univ) => (
                  <option key={univ} value={univ}>
                    {univ}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Chip Kategori Cepat */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500 overflow-x-auto">
            <span className="font-semibold flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5 text-[#D97706]" />
              Filter Cepat:
            </span>
            <button
              onClick={() => setSelectedYear('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 ${
                selectedYear === 'all' ? 'bg-[#0F1E36] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Tahun
            </button>
            {years.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(String(year))}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 ${
                  selectedYear === String(year)
                    ? 'bg-[#0F1E36] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        {/* Daftar Kartu Program Kerja */}
        {loading ? (
          <LoadingSkeleton type="card" count={3} />
        ) : error ? (
          <div role="alert" className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-800 space-y-3">
            <p className="text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" aria-hidden="true" /> {error}
            </p>
            <button
              onClick={load}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold"
            >
              Coba Lagi
            </button>
          </div>
        ) : filteredPrograms.length === 0 ? (
          <EmptyState
            title={programs.length === 0 ? 'Belum Ada Program Kerja' : 'Program Kerja Tidak Ditemukan'}
            description={
              programs.length === 0
                ? 'Pengurus belum menerbitkan program kerja. Silakan kembali lagi nanti.'
                : 'Tidak ada program kerja yang sesuai dengan kata kunci pencarian atau filter yang dipilih.'
            }
            actionText={programs.length === 0 ? undefined : 'Reset Filter'}
            onAction={() => {
              setSearchQuery('');
              setSelectedYear('all');
              setSelectedUniv('all');
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPrograms.map((proker) => (
              <article
                key={proker.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 flex flex-col group"
              >
                <div className="relative h-48 overflow-hidden bg-slate-200">
                  {proker.coverUrl ? (
                    <img
                      src={proker.coverUrl}
                      alt={proker.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-semibold">
                      Tanpa Sampul
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-[#0F1E36]/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full">
                    {proker.year}
                  </div>
                  {proker.universityName && (
                    <div className="absolute top-3 right-3 bg-amber-500/95 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-sm">
                      {proker.universityName}
                    </div>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                      {proker.eventDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(proker.eventDate).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-base text-[#0F1E36] group-hover:text-[#D97706] transition-colors line-clamp-2">
                      {proker.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                      {proker.summary}
                    </p>
                  </div>

                  <Link
                    to={`/program-kerja/${proker.slug}`}
                    className="pt-3 border-t border-slate-100 text-xs font-bold text-[#0F1E36] hover:text-[#D97706] flex items-center justify-between"
                  >
                    <span>Detail Program & Dokumentasi</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
