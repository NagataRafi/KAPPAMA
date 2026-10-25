import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, X, Users, BookOpen, Award, FileText } from 'lucide-react';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profilDropdownOpen, setProfilDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfilDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Tutup menu saat navigasi berpindah
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfilDropdownOpen(false);
  }, [location.pathname]);

  const isProfilActive = location.pathname.startsWith('/profil');

  return (
    <header className="sticky top-0 z-50 bg-[#0F1E36] text-white shadow-md border-b border-slate-800/80">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo & Identitas */}
        <Link to="/" className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-[#D97706] rounded-xl p-1">
          <div className="w-11 h-11 rounded-xl bg-[#D97706] flex items-center justify-center font-extrabold text-white text-xl shadow-md group-hover:scale-105 transition-transform">
            K
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight block text-white group-hover:text-amber-400 transition-colors">
              KAPPAMA
            </span>
            <span className="text-[11px] text-slate-300 font-medium block tracking-normal">
              Keluarga Pelajar Pacitan di Malang
            </span>
          </div>
        </Link>

        {/* Menu Navigasi Desktop */}
        <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-slate-200" aria-label="Navigasi Utama">
          <Link
            to="/"
            className={`px-3.5 py-2 rounded-lg transition-colors ${
              location.pathname === '/' ? 'text-amber-400 font-semibold' : 'hover:text-white hover:bg-white/5'
            }`}
          >
            Beranda
          </Link>

          {/* Dropdown Menu Profil */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfilDropdownOpen(!profilDropdownOpen)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors ${
                isProfilActive ? 'text-amber-400 font-semibold' : 'hover:text-white hover:bg-white/5'
              }`}
              aria-expanded={profilDropdownOpen}
              aria-haspopup="true"
            >
              <span>Profil</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${profilDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {profilDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 rounded-2xl bg-white text-[#0F172A] shadow-xl border border-slate-100 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <Link
                  to="/profil"
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                  <BookOpen className="w-4 h-4 text-[#D97706]" />
                  <div>
                    <span className="block text-slate-900">Tentang KAPPAMA</span>
                    <span className="text-xs text-slate-500 font-normal">Pengertian & sejarah singkat</span>
                  </div>
                </Link>
                <Link
                  to="/profil/visi-misi"
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                  <Award className="w-4 h-4 text-[#D97706]" />
                  <div>
                    <span className="block text-slate-900">Visi & Misi</span>
                    <span className="text-xs text-slate-500 font-normal">Arah perjuangan organisasi</span>
                  </div>
                </Link>
                <Link
                  to="/profil/struktur"
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                  <Users className="w-4 h-4 text-[#D97706]" />
                  <div>
                    <span className="block text-slate-900">Struktur Organisasi</span>
                    <span className="text-xs text-slate-500 font-normal">Pengurus per periode</span>
                  </div>
                </Link>
                <Link
                  to="/profil/ad-art"
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                  <FileText className="w-4 h-4 text-[#D97706]" />
                  <div>
                    <span className="block text-slate-900">AD / ART</span>
                    <span className="text-xs text-slate-500 font-normal">Dokumen resmi & unduhan</span>
                  </div>
                </Link>
              </div>
            )}
          </div>

          <Link
            to="/program-kerja"
            className={`px-3.5 py-2 rounded-lg transition-colors ${
              location.pathname.startsWith('/program-kerja') ? 'text-amber-400 font-semibold' : 'hover:text-white hover:bg-white/5'
            }`}
          >
            Program Kerja
          </Link>

          <Link
            to="/galeri"
            className={`px-3.5 py-2 rounded-lg transition-colors ${
              location.pathname.startsWith('/galeri') ? 'text-amber-400 font-semibold' : 'hover:text-white hover:bg-white/5'
            }`}
          >
            Galeri
          </Link>

          <Link
            to="/anggota"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            title="Khusus anggota berstatus aktif"
          >
            <span>Direktori</span>
            <span className="text-[10px] uppercase font-bold bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded">
              Login
            </span>
          </Link>
        </nav>

        {/* Tombol Aksi Kanan */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            to="/daftar"
            className="px-5 py-2.5 rounded-xl bg-[#D97706] hover:bg-amber-600 text-white font-bold text-sm transition-all shadow-md active:scale-95 flex items-center gap-2"
          >
            <span>Daftar Anggota</span>
          </Link>
        </div>

        {/* Tombol Hamburger Mobile */}
        <div className="flex items-center lg:hidden gap-2">
          <Link
            to="/daftar"
            className="px-3.5 py-2 rounded-lg bg-[#D97706] text-white text-xs font-bold"
          >
            Daftar
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 focus:outline-none"
            aria-label={mobileMenuOpen ? 'Tutup navigasi' : 'Buka navigasi'}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0F1E36] border-t border-slate-800 px-4 pt-3 pb-6 space-y-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <Link
            to="/"
            className="block px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/5 text-slate-200 hover:text-white"
          >
            Beranda
          </Link>

          <div className="py-2 border-y border-slate-800/80 space-y-1">
            <span className="block px-3 text-xs font-bold text-amber-400 uppercase tracking-wider">
              Profil Organisasi
            </span>
            <Link
              to="/profil"
              className="block px-5 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5"
            >
              Tentang KAPPAMA
            </Link>
            <Link
              to="/profil/visi-misi"
              className="block px-5 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5"
            >
              Visi & Misi
            </Link>
            <Link
              to="/profil/struktur"
              className="block px-5 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5"
            >
              Struktur Organisasi
            </Link>
            <Link
              to="/profil/ad-art"
              className="block px-5 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5"
            >
              AD / ART
            </Link>
          </div>

          <Link
            to="/program-kerja"
            className="block px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/5 text-slate-200 hover:text-white"
          >
            Program Kerja
          </Link>

          <Link
            to="/galeri"
            className="block px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/5 text-slate-200 hover:text-white"
          >
            Galeri Dokumentasi
          </Link>

          <Link
            to="/anggota"
            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/5 text-slate-200"
          >
            <span>Direktori Anggota & Alumni</span>
            <span className="text-[10px] uppercase font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded">
              Login
            </span>
          </Link>

          <div className="pt-4 flex flex-col gap-2">
            <Link
              to="/daftar"
              className="w-full py-3 text-center rounded-xl bg-[#D97706] text-white font-bold text-sm shadow-md"
            >
              Daftar Anggota Baru
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
