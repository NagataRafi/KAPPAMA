import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppAuth } from '../../components/auth/AuthContext';
import { getMyStatus } from '../../services/api';
import { Clock, CheckCircle2, XCircle, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';

interface StatusData {
  status: string;
  submittedAt?: string;
  timeRemainingMs?: number;
  rejectionReason?: string;
  approvalType?: string;
  message?: string;
}

export function StatusPage() {
  const { token, refetchProfile } = useAppAuth();
  const navigate = useNavigate();

  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const res = await getMyStatus(token);
      setStatusData(res.data);
    } catch (err) {
      console.error('Gagal memuat status:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchProfile();
    await loadStatus();
  };

  if (loading) {
    return (
      <div className="bg-[#FAF8F5] min-h-screen py-16 px-4 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#0F1E36] border-t-[#D97706] animate-spin" />
      </div>
    );
  }

  const status = statusData?.status || 'incomplete';

  // Format sisa waktu
  const remainingMs = statusData?.timeRemainingMs || 0;
  const hoursLeft = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutesLeft = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {/* State 1: PENDING (Menunggu Persetujuan / Lazy Auto-Approve) */}
        {status === 'pending' && (
          <div className="p-8 sm:p-10 text-center space-y-6">
            <div className="w-20 h-20 bg-amber-100 rounded-3xl mx-auto flex items-center justify-center text-[#D97706]">
              <Clock className="w-10 h-10 animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="text-xs uppercase font-extrabold tracking-wider bg-amber-100 text-[#D97706] px-3 py-1 rounded-full">
                Menunggu Verifikasi Pengurus
              </span>
              <h1 className="text-2xl font-extrabold text-[#0F1E36]">
                Pendaftaran Sedang Ditinjau
              </h1>
              <p className="text-slate-600 text-sm max-w-md mx-auto">
                Terima kasih telah melengkapi formulir onboarding KAPPAMA. Pengurus sedang memverifikasi asal daerah dan status kemahasiswaan Anda.
              </p>
            </div>

            {/* Countdown Box */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-left space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Aturan Otomatis Aktif (Lazy Auto-Approve):</span>
                <span className="text-[#D97706]">Maksimal 24 Jam</span>
              </div>
              <p className="text-xs text-slate-500">
                Sesuai AD/ART KAPPAMA, bila pengurus tidak menolak pendaftaran Anda dalam 24 jam, akun Anda akan otomatis aktif untuk mengakses direktori.
              </p>
              {remainingMs > 0 ? (
                <div className="pt-2 text-sm font-extrabold text-[#0F1E36] flex items-center gap-2">
                  <span>Estimasi sisa waktu:</span>
                  <span className="bg-amber-100/80 text-[#D97706] px-2 py-0.5 rounded-lg">
                    {hoursLeft} jam {minutesLeft} menit
                  </span>
                </div>
              ) : (
                <div className="pt-2 text-xs font-bold text-emerald-600">
                  Waktu 24 jam telah terpenuhi. Klik tombol perbarui di bawah untuk mengaktifkan akun secara instan.
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Perbarui Status</span>
              </button>
              <Link
                to="/"
                className="flex-1 py-3 px-4 rounded-xl bg-[#0F1E36] hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                <span>Kembali ke Beranda</span>
              </Link>
            </div>
          </div>
        )}

        {/* State 2: ACTIVE (Berhasil Aktif) */}
        {status === 'active' && (
          <div className="p-8 sm:p-10 text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-100 rounded-3xl mx-auto flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs uppercase font-extrabold tracking-wider bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                Status Terverifikasi Aktif
              </span>
              <h1 className="text-2xl font-extrabold text-[#0F1E36]">
                Selamat Datang di KAPPAMA!
              </h1>
              <p className="text-slate-600 text-sm max-w-md mx-auto">
                Profil Anda telah aktif {statusData?.approvalType === 'auto' ? 'secara otomatis' : 'oleh pengurus'}. Sekarang Anda dapat mengakses direktori anggota dan alumni.
              </p>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <Link
                to="/anggota"
                className="w-full py-3.5 rounded-xl bg-[#D97706] hover:bg-amber-600 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2"
              >
                <span>Buka Direktori Anggota & Alumni</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/profil-saya"
                className="w-full py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs"
              >
                Kelola Profil Saya
              </Link>
            </div>
          </div>
        )}

        {/* State 3: REJECTED (Ditolak dengan Alasan) */}
        {status === 'rejected' && (
          <div className="p-8 sm:p-10 text-center space-y-6">
            <div className="w-20 h-20 bg-rose-100 rounded-3xl mx-auto flex items-center justify-center text-rose-600">
              <XCircle className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs uppercase font-extrabold tracking-wider bg-rose-100 text-rose-800 px-3 py-1 rounded-full">
                Pendaftaran Ditolak
              </span>
              <h1 className="text-2xl font-extrabold text-[#0F1E36]">
                Perlu Perbaikan Data
              </h1>
              <p className="text-slate-600 text-sm max-w-md mx-auto">
                Pengurus telah meninjau pengajuan Anda dan menemukan informasi yang perlu diperbaiki sebelum dapat disetujui.
              </p>
            </div>

            {/* Alasan Penolakan */}
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-left">
              <span className="block text-xs font-bold text-rose-800 mb-1">
                Alasan Penolakan dari Pengurus:
              </span>
              <p className="text-xs text-rose-700">
                "{statusData?.rejectionReason || 'Data asal daerah atau bukti kemahasiswaan belum sesuai.'}"
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/onboarding')}
                className="w-full py-3.5 rounded-xl bg-[#D97706] hover:bg-amber-600 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2"
              >
                <span>Perbaiki Formulir & Ajukan Ulang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* State 4: SUSPENDED (Ditangguhkan) */}
        {status === 'suspended' && (
          <div className="p-8 sm:p-10 text-center space-y-6">
            <div className="w-20 h-20 bg-amber-100 rounded-3xl mx-auto flex items-center justify-center text-[#D97706]">
              <AlertTriangle className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs uppercase font-extrabold tracking-wider bg-rose-100 text-rose-800 px-3 py-1 rounded-full">
                Akun Ditangguhkan
              </span>
              <h1 className="text-2xl font-extrabold text-[#0F1E36]">
                Akses Direktori Ditangguhkan
              </h1>
              <p className="text-slate-600 text-sm max-w-md mx-auto">
                Status keanggotaan Anda saat ini sedang ditangguhkan oleh pengurus inti. Silakan hubungi sekretariat KAPPAMA untuk klarifikasi lebih lanjut.
              </p>
            </div>

            <div className="pt-2">
              <Link
                to="/profil"
                className="block w-full py-3 rounded-xl bg-[#0F1E36] text-white font-bold text-xs"
              >
                Hubungi Pengurus KAPPAMA
              </Link>
            </div>
          </div>
        )}

        {/* State 5: INCOMPLETE (Belum Onboarding) */}
        {status === 'incomplete' && (
          <div className="p-8 sm:p-10 text-center space-y-6">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl mx-auto flex items-center justify-center text-slate-600">
              <AlertTriangle className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-[#0F1E36]">
                Profil Belum Lengkap
              </h1>
              <p className="text-slate-600 text-sm max-w-md mx-auto">
                Anda telah berhasil masuk dengan akun Google, namun belum melengkapi data keanggotaan.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/onboarding')}
                className="w-full py-3.5 rounded-xl bg-[#D97706] hover:bg-amber-600 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2"
              >
                <span>Mulai Onboarding Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
