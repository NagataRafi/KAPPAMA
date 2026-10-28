import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import { GraduationCap, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';
import { BatikOrnament } from '../../components/common/BatikOrnament';
import { useAppAuth } from '../../components/auth/AuthContext';
import { isClerkConfigured } from '../../config/env';

// Dipisah agar useClerk hanya berjalan saat ClerkProvider terpasang.
function GoogleSignInButton() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const { openSignIn } = useClerk();
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    if (!openSignIn) {
      navigate('/onboarding');
      return;
    }
    setIsSigningIn(true);
    openSignIn({
      afterSignInUrl: '/onboarding',
      afterSignUpUrl: '/onboarding',
    });
  };

  return (
    <button
      onClick={handleGoogleLogin}
      disabled={isSigningIn}
      className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm sm:text-base border-2 border-slate-200 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 mx-auto active:scale-95 disabled:opacity-50"
    >
      {/* Google Icon SVG */}
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        />
      </svg>
      <span>{isSigningIn ? 'Menghubungkan ke Google...' : 'Daftar dengan Akun Google'}</span>
    </button>
  );
}

export function DaftarPage() {
  const { isSignedIn } = useAppAuth();

  // Jika sudah login, langsung arahkan ke onboarding
  if (isSignedIn) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="flex flex-col w-full py-12 px-4">
      <div className="container mx-auto max-w-4xl space-y-12">
        {/* Header Seksi */}
        <div className="relative rounded-3xl bg-[#0F1E36] text-white p-8 sm:p-12 overflow-hidden shadow-lg text-center">
          <BatikOrnament className="absolute inset-0 text-white/5" opacity={0.06} />
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#D97706] text-white flex items-center justify-center mx-auto shadow-md">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Pendaftaran Anggota KAPPAMA
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Bergabunglah bersama keluarga besar pelajar dan mahasiswa asal Pacitan di Kota Malang. Nikmati akses ke direktori jejaring dan program pengembangan potensi.
            </p>
          </div>
        </div>

        {/* Kotak Syarat & Alur Pendaftaran */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Kolom Syarat */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-5">
            <h2 className="text-xl font-bold text-[#0F1E36] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#D97706]" />
              Syarat Keanggotaan
            </h2>

            <ul className="space-y-3.5 text-sm text-slate-700">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Berasal dari salah satu dari <strong>12 Kecamatan</strong> di Kabupaten Pacitan, Jawa Timur.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Sedang menempuh studi aktif atau merupakan lulusan (alumni) perguruan tinggi di <strong>Kota Malang</strong>.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Memiliki akun Google aktif untuk proses autentikasi aman melalui Clerk.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Menyetujui pemrosesan data pribadi untuk kepentingan keorganisasian sesuai UU PDP No. 27/2022.</span>
              </li>
            </ul>
          </div>

          {/* Kolom Alur Pendaftaran */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-5">
            <h2 className="text-xl font-bold text-[#0F1E36] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#D97706]" />
              Alur Pendaftaran (3 Langkah)
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-full bg-[#0F1E36] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-sm">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0F1E36]">Masuk dengan Akun Google</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Autentikasi instan dan aman menggunakan email Google Anda.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-full bg-[#0F1E36] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-sm">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0F1E36]">Lengkapi Formulir Onboarding</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Isi data kampus, prodi, dan wilayah asal (kecamatan/desa di Pacitan).</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-full bg-[#0F1E36] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-sm">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0F1E36]">Tinjauan Admin & Auto-Aktif 24 Jam</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Admin meninjau pendaftaran Anda. Jika tidak ada penolakan, akun otomatis aktif setelah 24 jam.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kartu Tombol Aksi Login Google */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border-2 border-amber-200/60 shadow-lg text-center max-w-xl mx-auto space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-extrabold text-[#0F1E36]">
              Siap Menjadi Bagian dari KAPPAMA?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Pendaftaran gratis tanpa dipungut biaya. Klik tombol di bawah untuk melanjutkan:
            </p>
          </div>

          {isClerkConfigured ? (
            <GoogleSignInButton />
          ) : (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              Konfigurasi login belum lengkap. Hubungi pengurus untuk mengaktifkan pendaftaran
              anggota.
            </p>
          )}

          <p className="text-[11px] text-slate-400">
            Dengan mendaftar, Anda menyetujui <Link to="/kebijakan-privasi" className="underline hover:text-slate-600">Kebijakan Privasi</Link> dan <Link to="/syarat-penggunaan" className="underline hover:text-slate-600">Syarat Penggunaan</Link> KAPPAMA.
          </p>
        </div>
      </div>
    </div>
  );
}
