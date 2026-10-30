import { useCallback, useEffect, useState } from 'react';
import { GraduationCap, ChevronDown, UserCheck, AlertCircle } from 'lucide-react';
import { getPublicLeaders, type PublicLeader, type PublicPeriod } from '../../services/content-api';
import { BatikOrnament } from '../../components/common/BatikOrnament';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

const POSITION_LABELS: Record<PublicLeader['position'], string> = {
  pembina: 'Pembina',
  penasihat: 'Penasihat',
  ketua: 'Ketua Umum',
  wakil_ketua_umum: 'Wakil Ketua Umum',
};

export function StrukturPage() {
  const [periods, setPeriods] = useState<PublicPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [leaders, setLeaders] = useState<PublicLeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (periodId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPublicLeaders(periodId);
      setPeriods(res.data.periods);
      setSelectedPeriodId(res.data.period?.id ?? '');
      setLeaders(res.data.leaders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat struktur organisasi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activePeriod = periods.find((period) => period.id === selectedPeriodId) ?? null;

  if (loading) {
    return (
      <div className="container mx-auto max-w-5xl py-16 px-4">
        <LoadingSkeleton type="profile" count={4} />
      </div>
    );
  }

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
            {periods.length > 0 && (
              <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20">
                <label htmlFor="period-select" className="text-[11px] font-semibold text-amber-300 block px-2 mb-1">
                  Pilih Periode Kepengurusan:
                </label>
                <div className="relative">
                  <select
                    id="period-select"
                    value={selectedPeriodId}
                    onChange={(event) => void load(event.target.value)}
                    className="w-full sm:w-64 appearance-none bg-[#0F1E36] text-white font-bold text-sm px-4 py-2.5 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#D97706] cursor-pointer pr-10"
                  >
                    {periods.map((period) => (
                      <option key={period.id} value={period.id} className="bg-[#0F1E36] text-white">
                        {period.periodLabel}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-300 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}
          </div>
        </div>

        {error ? (
          <div role="alert" className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-800 space-y-3">
            <p className="text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" aria-hidden="true" /> {error}
            </p>
            <button
              onClick={() => void load(selectedPeriodId)}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold"
            >
              Coba Lagi
            </button>
          </div>
        ) : periods.length === 0 || !activePeriod ? (
          <p className="text-center text-sm text-slate-500">
            Data kepengurusan belum tersedia. Pengurus akan memperbarui struktur organisasi setelah pelantikan.
          </p>
        ) : (
          <div className="space-y-8">
            <div className="text-center max-w-md mx-auto">
              <h2 className="text-2xl font-extrabold text-[#0F1E36]">
                Dewan Pengurus — {activePeriod.periodLabel}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Menjalankan amanah Musyawarah Besar (Mubes) dan AD/ART KAPPAMA
              </p>
            </div>

            {leaders.length === 0 ? (
              <p className="text-center text-sm text-slate-500">
                Belum ada data pengurus untuk periode ini.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {leaders.map((leader) => (
                  <div
                    key={leader.id}
                    className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center group"
                  >
                    <div className="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-slate-200 text-slate-400 flex items-center justify-center mb-5 group-hover:border-[#D97706] group-hover:bg-amber-50 group-hover:text-[#D97706] transition-all overflow-hidden relative shadow-inner">
                      {leader.photoUrl ? (
                        <img src={leader.photoUrl} alt={leader.name} className="w-full h-full object-cover" />
                      ) : (
                        <UserCheck className="w-10 h-10" aria-hidden="true" />
                      )}
                    </div>

                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#0F1E36] text-amber-300 mb-2">
                      {POSITION_LABELS[leader.position]}
                    </span>

                    <h3 className="font-bold text-base text-[#0F1E36] mb-2 leading-snug">{leader.name}</h3>

                    {leader.campusStudy && (
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 justify-center mt-auto pt-3 border-t border-slate-100 w-full">
                        <GraduationCap className="w-3.5 h-3.5 text-[#D97706] shrink-0" aria-hidden="true" />
                        <span className="truncate">{leader.campusStudy}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
