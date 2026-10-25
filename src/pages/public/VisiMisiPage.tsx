import { Compass, Target } from 'lucide-react';
import { dummyOrgProfile } from '../../data/dummy-content';
import { BatikOrnament } from '../../components/common/BatikOrnament';

export function VisiMisiPage() {
  return (
    <div className="flex flex-col w-full py-12 px-4">
      <div className="container mx-auto max-w-4xl space-y-12">
        {/* Header Seksi */}
        <div className="relative rounded-3xl bg-[#0F1E36] text-white p-8 sm:p-12 overflow-hidden shadow-lg">
          <BatikOrnament className="absolute inset-0 text-white/5" opacity={0.05} />
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">
              Pedoman Organisasi
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Visi & Misi KAPPAMA
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Komitmen arah gerak, tujuan strategis, dan cita-cita luhur organisasi bagi kemaslahatan mahasiswa dan kemajuan daerah.
            </p>
          </div>
        </div>

        {/* Visi */}
        <section className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 text-[#0F1E36] pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#D97706] flex items-center justify-center">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Visi KAPPAMA</h2>
              <span className="text-xs text-slate-500">Arah cita-cita masa depan</span>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/60">
            <p className="text-base sm:text-lg font-bold text-[#0F1E36] leading-relaxed text-center sm:text-left">
              &ldquo;{dummyOrgProfile.vision}&rdquo;
            </p>
          </div>
        </section>

        {/* Misi */}
        <section className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 text-[#0F1E36] pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Misi KAPPAMA</h2>
              <span className="text-xs text-slate-500">Langkah strategis perwujudan visi</span>
            </div>
          </div>

          <div className="space-y-4">
            {dummyOrgProfile.missions.map((misi, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-200/50"
              >
                <div className="w-8 h-8 rounded-full bg-[#0F1E36] text-white flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 shadow-sm">
                  {index + 1}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  {misi}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
