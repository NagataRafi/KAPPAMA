import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Calendar, ArrowRight, Filter, Video, AlertCircle } from 'lucide-react';
import { getPublicAlbums, type PublicAlbum } from '../../services/content-api';
import { BatikOrnament } from '../../components/common/BatikOrnament';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

export function GaleriPage() {
  const [albums, setAlbums] = useState<PublicAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPublicAlbums();
      setAlbums(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat galeri.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const years = useMemo(
    () => Array.from(new Set(albums.map((album) => album.year))).sort((a, b) => b - a),
    [albums]
  );

  const filteredAlbums = useMemo(
    () => albums.filter((album) => selectedYear === 'all' || album.year.toString() === selectedYear),
    [albums, selectedYear]
  );

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
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Filter className="w-4 h-4 text-[#D97706]" />
            <span>Filter Tahun Kegiatan:</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedYear('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedYear === 'all' ? 'bg-[#0F1E36] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Tahun
            </button>
            {years.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(String(year))}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedYear === String(year)
                    ? 'bg-[#0F1E36] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Album Galeri */}
        {loading ? (
          <LoadingSkeleton type="card" count={2} />
        ) : error ? (
          <div role="alert" className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-800 space-y-3">
            <p className="text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" aria-hidden="true" /> {error}
            </p>
            <button onClick={load} className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold">
              Coba Lagi
            </button>
          </div>
        ) : filteredAlbums.length === 0 ? (
          <EmptyState
            title={albums.length === 0 ? 'Belum Ada Album' : 'Belum Ada Album untuk Tahun Ini'}
            description={
              albums.length === 0
                ? 'Pengurus belum menerbitkan album dokumentasi. Silakan kembali lagi nanti.'
                : 'Tidak ada dokumentasi kegiatan untuk filter tahun yang dipilih.'
            }
            actionText={albums.length === 0 ? undefined : 'Lihat Semua Tahun'}
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
                  {album.coverUrl ? (
                    <img
                      src={album.coverUrl}
                      alt={album.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-95"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-semibold">
                      Tanpa Sampul
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-[#0F1E36]/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full">
                    {album.year}
                  </div>
                  {album.videoCount > 0 && (
                    <div className="absolute top-3 right-3 bg-red-600 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <Video className="w-3 h-3" />
                      <span>Video</span>
                    </div>
                  )}
                  <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{album.photoCount} Foto</span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {album.eventDate && (
                      <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-2">
                        <Calendar className="w-3.5 h-3.5 text-[#D97706]" />
                        {new Date(album.eventDate).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                    <h3 className="font-bold text-lg text-[#0F1E36] group-hover:text-[#D97706] transition-colors leading-snug">
                      {album.title}
                    </h3>
                    {album.description && (
                      <p className="text-xs sm:text-sm text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                        {album.description}
                      </p>
                    )}
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
