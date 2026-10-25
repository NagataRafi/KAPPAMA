import { Link } from 'react-router-dom';
import { Mail, Instagram, MapPin } from 'lucide-react';
import { BatikOrnament } from '../common/BatikOrnament';

export function Footer() {
  return (
    <footer className="relative bg-[#0F1E36] text-slate-400 pt-16 pb-12 border-t border-slate-800 text-sm overflow-hidden">
      {/* Ornamen Batik Background */}
      <BatikOrnament className="absolute inset-0 text-white/5" opacity={0.04} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Kolom 1 & 2: Profil Singkat */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D97706] flex items-center justify-center font-extrabold text-white text-xl">
                K
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">KAPPAMA</span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed max-w-sm">
              Keluarga Pelajar Pacitan di Malang — wadah persaudaraan, pengembangan potensi, dan kontribusi nyata mahasiswa dan pelajar asal Pacitan di perantauan Kota Malang.
            </p>
            <div className="pt-2 flex items-center gap-4 text-slate-300">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 hover:text-amber-400 flex items-center justify-center transition-all"
                aria-label="Instagram KAPPAMA"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="mailto:halo@kappama.org"
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 hover:text-amber-400 flex items-center justify-center transition-all"
                aria-label="Email Resmi KAPPAMA"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Kolom 3: Navigasi Organisasi */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wider uppercase">Profil</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/profil" className="hover:text-amber-400 transition-colors">Tentang Organisasi</Link>
              </li>
              <li>
                <Link to="/profil/visi-misi" className="hover:text-amber-400 transition-colors">Visi & Misi</Link>
              </li>
              <li>
                <Link to="/profil/struktur" className="hover:text-amber-400 transition-colors">Struktur Pengurus</Link>
              </li>
              <li>
                <Link to="/profil/ad-art" className="hover:text-amber-400 transition-colors">AD / ART</Link>
              </li>
            </ul>
          </div>

          {/* Kolom 4: Kegiatan & Jejaring */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wider uppercase">Kegiatan</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/program-kerja" className="hover:text-amber-400 transition-colors">Program Kerja</Link>
              </li>
              <li>
                <Link to="/galeri" className="hover:text-amber-400 transition-colors">Galeri Dokumentasi</Link>
              </li>
              <li>
                <Link to="/anggota" className="hover:text-amber-400 transition-colors">Direktori Anggota</Link>
              </li>
              <li>
                <Link to="/daftar" className="hover:text-amber-400 transition-colors">Pendaftaran Anggota</Link>
              </li>
            </ul>
          </div>

          {/* Kolom 5: Kontak Resmi */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wider uppercase">Kontak Resmi</h4>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                <span>[Placeholder - Alamat Sekretariat: Kota Malang, Jawa Timur]</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#D97706] shrink-0" />
                <span>kappama.malang@gmail.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Baris Bawah: Legalitas, UU PDP, & Hak Cipta */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            &copy; {new Date().getFullYear()} KAPPAMA. Seluruh hak cipta dilindungi.
          </div>
          <div className="flex items-center gap-6">
            <Link to="/kebijakan-privasi" className="hover:text-slate-200 transition-colors">
              Kebijakan Privasi
            </Link>
            <Link to="/syarat-penggunaan" className="hover:text-slate-200 transition-colors">
              Syarat Penggunaan
            </Link>
            <span className="text-slate-600">|</span>
            <span className="text-[11px] text-slate-500">Kepatuhan UU PDP No. 27/2022</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
