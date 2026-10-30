import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Star, Trash2, UserPlus } from 'lucide-react';
import { useAppAuth } from '../../components/auth/AuthContext';
import {
  activatePeriod,
  createLeader,
  createPeriod,
  deleteLeader,
  deletePeriod,
  getAdminLeaders,
  getAdminPeriods,
  updateLeader,
  updatePeriod,
  type AdminLeader,
  type AdminPeriod,
} from '../../services/content-api';
import { ConfirmDialog, Field, FormMessage, inputClass } from '../../components/admin/AdminForm';
import { ImageField } from '../../components/admin/ImageField';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

const POSITIONS: Array<{ value: AdminLeader['position']; label: string }> = [
  { value: 'pembina', label: 'Pembina' },
  { value: 'penasihat', label: 'Penasihat' },
  { value: 'ketua', label: 'Ketua Umum' },
  { value: 'wakil_ketua_umum', label: 'Wakil Ketua Umum' },
];

const positionLabel = (value: string) => POSITIONS.find((p) => p.value === value)?.label ?? value;

interface PeriodForm {
  id: string | null;
  periodLabel: string;
  startYear: string;
  endYear: string;
  isCurrent: boolean;
}

interface LeaderForm {
  id: string | null;
  position: AdminLeader['position'];
  name: string;
  campusStudy: string;
  photoKey: string | null;
  photoUrl: string | null;
  sortOrder: string;
}

const emptyPeriod = (): PeriodForm => ({
  id: null,
  periodLabel: '',
  startYear: String(new Date().getFullYear()),
  endYear: String(new Date().getFullYear() + 1),
  isCurrent: false,
});

const emptyLeader = (): LeaderForm => ({
  id: null,
  position: 'ketua',
  name: '',
  campusStudy: '',
  photoKey: null,
  photoUrl: null,
  sortOrder: '3',
});

export function StrukturAdminPage() {
  const { token } = useAppAuth();
  const [periods, setPeriods] = useState<AdminPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [leaders, setLeaders] = useState<AdminLeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLeaders, setLoadingLeaders] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [periodForm, setPeriodForm] = useState<PeriodForm>(emptyPeriod());
  const [leaderForm, setLeaderForm] = useState<LeaderForm>(emptyLeader());
  const [confirm, setConfirm] = useState<{ kind: 'period' | 'leader'; id: string } | null>(null);

  const loadPeriods = useCallback(async () => {
    try {
      const res = await getAdminPeriods(token);
      setPeriods(res.data);
      setSelectedPeriod((current) => current || res.data.find((p) => p.isCurrent)?.id || res.data[0]?.id || '');
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Gagal memuat periode.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadLeaders = useCallback(
    async (periodId: string) => {
      if (!periodId) {
        setLeaders([]);
        return;
      }
      setLoadingLeaders(true);
      try {
        const res = await getAdminLeaders(periodId, token);
        setLeaders(res.data);
      } catch (err) {
        setMessage({ text: err instanceof Error ? err.message : 'Gagal memuat pengurus.', type: 'error' });
      } finally {
        setLoadingLeaders(false);
      }
    },
    [token]
  );

  useEffect(() => {
    void loadPeriods();
  }, [loadPeriods]);

  useEffect(() => {
    void loadLeaders(selectedPeriod);
  }, [selectedPeriod, loadLeaders]);

  const savePeriod = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const payload = {
      periodLabel: periodForm.periodLabel,
      startYear: Number(periodForm.startYear),
      endYear: Number(periodForm.endYear),
      isCurrent: periodForm.isCurrent,
    };
    try {
      if (periodForm.id) {
        await updatePeriod(periodForm.id, payload, token);
      } else {
        await createPeriod(payload, token);
      }
      setPeriodForm(emptyPeriod());
      await loadPeriods();
      setMessage({ text: 'Periode berhasil disimpan.', type: 'success' });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Gagal menyimpan periode.', type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const saveLeader = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedPeriod) return;
    setBusy(true);
    setMessage(null);
    const payload = {
      periodId: selectedPeriod,
      position: leaderForm.position,
      name: leaderForm.name,
      campusStudy: leaderForm.campusStudy,
      photoKey: leaderForm.photoKey,
      sortOrder: Number(leaderForm.sortOrder) || 1,
    };
    try {
      if (leaderForm.id) {
        await updateLeader(leaderForm.id, payload, token);
      } else {
        await createLeader(payload, token);
      }
      setLeaderForm(emptyLeader());
      await loadLeaders(selectedPeriod);
      await loadPeriods();
      setMessage({ text: 'Data pengurus berhasil disimpan.', type: 'success' });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Gagal menyimpan pengurus.', type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const runDelete = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.kind === 'period') {
        await deletePeriod(confirm.id, token);
        if (selectedPeriod === confirm.id) setSelectedPeriod('');
        await loadPeriods();
      } else {
        await deleteLeader(confirm.id, token);
        await loadLeaders(selectedPeriod);
        await loadPeriods();
      }
      setMessage({ text: 'Data berhasil dihapus.', type: 'success' });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Gagal menghapus data.', type: 'error' });
    } finally {
      setConfirm(null);
      setBusy(false);
    }
  };

  if (loading) return <LoadingSkeleton type="text" count={2} />;

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-extrabold text-[#0F1E36]">Struktur Organisasi per Periode</h1>
        <p className="text-xs text-slate-600">
          Empat jabatan inti: Pembina, Penasihat, Ketua Umum, dan Wakil Ketua Umum. Satu periode ditandai aktif sebagai
          tampilan bawaan halaman publik.
        </p>
      </header>

      <FormMessage message={message} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Periode */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h2 className="font-bold text-sm text-[#0F1E36]">Daftar Periode</h2>
          {periods.length === 0 ? (
            <p className="text-xs text-slate-500">Belum ada periode. Tambahkan periode pertama.</p>
          ) : (
            <ul className="space-y-2">
              {periods.map((period) => (
                <li
                  key={period.id}
                  className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 ${
                    selectedPeriod === period.id ? 'border-[#D97706] bg-amber-50/40' : 'border-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedPeriod(period.id)}
                    className="text-left"
                  >
                    <span className="block text-sm font-bold text-[#0F1E36]">{period.periodLabel}</span>
                    <span className="text-[11px] text-slate-500">
                      {period.startYear}–{period.endYear} · {period.leaderCount} pengurus
                      {period.isCurrent ? ' · Aktif' : ''}
                    </span>
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await activatePeriod(period.id, token);
                          await loadPeriods();
                          setMessage({ text: 'Periode aktif diperbarui.', type: 'success' });
                        } catch (err) {
                          setMessage({
                            text: err instanceof Error ? err.message : 'Gagal mengaktifkan periode.',
                            type: 'error',
                          });
                        }
                      }}
                      aria-label={`Tetapkan ${period.periodLabel} sebagai periode aktif`}
                      className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 border border-amber-100"
                    >
                      <Star className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPeriodForm({
                          id: period.id,
                          periodLabel: period.periodLabel,
                          startYear: String(period.startYear),
                          endYear: String(period.endYear),
                          isCurrent: period.isCurrent,
                        })
                      }
                      aria-label={`Ubah periode ${period.periodLabel}`}
                      className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-50 border border-slate-200"
                    >
                      <Pencil className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirm({ kind: 'period', id: period.id })}
                      aria-label={`Hapus periode ${period.periodLabel}`}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-100"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={savePeriod} className="pt-3 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-slate-700">
              {periodForm.id ? 'Ubah Periode' : 'Tambah Periode'}
            </h3>
            <Field label="Label periode" htmlFor="period-label">
              <input
                id="period-label"
                required
                value={periodForm.periodLabel}
                onChange={(event) => setPeriodForm({ ...periodForm, periodLabel: event.target.value })}
                placeholder="2026/2027"
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tahun mulai" htmlFor="start-year">
                <input
                  id="start-year"
                  type="number"
                  min={2000}
                  max={2100}
                  required
                  value={periodForm.startYear}
                  onChange={(event) => setPeriodForm({ ...periodForm, startYear: event.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Tahun akhir" htmlFor="end-year">
                <input
                  id="end-year"
                  type="number"
                  min={2000}
                  max={2100}
                  required
                  value={periodForm.endYear}
                  onChange={(event) => setPeriodForm({ ...periodForm, endYear: event.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={periodForm.isCurrent}
                onChange={(event) => setPeriodForm({ ...periodForm, isCurrent: event.target.checked })}
                className="w-4 h-4 rounded border-slate-300"
              />
              Jadikan periode aktif
            </label>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F1E36] text-white text-xs font-bold disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Simpan Periode
              </button>
              {periodForm.id && (
                <button
                  type="button"
                  onClick={() => setPeriodForm(emptyPeriod())}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Pengurus */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h2 className="font-bold text-sm text-[#0F1E36]">Pengurus Periode Terpilih</h2>
          {!selectedPeriod ? (
            <p className="text-xs text-slate-500">Pilih atau buat periode terlebih dahulu.</p>
          ) : loadingLeaders ? (
            <LoadingSkeleton type="text" count={1} />
          ) : leaders.length === 0 ? (
            <p className="text-xs text-slate-500">Belum ada pengurus pada periode ini.</p>
          ) : (
            <ul className="space-y-2">
              {leaders.map((leader) => (
                <li key={leader.id} className="p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                    {leader.photoUrl ? (
                      <img src={leader.photoUrl} alt={leader.name} className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-sm font-bold text-[#0F1E36] truncate">{leader.name}</span>
                    <span className="text-[11px] text-slate-500">
                      {positionLabel(leader.position)} · urutan {leader.sortOrder}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setLeaderForm({
                        id: leader.id,
                        position: leader.position,
                        name: leader.name,
                        campusStudy: leader.campusStudy ?? '',
                        photoKey: leader.photoKey,
                        photoUrl: leader.photoUrl,
                        sortOrder: String(leader.sortOrder),
                      })
                    }
                    aria-label={`Ubah ${leader.name}`}
                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-50 border border-slate-200"
                  >
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirm({ kind: 'leader', id: leader.id })}
                    aria-label={`Hapus ${leader.name}`}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-100"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {selectedPeriod && (
            <form onSubmit={saveLeader} className="pt-3 border-t border-slate-100 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                {leaderForm.id ? 'Ubah Pengurus' : 'Tambah Pengurus'}
              </h3>
              <Field label="Jabatan" htmlFor="leader-position">
                <select
                  id="leader-position"
                  value={leaderForm.position}
                  onChange={(event) =>
                    setLeaderForm({ ...leaderForm, position: event.target.value as AdminLeader['position'] })
                  }
                  className={inputClass}
                >
                  {POSITIONS.map((position) => (
                    <option key={position.value} value={position.value}>
                      {position.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Nama lengkap" htmlFor="leader-name">
                <input
                  id="leader-name"
                  required
                  value={leaderForm.name}
                  onChange={(event) => setLeaderForm({ ...leaderForm, name: event.target.value })}
                  className={inputClass}
                  placeholder="[Placeholder - Nama Pengurus]"
                />
              </Field>
              <Field label="Kampus / program studi (opsional)" htmlFor="leader-campus">
                <input
                  id="leader-campus"
                  value={leaderForm.campusStudy}
                  onChange={(event) => setLeaderForm({ ...leaderForm, campusStudy: event.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Urutan tampil" htmlFor="leader-order">
                <input
                  id="leader-order"
                  type="number"
                  min={1}
                  max={99}
                  value={leaderForm.sortOrder}
                  onChange={(event) => setLeaderForm({ ...leaderForm, sortOrder: event.target.value })}
                  className={inputClass}
                />
              </Field>
              <ImageField
                label="Foto pengurus"
                kind="leader"
                value={leaderForm.photoKey}
                previewUrl={leaderForm.photoUrl}
                onChange={(key) => setLeaderForm({ ...leaderForm, photoKey: key })}
                hint="JPG/PNG/WebP maks 5 MB. Foto opsional."
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2 rounded-xl bg-[#D97706] text-white text-xs font-bold disabled:opacity-50"
                >
                  {busy ? 'Menyimpan...' : 'Simpan Pengurus'}
                </button>
                {leaderForm.id && (
                  <button
                    type="button"
                    onClick={() => setLeaderForm(emptyLeader())}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.kind === 'period' ? 'Hapus periode ini?' : 'Hapus pengurus ini?'}
        description={
          confirm?.kind === 'period'
            ? 'Seluruh data pengurus pada periode ini dan fotonya ikut dihapus. Tindakan ini tidak dapat dibatalkan.'
            : 'Data pengurus dan fotonya akan dihapus. Tindakan ini tidak dapat dibatalkan.'
        }
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={runDelete}
      />
    </div>
  );
}
