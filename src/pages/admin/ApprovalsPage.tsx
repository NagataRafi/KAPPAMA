import { useState, useEffect, useCallback } from 'react';
import { useAppAuth } from '../../components/auth/AuthContext';
import { fetchApi } from '../../services/api';
import { Shield, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

interface ApprovalItem {
  id: string;
  full_name: string;
  username: string;
  whatsapp: string;
  email: string;
  cohort_year: number;
  member_type: 'active' | 'alumni';
  submitted_at: string;
  status: string;
  university_name: string;
  study_program_name: string;
  district_name: string;
  village_name: string;
  timeRemainingMs?: number;
}

export function ApprovalsPage() {
  const { token, role } = useAppAuth();

  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchApi<{ data: ApprovalItem[] }>('/admin/approvals', {}, token);
      setApprovals(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat antrean persetujuan';
      console.error(msg);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(true);
      setMessage(null);
      await fetchApi(`/admin/approvals/${id}/approve`, { method: 'POST' }, token);
      setMessage({ text: 'Pendaftar berhasil disetujui menjadi Anggota Aktif.', type: 'success' });
      await fetchApprovals();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyetujui pendaftar';
      setMessage({ text: msg, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) return;
    try {
      setActionLoading(true);
      setMessage(null);
      await fetchApi(
        `/admin/approvals/${id}/reject`,
        {
          method: 'POST',
          body: JSON.stringify({ reason: rejectReason.trim() }),
        },
        token
      );
      setMessage({ text: 'Pendaftar berhasil ditolak.', type: 'success' });
      setRejectingId(null);
      setRejectReason('');
      await fetchApprovals();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menolak pendaftar';
      setMessage({ text: msg, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const isAuthorized = role === 'super_admin' || role === 'content_admin';

  if (!isAuthorized) {
    return (
      <div className="bg-[#FAF8F5] min-h-screen py-16 px-4 text-center">
        <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-3">
          <Shield className="w-12 h-12 text-rose-500 mx-auto" />
          <h1 className="text-lg font-bold text-slate-800">Akses Ditolak</h1>
          <p className="text-xs text-slate-500">Halaman ini hanya dapat diakses oleh Admin Konten dan Super Admin KAPPAMA.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Admin */}
        <div className="bg-[#0F1E36] rounded-3xl p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-wider bg-purple-500/30 text-purple-200 px-3 py-1 rounded-full">
                Panel Pengurus
              </span>
              <span className="text-xs uppercase font-extrabold tracking-wider bg-amber-400/20 text-amber-300 px-3 py-1 rounded-full">
                Auto-Approve 24 Jam Aktif
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Antrean Persetujuan Anggota
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm">
              Tinjau permohonan anggota baru sebelum otomatis aktif saat batas 24 jam tercapai.
            </p>
          </div>

          <button
            onClick={fetchApprovals}
            className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>

        {message && (
          <div
            className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Daftar Antrean */}
        {loading ? (
          <LoadingSkeleton type="card" count={3} />
        ) : approvals.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h2 className="text-lg font-bold text-slate-800">Antrean Bersih</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Tidak ada permohonan pending saat ini. Semua pendaftar telah disetujui atau telah aktif otomatis lewat batas waktu 24 jam.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {approvals.map((item) => {
              const remainingMs = item.timeRemainingMs || 0;
              const hoursLeft = Math.floor(remainingMs / (1000 * 60 * 60));
              const minsLeft = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-base text-[#0F172A]">{item.full_name}</span>
                      <span className="text-xs text-slate-400">@{item.username}</span>
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-[#D97706]">
                        {item.member_type === 'alumni' ? 'Alumni' : 'Mahasiswa'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400">Kampus:</span>{' '}
                        <strong>{item.university_name}</strong> ({item.study_program_name} - '{item.cohort_year})
                      </div>
                      <div>
                        <span className="text-slate-400">Asal Pacitan:</span>{' '}
                        <strong>Kec. {item.district_name}</strong>, Desa {item.village_name}
                      </div>
                      <div>
                        <span className="text-slate-400">Kontak:</span> {item.whatsapp} ({item.email})
                      </div>
                      <div className="flex items-center gap-1.5 text-amber-700 font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Sisa Waktu Auto-Approve: {hoursLeft} jam {minsLeft} mnt</span>
                      </div>
                    </div>
                  </div>

                  {/* Aksi Persetujuan / Penolakan */}
                  <div className="flex items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0">
                    <button
                      onClick={() => handleApprove(item.id)}
                      disabled={actionLoading}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Setujui</span>
                    </button>

                    <button
                      onClick={() => {
                        setRejectingId(item.id);
                        setRejectReason('');
                      }}
                      disabled={actionLoading}
                      className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Tolak</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Alasan Penolakan */}
        {rejectingId && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Alasan Penolakan Pendaftar</h2>
              <p className="text-xs text-slate-500">
                Pendaftar akan melihat alasan ini dan dapat memperbaiki datanya untuk mengajukan ulang.
              </p>

              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="misal: Mohon cantumkan program studi dan asal kecamatan yang sesuai."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingId(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(rejectingId)}
                  disabled={!rejectReason.trim() || actionLoading}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  Kirim Penolakan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
