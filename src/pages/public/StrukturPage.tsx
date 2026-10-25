import { useState } from 'react';
import { GraduationCap, ChevronDown, UserCheck } from 'lucide-react';
import { dummyOrgPeriods } from '../../data/dummy-content';
import { BatikOrnament } from '../../components/common/BatikOrnament';

export function StrukturPage() {
  const [selectedPeriodId, setSelectedPeriodId] = useState(dummyOrgPeriods[0].id);

  const activePeriod = dummyOrgPeriods.find((p) => p.id === selectedPeriodId) || dummyOrgPeriods[0];

  return (
    <div className="flex flex-col w-full py-12 px-4">
      <div className="container mx-auto max-w-5xl space-y-12">
        {/* Header Seksi */}
        <div className="relative rounded-3xl bg-[#0F1E36] text-white p-8 sm:p-12 overflow-hidden shadow-lg">
          <BatikOrnament className="absolute inset-0 text-white/5" opacity={0.05} />
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">
                Kepengurusan
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Struktur Organisasi KAPPAMA
              </h1>
              <p className="text-slate-300 text-sm leading-relaxed">
                Struktur kepengurusan inti KAPPAMA: Pembina, Penasihat, Ketua Umum, dan Wakil Ketua Umum.
              </p>
            </div>

            {/* Pemilih Periode */}
            <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20">
              <label htmlFor="period-select" className="text-[11px] font-semibold text-amber-300 block px-2 mb-1">
                Pilih Periode Kepengurusan:
              </label>
              <div className="relative">
                <select
                  id="period-select"
                  value={selectedPeriodId}
                  onChange={(e) => setSelectedPeriodId(e.target.value)}
                  className="w-full sm:w-64 appearance-none bg-[#0F1E36] text-white font-bold text-sm px-4 py-2.5 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#D97706] cursor-pointer pr-10"
                >
                  {dummyOrgPeriods.map((period) => (
                    <option key={period.id} value={period.id} className="bg-[#0F1E36] text-white">
                      {period.periodLabel}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-300 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Tampilan 4 Jabatan Pengurus */}
        <div className="space-y-8">
          <div className="text-center max-w-md mx-auto">
            <h2 className="text-2xl font-extrabold text-[#0F1E36]">
              Dewan Pengurus — {activePeriod.periodLabel}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Menjalankan amanah Musyawarah Besar (Mubes) dan AD/ART KAPPAMA
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {activePeriod.leaders.map((leader) => (
              <div
                key={leader.id}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center group"
              >
                {/* Avatar Placeholder */}
                <div className="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-slate-200 text-slate-400 flex items-center justify-center mb-5 group-hover:border-[#D97706] group-hover:bg-amber-50 group-hover:text-[#D97706] transition-all overflow-hidden relative shadow-inner">
                  {leader.photoUrl ? (
                    <img src={leader.photoUrl} alt={leader.name} className="w-full h-full object-cover" />
                  ) : (
                    <UserCheck className="w-10 h-10" />
                  )}
                </div>

                {/* Badge Jabatan */}
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#0F1E36] text-amber-300 mb-2">
                  {leader.positionLabel}
                </span>

                <h3 className="font-bold text-base text-[#0F1E36] mb-2 leading-snug">
                  {leader.name}
                </h3>

                <p className="text-xs text-slate-500 flex items-center gap-1.5 justify-center mt-auto pt-3 border-t border-slate-100 w-full">
                  <GraduationCap className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                  <span className="truncate">{leader.campusStudy}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Catatan Transparansi */}
        <div className="p-4 rounded-xl bg-slate-50 text-xs text-slate-500 text-center border border-slate-200/60 max-w-2xl mx-auto">
          [Placeholder - Menunggu Teks & Foto Resmi Pengurus]: Seluruh nama pengurus dan foto akan diperbarui secara resmi setelah pelantikan kepengurusan periode baru.
        </div>
      </div>
    </div>
  );
}
