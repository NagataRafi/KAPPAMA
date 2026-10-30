import { useCallback, useEffect, useState } from 'react';
import { FileText, Download, ExternalLink, Calendar, AlertCircle } from 'lucide-react';
import { getPublicBylaws, type PublicBylaw } from '../../services/content-api';
import { BatikOrnament } from '../../components/common/BatikOrnament';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

export function AdArtPage() {
  const [history, setHistory] = useState<PublicBylaw[]>([]);
  const [selected, setSelected] = useState<PublicBylaw | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPublicBylaws();
      setHistory(res.data.history);
      setSelected(res.data.current);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat AD/ART.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col w-full py-12 px-4">
      <div className="container mx-auto max-w-5xl space-y-10">
        {/* Header Seksi */}
        <div className="relative rounded-3xl bg-[#0F1E36] text-white p-8 sm:p-12 overflow-hidden shadow-lg">
          <BatikOrnament className="absolute inset-0 text-white/5" opacity={0.05} />
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">
              Konstitusi Organisasi
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              AD / ART KAPPAMA
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Anggaran Dasar dan Anggaran Rumah Tangga (AD/ART) sebagai landasan hukum, pedoman operasional, dan prinsip dasar organisasi KAPPAMA.
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
        ) : !selected ? (
          <p className="text-center text-sm text-slate-500">
            Dokumen AD/ART belum tersedia. Pengurus akan mengunggah dokumen resmi.
          </p>
        ) : (
          <>
            {/* Kontrol & Aksi Dokumen */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {selected.isActive ? 'Versi Berlaku (Aktif)' : 'Versi Riwayat'}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Berlaku sejak: {selected.effectiveDate}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-[#0F1E36]">{selected.title}</h2>
              </div>

              {selected.fileUrl && (
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <a
                    href={selected.fileUrl}
                    download
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F1E36] hover:bg-[#162C4E] text-white font-bold text-sm shadow-sm transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    <span>Unduh Dokumen PDF</span>
                  </a>
                  <a
                    href={selected.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                    title="Buka di tab baru"
                    aria-label="Buka dokumen di tab baru"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>

            {/* Embedded PDF Viewer dengan Fallback */}
            {selected.fileUrl && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                <div className="p-3 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <span className="font-semibold flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#D97706]" />
                    Penampil Dokumen PDF Tertanam
                  </span>
                  <span className="text-[11px] text-slate-500">Dokumen resmi KAPPAMA</span>
                </div>

                <div className="w-full h-[600px] bg-slate-900 flex items-center justify-center relative">
                  <object data={selected.fileUrl} type="application/pdf" className="w-full h-full">
                    <div className="p-8 text-center text-white space-y-4 max-w-md mx-auto">
                      <FileText className="w-16 h-16 text-amber-400 mx-auto" />
                      <h3 className="text-lg font-bold">Pratinjau PDF Tidak Didukung Peramban Ini</h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Peramban Anda tidak mendukung penampil PDF langsung di halaman ini. Silakan unduh dokumen atau buka langsung di tab baru.
                      </p>
                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <a
                          href={selected.fileUrl}
                          download
                          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#D97706] hover:bg-amber-600 text-white font-bold text-xs"
                        >
                          Unduh PDF
                        </a>
                        <a
                          href={selected.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-xs"
                        >
                          Buka Tab Baru
                        </a>
                      </div>
                    </div>
                  </object>
                </div>
              </div>
            )}

            {/* Riwayat Versi AD/ART */}
            {history.length > 1 && (
              <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-base text-[#0F1E36]">Arsip & Riwayat Versi Dokumen</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Daftar versi AD/ART hasil musyawarah besar sebelumnya</p>
                </div>

                <div className="space-y-3">
                  {history.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setSelected(item)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                        selected.id === item.id
                          ? 'border-[#D97706] bg-amber-50/40 shadow-sm'
                          : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FileText
                          className={`w-5 h-5 shrink-0 ${selected.id === item.id ? 'text-[#D97706]' : 'text-slate-400'}`}
                        />
                        <div>
                          <h4 className="font-bold text-sm text-[#0F1E36]">{item.title}</h4>
                          <span className="text-xs text-slate-500">Berlaku: {item.effectiveDate}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {item.isActive && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            Aktif
                          </span>
                        )}
                        <span className="text-xs font-semibold text-[#0F1E36] hover:underline">
                          {selected.id === item.id ? 'Sedang Dibuka' : 'Lihat'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
