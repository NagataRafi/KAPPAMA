import { useState } from 'react';
import { FileText, Download, ExternalLink, Calendar } from 'lucide-react';
import { dummyBylaws, BylawsVersion } from '../../data/dummy-content';
import { BatikOrnament } from '../../components/common/BatikOrnament';

export function AdArtPage() {
  const [selectedBylaw, setSelectedBylaw] = useState<BylawsVersion>(
    dummyBylaws.find((b) => b.isActive) || dummyBylaws[0]
  );

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

        {/* Kontrol & Aksi Dokumen */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {selectedBylaw.isActive ? 'Versi Berlaku (Aktif)' : 'Versi Riwayat'}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Berlaku sejak: {selectedBylaw.effectiveDate}
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#0F1E36]">{selectedBylaw.title}</h2>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <a
              href={selectedBylaw.fileUrl}
              download
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F1E36] hover:bg-[#162C4E] text-white font-bold text-sm shadow-sm transition-all active:scale-95"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Unduh Dokumen PDF</span>
            </a>
            <a
              href={selectedBylaw.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              title="Buka di tab baru"
              aria-label="Buka dokumen di tab baru"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Embedded PDF Viewer dengan Fallback */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
          <div className="p-3 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#D97706]" />
              Penampil Dokumen PDF Tertanam
            </span>
            <span className="text-[11px] text-slate-500">Ukuran: {selectedBylaw.fileSize}</span>
          </div>

          <div className="w-full h-[600px] bg-slate-900 flex items-center justify-center relative">
            {/* Menggunakan <object> dengan fallback interaktif untuk mobile */}
            <object
              data={selectedBylaw.fileUrl}
              type="application/pdf"
              className="w-full h-full"
            >
              {/* Fallback jika browser (terutama ponsel) tidak mendukung viewer PDF bawaan */}
              <div className="p-8 text-center text-white space-y-4 max-w-md mx-auto">
                <FileText className="w-16 h-16 text-amber-400 mx-auto" />
                <h3 className="text-lg font-bold">Pratinjau PDF Tidak Didukung Peramban Ini</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Peramban Anda tidak mendukung penampil PDF langsung di halaman ini. Silakan unduh dokumen atau buka langsung di tab baru.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href={selectedBylaw.fileUrl}
                    download
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#D97706] hover:bg-amber-600 text-white font-bold text-xs"
                  >
                    Unduh PDF ({selectedBylaw.fileSize})
                  </a>
                  <a
                    href={selectedBylaw.fileUrl}
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

        {/* Riwayat Versi AD/ART */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-bold text-base text-[#0F1E36]">Arsip & Riwayat Versi Dokumen</h3>
            <p className="text-xs text-slate-500 mt-0.5">Daftar versi AD/ART hasil musyawarah besar sebelumnya</p>
          </div>

          <div className="space-y-3">
            {dummyBylaws.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedBylaw(item)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  selectedBylaw.id === item.id
                    ? 'border-[#D97706] bg-amber-50/40 shadow-sm'
                    : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className={`w-5 h-5 shrink-0 ${selectedBylaw.id === item.id ? 'text-[#D97706]' : 'text-slate-400'}`} />
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
                    {selectedBylaw.id === item.id ? 'Sedang Dibuka' : 'Lihat'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
