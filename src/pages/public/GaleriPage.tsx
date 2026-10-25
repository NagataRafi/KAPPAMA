import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Calendar, ArrowRight, Filter, Video } from 'lucide-react';
import { dummyAlbums } from '../../data/dummy-content';
import { BatikOrnament } from '../../components/common/BatikOrnament';
import { EmptyState } from '../../components/common/EmptyState';

export function GaleriPage() {
  const [selectedYear, setSelectedYear] = useState<string>('all');

  const filteredAlbums = useMemo(() => {
    return dummyAlbums.filter((a) => {
      return selectedYear === 'all' || a.year.toString() === selectedYear;
    });
  }, [selectedYear]);

  const years = ['all', '2026', '2025'];

  return (
    <div className="flex flex-col w-full py-12 px-4">
      <div className="container mx-auto max-w-5xl space-y-10">
        {/* Header Seksi */}
        <div className="relative rounded-3xl bg-[#0F1E36] text-white p-8 sm:p-12 overflow-hidden shadow-lg">
          <BatikOrnament className="absolute inset-0 text-white/5" opacity={0.05} />
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">
              Arsip Visual
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Galeri Kegiatan KAPPAMA
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Kumpulan dokumentasi foto dan video kilas balik kebersamaan, program kerja, dan dinamika keorganisasian mahasiswa Pacitan di Malang.
            </p>
          </div>
        </div>

        {/* Filter Tahun */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Filter className="w-4 h-4 text-[#D97706]" />
            <span>Filter Tahun Kegiatan:</span>
          </div>

          <div className="flex items-center gap-2">
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedYear === y
                    ? 'bg-[#0F1E36] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {y === 'all' ? 'Semua Tahun' : y}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Album Galeri */}
        {filteredAlbums.length === 0 ? (
          <EmptyState
            title="Belum Ada Album"
            description="Tidak ada dokumentasi kegiatan untuk filter tahun yang dipilih."
            actionText="Lihat Semua Tahun"
            onAction={() => setSelectedYear('all')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredAlbums.map((album) => (
              <article
                key={album.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 flex flex-col group"
              >
                <div className="relative h-60 overflow-hidden bg-slate-900">
                  <img
                    src={album.coverImage}
                    alt={album.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-95"
                  />
                  <div className="absolute top-3 left-3 bg-[#0F1E36]/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full">
                    {album.year}
                  </div>
                  {album.youtubeId && (
                    <div className="absolute top-3 right-3 bg-red-600 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <Video className="w-3 h-3" />
                      <span>Video</span>
                    </div>
                  )}
                  <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{album.photos.length} Foto</span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-2">
                      <Calendar className="w-3.5 h-3.5 text-[#D97706]" />
                      {album.eventDate}
                    </span>
                    <h3 className="font-bold text-lg text-[#0F1E36] group-hover:text-[#D97706] transition-colors leading-snug">
                      {album.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                      {album.description}
                    </p>
                  </div>

                  <Link
                    to={`/galeri/${album.slug}`}
                    className="pt-4 border-t border-slate-100 text-xs font-bold text-[#0F1E36] hover:text-[#D97706] flex items-center justify-between"
                  >
                    <span>Buka Album Foto & Video</span>
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
