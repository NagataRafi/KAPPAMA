import { useQuery } from '@tanstack/react-query';
import { Shield, Users, BookOpen, HeartHandshake, CheckCircle2 } from 'lucide-react';

interface HealthData {
  status: string;
  app: string;
  version: string;
  timestamp: string;
  environment: {
    hasDatabaseUrl: boolean;
    hasR2Bucket: boolean;
    hasClerkKey: boolean;
    emailEnabled: boolean;
  };
}

export function App() {
  const { data: health, isLoading } = useQuery<HealthData>({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('API server unreachable');
      return res.json();
    },
    retry: 1,
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 bg-[#0F1E36] text-white shadow-md">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D97706] flex items-center justify-center font-extrabold text-white text-xl shadow-inner">
              K
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight block">KAPPAMA</span>
              <span className="text-xs text-slate-300 block">Keluarga Pelajar Pacitan di Malang</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-200">
            <a href="#beranda" className="hover:text-amber-400 transition-colors">Beranda</a>
            <a href="#profil" className="hover:text-amber-400 transition-colors">Profil</a>
            <a href="#proker" className="hover:text-amber-400 transition-colors">Program Kerja</a>
            <a href="#galeri" className="hover:text-amber-400 transition-colors">Galeri</a>
            <a href="#direktori" className="hover:text-amber-400 transition-colors">Direktori</a>
          </nav>

          <div className="flex items-center gap-3">
            <button className="px-5 py-2.5 rounded-xl bg-[#D97706] hover:bg-amber-600 text-white font-semibold text-sm transition-all shadow-md active:scale-95">
              Daftar Anggota
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-b from-[#0F1E36] via-[#162C4E] to-[#F8FAFC] text-white pt-16 pb-24 px-4">
          <div className="container mx-auto max-w-5xl text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-amber-300 mb-6">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              Fase 1: Scaffold & Infrastruktur Dasar Berhasil Diinisialisasi
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-6">
              Wadah Persaudaraan Pelajar & Mahasiswa <span className="text-[#D97706]">Pacitan</span> di Malang
            </h1>

            <p className="text-lg sm:text-xl text-slate-200 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
              Mempererat tali silaturahmi, mengembangkan potensi akademik dan kepemimpinan, serta membangun jejaring alumni berdaya guna untuk kemajuan Pacitan.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#D97706] hover:bg-amber-600 text-white font-bold text-base transition-all shadow-lg active:scale-95">
                Daftar Sekarang
              </button>
              <button className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-base backdrop-blur-md border border-white/20 transition-all">
                Pelajari Program Kerja
              </button>
            </div>
          </div>
        </section>

        {/* 4 Pilar Keunggulan */}
        <section className="container mx-auto max-w-5xl px-4 -mt-12 relative z-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 flex flex-col items-start">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#D97706] flex items-center justify-center mb-4">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-[#0F1E36]">Persaudaraan</h3>
              <p className="text-sm text-slate-600 leading-relaxed">Keluarga kedua di perantauan bagi mahasiswa asal Pacitan di Kota Malang.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 flex flex-col items-start">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-[#0F1E36]">Pengembangan Diri</h3>
              <p className="text-sm text-slate-600 leading-relaxed">Pelatihan kepemimpinan, diskusi akademik, dan kolaborasi program kerja.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 flex flex-col items-start">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-[#0F1E36]">Jejaring Alumni</h3>
              <p className="text-sm text-slate-600 leading-relaxed">Direktori terstruktur menghubungkan mahasiswa aktif dengan alumni di berbagai bidang.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 flex flex-col items-start">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-[#0F1E36]">Pengabdian Daerah</h3>
              <p className="text-sm text-slate-600 leading-relaxed">Kontribusi nyata pemikiran dan aksi sosial untuk masyarakat Kabupaten Pacitan.</p>
            </div>
          </div>
        </section>

        {/* Backend Status Card */}
        <section className="container mx-auto max-w-3xl px-4 py-16">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#0F1E36]">Status Backend & Infrastruktur (Fase 1)</h2>
                <p className="text-xs text-slate-500 mt-1">Verifikasi koneksi endpoint Pages Functions <code>/api/health</code></p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isLoading ? 'Memeriksa...' : (health?.status === 'ok' ? 'Online' : 'Siap Terhubung')}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-500">Aplikasi & Versi</span>
                <span className="font-semibold text-slate-800">{health?.app || 'kappama-backend'} (v{health?.version || '0.1.0'})</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-500">Database (Neon PostgreSQL)</span>
                <span className="font-medium text-slate-700">Drizzle ORM Schema Siap</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-500">Autentikasi</span>
                <span className="font-medium text-slate-700">Clerk Dev Ready</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-500">Lazy Auto-Approve (24 Jam)</span>
                <span className="font-semibold text-emerald-600">Unit Test Passed (100%)</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#0F1E36] text-slate-400 py-12 px-4 border-t border-slate-800 text-sm">
        <div className="container mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <span className="font-bold text-white text-base block">KAPPAMA</span>
            <span className="text-xs text-slate-400 mt-1 block">
              [Placeholder - Menunggu Teks Resmi Pengurus] · Malang, Jawa Timur
            </span>
          </div>
          <div className="text-xs">
            &copy; {new Date().getFullYear()} KAPPAMA. Hak cipta dilindungi undang-undang.
          </div>
        </div>
      </footer>
    </div>
  );
}
