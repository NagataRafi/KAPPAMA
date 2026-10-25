import { BookOpen, MapPin, Mail, Instagram, ShieldCheck, HeartHandshake } from 'lucide-react';
import { dummyOrgProfile } from '../../data/dummy-content';
import { BatikOrnament } from '../../components/common/BatikOrnament';

export function ProfilPage() {
  return (
    <div className="flex flex-col w-full py-12 px-4">
      <div className="container mx-auto max-w-4xl space-y-12">
        {/* Header Seksi */}
        <div className="relative rounded-3xl bg-[#0F1E36] text-white p-8 sm:p-12 overflow-hidden shadow-lg">
          <BatikOrnament className="absolute inset-0 text-white/5" opacity={0.05} />
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">
              Profil Organisasi
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Tentang KAPPAMA
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Mengenal lebih dekat identitas, sejarah singkat, dan nilai luhur persaudaraan pelajar dan mahasiswa Pacitan di Kota Malang.
            </p>
          </div>
        </div>

        {/* Definisi Resmi & Penjelasan */}
        <section className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 text-[#0F1E36] pb-4 border-b border-slate-100">
            <BookOpen className="w-6 h-6 text-[#D97706]" />
            <h2 className="text-xl font-bold">Definisi Organisasi</h2>
          </div>

          <blockquote className="p-5 rounded-xl bg-amber-50/70 border-l-4 border-[#D97706] text-slate-800 text-base italic leading-relaxed">
            &ldquo;{dummyOrgProfile.aboutText}&rdquo;
          </blockquote>

          <div className="prose prose-slate max-w-none text-sm text-slate-600 leading-relaxed space-y-4">
            <p>
              KAPPAMA didirikan sebagai wadah independen dan kekeluargaan yang menghimpun seluruh pelajar dan mahasiswa asal Kabupaten Pacitan yang sedang menempuh pendidikan di berbagai perguruan tinggi di Kota Malang, baik perguruan tinggi negeri maupun swasta.
            </p>
            <p>
              Di tengah dinamika perantauan, KAPPAMA hadir sebagai &ldquo;rumah kedua&rdquo; yang menjunjung tinggi semangat guyub rukun, saling tolong-menolong, dan menjaga nama baik daerah asal.
            </p>
          </div>
        </section>

        {/* Sejarah Singkat */}
        <section className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 text-[#0F1E36] pb-4 border-b border-slate-100">
            <ShieldCheck className="w-6 h-6 text-[#D97706]" />
            <h2 className="text-xl font-bold">Sejarah Singkat</h2>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 text-xs sm:text-sm text-slate-600 leading-relaxed border border-slate-200/60">
            {dummyOrgProfile.historyText}
          </div>
          <p className="text-xs text-slate-400 italic">
            *Catatan: Narasi kronologis lengkap sejarah pendirian KAPPAMA akan diperbarui secara resmi setelah hasil riset dan verifikasi naskah kepengurusan selesai.
          </p>
        </section>

        {/* Nilai Budaya & Kontak Resmi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-3 text-[#0F1E36]">
              <HeartHandshake className="w-5 h-5 text-[#D97706]" />
              <h3 className="font-bold text-lg">Nilai Budaya Pacitan</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              KAPPAMA senantiasa menanamkan falsafah luhur masyarakat Pacitan: ramah, berintegritas, ulet dalam menuntut ilmu, dan berbakti kepada tanah kelahiran (*Hamemayu Hayuning Bawana*).
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-3 text-[#0F1E36]">
              <MapPin className="w-5 h-5 text-[#D97706]" />
              <h3 className="font-bold text-lg">Sekretariat & Kontak</h3>
            </div>
            <div className="space-y-2 text-xs sm:text-sm text-slate-600">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#D97706] shrink-0" />
                <span>{dummyOrgProfile.contact.address}</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#D97706] shrink-0" />
                <span>{dummyOrgProfile.contact.email}</span>
              </p>
              <p className="flex items-center gap-2">
                <Instagram className="w-4 h-4 text-[#D97706] shrink-0" />
                <span>{dummyOrgProfile.contact.instagram}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
