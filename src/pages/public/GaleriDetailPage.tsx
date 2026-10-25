import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Camera, Video, X } from 'lucide-react';
import { dummyAlbums } from '../../data/dummy-content';

export function GaleriDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  const album = dummyAlbums.find((a) => a.slug === slug);

  if (!album) {
    return (
      <div className="container mx-auto max-w-xl py-20 px-4 text-center">
        <h2 className="text-2xl font-bold text-[#0F1E36] mb-3">Album Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500 mb-6">Album dokumentasi tersebut tidak ditemukan atau telah dipindahkan.</p>
        <Link to="/galeri" className="px-6 py-2.5 rounded-xl bg-[#0F1E36] text-white font-bold text-sm">
          Kembali ke Galeri
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full py-12 px-4">
      <div className="container mx-auto max-w-5xl space-y-10">
        {/* Tombol Kembali */}
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#D97706] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Galeri</span>
          </button>
        </div>

        {/* Header Album */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="px-3 py-1 rounded-full bg-[#0F1E36] text-amber-300 font-bold">
              Tahun {album.year}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#D97706]" />
              {album.eventDate}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F1E36] tracking-tight">
            {album.title}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
            {album.description}
          </p>
        </div>

        {/* Video YouTube Jika Ada */}
        {album.youtubeId && (
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-[#0F1E36]">
              <Video className="w-5 h-5 text-red-600" />
              <h2 className="text-xl font-bold">Video Dokumentasi Kegiatan</h2>
            </div>
            <div className="rounded-2xl overflow-hidden aspect-video bg-black shadow-inner">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${album.youtubeId}`}
                title={album.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
                className="w-full h-full border-0"
              />
            </div>
          </section>
        )}

        {/* Grid Foto Kegiatan */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[#0F1E36]">
            <Camera className="w-5 h-5 text-[#D97706]" />
            <h2 className="text-xl font-bold">Foto Dokumentasi ({album.photos.length})</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {album.photos.map((photo, i) => (
              <div
                key={i}
                onClick={() => setActivePhoto(photo.url)}
                className="group cursor-pointer rounded-2xl overflow-hidden aspect-video bg-slate-100 relative shadow-sm border border-slate-100"
              >
                <img
                  src={photo.url}
                  alt={photo.caption}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="text-white text-xs leading-snug line-clamp-2">{photo.caption}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Lightbox Modal */}
        {activePhoto && (
          <div
            onClick={() => setActivePhoto(null)}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in"
          >
            <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center">
              <img
                src={activePhoto}
                alt="Dokumentasi Full"
                className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
              />
              <button
                onClick={() => setActivePhoto(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/40 flex items-center justify-center font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
