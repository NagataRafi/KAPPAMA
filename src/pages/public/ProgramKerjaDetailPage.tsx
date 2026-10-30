import { useCallback, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, User, ArrowLeft, Target, Video, Image, AlertCircle } from 'lucide-react';
import { getPublicProgram, type PublicProgram } from '../../services/content-api';
import { ApiError } from '../../services/api';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

export function ProgramKerjaDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [program, setProgram] = useState<PublicProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; notFound: boolean } | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getPublicProgram(slug);
      setProgram(res.data);
    } catch (err) {
      const notFound = err instanceof ApiError && err.status === 404;
      setError({
        message: notFound
          ? 'Program kerja dengan alamat tersebut tidak tersedia atau telah diarsipkan.'
          : err instanceof Error
            ? err.message
            : 'Gagal memuat program kerja.',
        notFound,
      });
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-16 px-4">
        <LoadingSkeleton type="text" count={3} />
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="container mx-auto max-w-xl py-20 px-4 text-center space-y-4">
        <h2 className="text-2xl font-bold text-[#0F1E36]">
          {error?.notFound ? 'Program Kerja Tidak Ditemukan' : 'Gagal Memuat Program Kerja'}
        </h2>
        <p className="text-sm text-slate-500">{error?.message}</p>
        <div className="flex items-center justify-center gap-2">
          {!error?.notFound && (
            <button
              onClick={load}
              className="px-5 py-2.5 rounded-xl bg-[#D97706] text-white font-bold text-sm inline-flex items-center gap-1.5"
            >
              <AlertCircle className="w-4 h-4" aria-hidden="true" /> Coba Lagi
            </button>
          )}
          <Link to="/program-kerja" className="px-6 py-2.5 rounded-xl bg-[#0F1E36] text-white font-bold text-sm">
            Kembali ke Daftar Program
          </Link>
        </div>
      </div>
    );
  }

  const photos = (program.media ?? []).filter((item) => item.mediaType === 'image' && item.url);
  const videos = (program.media ?? []).filter((item) => item.mediaType === 'youtube' && item.youtubeId);
  const objectives = (program.objectives ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const formattedDate = program.eventDate
    ? new Date(program.eventDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="flex flex-col w-full py-12 px-4">
      <div className="container mx-auto max-w-4xl space-y-10">
        {/* Navigasi Kembali */}
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#D97706] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>
        </div>

        {/* Header Program */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-full bg-[#0F1E36] text-amber-300 font-bold text-xs">
              Tahun {program.year}
            </span>
            {program.universityName && (
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold text-xs">
                Mitra: {program.universityName}
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F1E36] tracking-tight leading-tight">
            {program.title}
          </h1>

          {/* Meta Informasi */}
          <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm text-slate-500 pt-2 border-t border-slate-200">
            {formattedDate && (
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#D97706]" />
                {formattedDate}
              </span>
            )}
            {program.location && (
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#D97706]" />
                {program.location}
              </span>
            )}
            {program.picName && (
              <span className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#D97706]" />
                PIC: {program.picName}
              </span>
            )}
          </div>
        </div>

        {/* Gambar Sampul Utama */}
        {program.coverUrl && (
          <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-100 max-h-[450px] bg-slate-900">
            <img src={program.coverUrl} alt={program.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Ringkasan & Deskripsi */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
              <h2 className="text-xl font-bold text-[#0F1E36]">Deskripsi Lengkap</h2>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
                {program.description}
              </p>
            </section>

            {/* Tujuan Program */}
            {objectives.length > 0 && (
              <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-[#0F1E36]">
                  <Target className="w-5 h-5 text-[#D97706]" />
                  <h2 className="text-xl font-bold">Tujuan Program</h2>
                </div>
                <ul className="space-y-2.5">
                  {objectives.map((objective, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm text-slate-700">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-[#D97706] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Dokumentasi Foto Program */}
            {photos.length > 0 && (
              <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-[#0F1E36]">
                  <Image className="w-5 h-5 text-[#D97706]" />
                  <h2 className="text-xl font-bold">Galeri Dokumentasi Foto</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {photos.map((photo) => (
                    <button
                      type="button"
                      key={photo.id}
                      onClick={() => setSelectedPhoto(photo.url ?? null)}
                      className="group cursor-pointer rounded-xl overflow-hidden aspect-video bg-slate-100 relative shadow-sm"
                    >
                      <img
                        src={photo.url ?? ''}
                        alt={photo.caption ?? program.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                        <span className="text-white text-xs truncate">{photo.caption}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Sematan Video YouTube */}
            {videos.map((video) => (
              <section
                key={video.id}
                className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4"
              >
                <div className="flex items-center gap-2 text-[#0F1E36]">
                  <Video className="w-5 h-5 text-[#D97706]" />
                  <h2 className="text-xl font-bold">{video.caption || 'Video Dokumentasi'}</h2>
                </div>
                <div className="rounded-2xl overflow-hidden aspect-video bg-black shadow-inner">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}`}
                    title={video.caption || program.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    className="w-full h-full border-0"
                  />
                </div>
              </section>
            ))}
          </div>

          {/* Kolom Samping (Sasaran & Info Ringkas) */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-[#0F1E36] pb-3 border-b border-slate-100">
                Informasi Pelaksanaan
              </h3>
              <div className="space-y-3 text-xs sm:text-sm">
                {program.targets && (
                  <div>
                    <span className="text-slate-400 block mb-0.5">Sasaran Peserta:</span>
                    <span className="font-medium text-slate-800">{program.targets}</span>
                  </div>
                )}
                {program.picName && (
                  <div>
                    <span className="text-slate-400 block mb-0.5">Penanggung Jawab:</span>
                    <span className="font-medium text-slate-800">{program.picName}</span>
                  </div>
                )}
                {formattedDate && (
                  <div>
                    <span className="text-slate-400 block mb-0.5">Waktu:</span>
                    <span className="font-medium text-slate-800">{formattedDate}</span>
                  </div>
                )}
                {program.location && (
                  <div>
                    <span className="text-slate-400 block mb-0.5">Lokasi:</span>
                    <span className="font-medium text-slate-800">{program.location}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#0F1E36] text-white rounded-2xl p-6 shadow-md space-y-3">
              <h4 className="font-bold text-base text-amber-300">Punya Pertanyaan?</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Ingin berkolaborasi atau mengetahui informasi lebih lanjut mengenai agenda kegiatan ini?
              </p>
              <a
                href="mailto:kappama.malang@gmail.com"
                className="block text-center py-2.5 rounded-xl bg-[#D97706] hover:bg-amber-600 text-white font-bold text-xs transition-colors"
              >
                Hubungi Pengurus
              </a>
            </div>
          </div>
        </div>

        {/* Modal Lightbox Foto */}
        {selectedPhoto && (
          <div
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center">
              <img
                src={selectedPhoto}
                alt="Dokumentasi"
                className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
              />
              <button
                onClick={() => setSelectedPhoto(null)}
                aria-label="Tutup pratinjau foto"
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/40 flex items-center justify-center text-lg font-bold"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
