import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, ArrowRight, Filter } from 'lucide-react';
import { dummyPrograms, dummyUniversities } from '../../data/dummy-content';
import { BatikOrnament } from '../../components/common/BatikOrnament';
import { EmptyState } from '../../components/common/EmptyState';

export function ProgramKerjaPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedUniv, setSelectedUniv] = useState<string>('all');

  const filteredPrograms = useMemo(() => {
    return dummyPrograms.filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.summary.toLowerCase().includes(searchQuery.toLowerCase());
      const matchYear = selectedYear === 'all' || p.year.toString() === selectedYear;
      const matchUniv = selectedUniv === 'all' || p.universityName === selectedUniv;
      return matchSearch && matchYear && matchUniv;
    });
  }, [searchQuery, selectedYear, selectedUniv]);

  const years = ['all', '2026', '2025'];

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
              <input
                type="text"
                placeholder="Cari program kerja..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] placeholder:text-slate-400"
              />
            </div>

            {/* Filter Tahun */}
            <div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#D97706] cursor-pointer"
              >
                <option value="all">Semua Tahun Pelaksanaan</option>
                <option value="2026">Tahun 2026</option>
                <option value="2025">Tahun 2025</option>
              </select>
            </div>

            {/* Filter Universitas (Label Opsional PRD F2) */}
            <div>
              <select
                value={selectedUniv}
                onChange={(e) => setSelectedUniv(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#D97706] cursor-pointer"
              >
                <option value="all">Semua Universitas Mitra</option>
                {dummyUniversities.map((univ) => (
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
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 ${
                  selectedYear === y
                    ? 'bg-[#0F1E36] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {y === 'all' ? 'Semua Tahun' : y}
              </button>
            ))}
          </div>
        </div>

        {/* Daftar Kartu Program Kerja */}
        {filteredPrograms.length === 0 ? (
          <EmptyState
            title="Program Kerja Tidak Ditemukan"
            description="Tidak ada program kerja yang sesuai dengan kata kunci pencarian atau filter yang dipilih."
            actionText="Reset Filter"
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
                  <img
                    src={proker.coverImage}
                    alt={proker.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
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
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {proker.eventDate}
                      </span>
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
