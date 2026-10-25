import { Link } from 'react-router-dom';
import {
  HeartHandshake,
  BookOpen,
  Users,
  Shield,
  ArrowRight,
  Calendar,
  Sparkles,
  GraduationCap,
} from 'lucide-react';
import { dummyPrograms, dummyAlbums, dummyOrgProfile } from '../../data/dummy-content';
import { BatikOrnament } from '../../components/common/BatikOrnament';

export function HomePage() {
  const featuredPrograms = dummyPrograms.slice(0, 3);
  const latestAlbum = dummyAlbums[0];

  return (
    <div className="flex flex-col w-full">
      {/* 1. Hero Section Layar Penuh */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0F1E36] via-[#162C4E] to-[#0F1E36] text-white pt-20 pb-32 px-4">
        {/* Ornamen Batik Background */}
        <BatikOrnament className="absolute inset-0 text-white/10" opacity={0.06} />

        {/* Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#D97706]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-amber-300 mb-8 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Keluarga Pelajar Pacitan di Malang</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.12] mb-6">
            Rumah Persaudaraan Mahasiswa <span className="text-[#D97706]">Pacitan</span> di Malang
          </h1>

          <p className="text-lg sm:text-xl text-slate-200 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
            {dummyOrgProfile.aboutText}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/daftar"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#D97706] hover:bg-amber-600 text-white font-bold text-base transition-all shadow-xl hover:shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Daftar Anggota Baru</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/program-kerja"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-base backdrop-blur-md border border-white/25 transition-all text-center"
            >
              Jelajahi Program Kerja
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Floating Quick-Card Menimpa Hero */}
      <section className="container mx-auto max-w-5xl px-4 -mt-16 relative z-20">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8 backdrop-blur-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 text-center">
            <Link to="/profil" className="p-3 group hover:bg-slate-50 rounded-xl transition-colors">
              <span className="block text-2xl sm:text-3xl font-extrabold text-[#0F1E36] group-hover:text-[#D97706] transition-colors">
                12
              </span>
              <span className="text-xs font-semibold text-slate-500 mt-1 block">Kecamatan Pacitan</span>
            </Link>
            <Link to="/program-kerja" className="p-3 pt-6 sm:pt-3 group hover:bg-slate-50 rounded-xl transition-colors">
              <span className="block text-2xl sm:text-3xl font-extrabold text-[#0F1E36] group-hover:text-[#D97706] transition-colors">
                10+
              </span>
              <span className="text-xs font-semibold text-slate-500 mt-1 block">Program Kerja Unggulan</span>
            </Link>
            <Link to="/profil/struktur" className="p-3 pt-6 sm:pt-3 group hover:bg-slate-50 rounded-xl transition-colors">
              <span className="block text-2xl sm:text-3xl font-extrabold text-[#0F1E36] group-hover:text-[#D97706] transition-colors">
                13+
              </span>
              <span className="text-xs font-semibold text-slate-500 mt-1 block">Kampus Mitra Malang</span>
            </Link>
            <Link to="/anggota" className="p-3 pt-6 sm:pt-3 group hover:bg-slate-50 rounded-xl transition-colors">
              <span className="block text-2xl sm:text-3xl font-extrabold text-[#0F1E36] group-hover:text-[#D97706] transition-colors">
                100%
              </span>
              <span className="text-xs font-semibold text-slate-500 mt-1 block">Kekeluargaan Guyub</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Empat Pilar Keunggulan KAPPAMA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-extrabold text-[#D97706] uppercase tracking-wider block mb-2">
              Mengapa Bergabung dengan KAPPAMA?
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F1E36] tracking-tight">
              Lebih Dari Sekadar Organisasi Kedaerahan
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed">
              Menjadi wadah bertumbuh, mengasah kepemimpinan, dan menjaga identitas luhur budaya Pacitan di perantauan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-7 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col">
              <div className="w-13 h-13 rounded-2xl bg-amber-50 text-[#D97706] flex items-center justify-center mb-5">
                <HeartHandshake className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-lg text-[#0F1E36] mb-2">Persaudaraan</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Keluarga kedua yang saling menguatkan saat jauh dari kampung halaman di Kota Malang.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col">
              <div className="w-13 h-13 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-5">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-lg text-[#0F1E36] mb-2">Pengembangan Diri</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Pelatihan kepemimpinan, ruang diskusi kritis, dan wadah aktualisasi potensi mahasiswa.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col">
              <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-5">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-lg text-[#0F1E36] mb-2">Jejaring Alumni</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Direktori terstruktur yang menghubungkan mahasiswa aktif dengan alumni berprestasi lintas profesi.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col">
              <div className="w-13 h-13 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mb-5">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-lg text-[#0F1E36] mb-2">Pengabdian Daerah</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Aksi nyata pemikiran dan kontribusi sosial kembali ke masyarakat Kabupaten Pacitan tercinta.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Program Kerja Unggulan */}
      <section className="py-20 px-4 bg-slate-50 border-y border-slate-200/60">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
            <div>
              <span className="text-xs font-extrabold text-[#D97706] uppercase tracking-wider block mb-2">
                Aksi & Kolaborasi
              </span>
              <h2 className="text-3xl font-extrabold text-[#0F1E36] tracking-tight">
                Program Kerja Unggulan
              </h2>
            </div>
            <Link
              to="/program-kerja"
              className="text-sm font-bold text-[#D97706] hover:text-amber-700 flex items-center gap-1.5 transition-colors"
            >
              <span>Lihat Semua Program</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredPrograms.map((proker) => (
              <article
                key={proker.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 flex flex-col group"
              >
                <div className="relative h-48 overflow-hidden bg-slate-200">
                  <img
                    src={proker.coverImage}
                    alt={proker.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-[#0F1E36]/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full">
                    {proker.year}
                  </div>
                  {proker.universityName && (
                    <div className="absolute top-3 right-3 bg-amber-500/95 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-sm">
                      {proker.universityName}
                    </div>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {proker.eventDate}
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-[#0F1E36] group-hover:text-[#D97706] transition-colors line-clamp-2">
                      {proker.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                      {proker.summary}
                    </p>
                  </div>

                  <Link
                    to={`/program-kerja/${proker.slug}`}
                    className="pt-3 border-t border-slate-100 text-xs font-bold text-[#0F1E36] hover:text-[#D97706] flex items-center justify-between"
                  >
                    <span>Detail Program</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Seksi Kilas Dokumentasi Galeri (2 Kolom Editorial) */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-extrabold text-[#D97706] uppercase tracking-wider block mb-2">
                Dokumentasi Kegiatan
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F1E36] tracking-tight leading-tight mb-4">
                Merekam Setiap Jejak Persaudaraan di Malang
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Dari malam keakraban, diskusi kepemudaan, turnamen olahraga, hingga sosialisasi pendidikan ke pelosok Pacitan, seluruh kenangan terekam dalam galeri dokumentasi KAPPAMA.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-[#D97706] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    ✓
                  </div>
                  <p className="text-sm text-slate-700">Dokumentasi foto beresolusi tinggi di setiap program kerja.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-[#D97706] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    ✓
                  </div>
                  <p className="text-sm text-slate-700">Video aftermovie kegiatan yang disematkan langsung via YouTube.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-[#D97706] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    ✓
                  </div>
                  <p className="text-sm text-slate-700">Arsip kenangan terstruktur per tahun kegiatan.</p>
                </div>
              </div>

              <Link
                to="/galeri"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0F1E36] hover:bg-[#162C4E] text-white font-bold text-sm shadow-md transition-all active:scale-95"
              >
                <span>Buka Galeri Dokumentasi</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Cuplikan Album Pilihan */}
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900 group">
                <img
                  src={latestAlbum.coverImage}
                  alt={latestAlbum.title}
                  className="w-full h-80 sm:h-96 object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F1E36] via-[#0F1E36]/30 to-transparent flex flex-col justify-end p-6 sm:p-8">
                  <span className="text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
                    Album Sorotan · {latestAlbum.year}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-snug">
                    {latestAlbum.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 line-clamp-2">
                    {latestAlbum.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Banner CTA Pendaftaran Anggota & Alumni */}
      <section className="py-16 px-4 bg-[#0F1E36] text-white relative overflow-hidden">
        <BatikOrnament className="absolute inset-0 text-white/5" opacity={0.05} />
        <div className="container mx-auto max-w-4xl text-center relative z-10 space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#D97706] text-white flex items-center justify-center mx-auto shadow-lg">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Mahasiswa atau Pelajar Asal Pacitan di Malang?
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Bergabunglah bersama keluarga besar KAPPAMA. Daftarkan diri Anda secara online untuk terhubung dengan sesama mahasiswa dan alumni di Kota Malang.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/daftar"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#D97706] hover:bg-amber-600 text-white font-bold text-base transition-all shadow-xl active:scale-95"
            >
              Daftar Anggota Sekarang
            </Link>
            <Link
              to="/profil/ad-art"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-base backdrop-blur-md border border-white/20 transition-all"
            >
              Baca AD / ART
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
