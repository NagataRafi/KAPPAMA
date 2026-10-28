import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, X, Users, BookOpen, Award, FileText, User, LogOut, Shield } from 'lucide-react';
import { useAppAuth } from '../auth/AuthContext';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profilDropdownOpen, setProfilDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const { isSignedIn, user, profile, status, role, signOut } = useAppAuth();

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfilDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Tutup menu saat navigasi berpindah
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfilDropdownOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  const isProfilActive = location.pathname.startsWith('/profil');
  const isAdmin = role === 'super_admin' || role === 'content_admin';

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
                    <span className="block text-slate-900 font-semibold">Tentang KAPPAMA</span>
                    <span className="text-xs text-slate-500 font-normal">Pengertian & sejarah singkat</span>
                  </div>
                </Link>
                <Link
                  to="/profil/visi-misi"
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                  <Award className="w-4 h-4 text-[#D97706]" />
                  <div>
                    <span className="block text-slate-900 font-semibold">Visi & Misi</span>
                    <span className="text-xs text-slate-500 font-normal">Arah perjuangan organisasi</span>
                  </div>
                </Link>
                <Link
                  to="/profil/struktur"
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                  <Users className="w-4 h-4 text-[#D97706]" />
                  <div>
                    <span className="block text-slate-900 font-semibold">Struktur Organisasi</span>
                    <span className="text-xs text-slate-500 font-normal">Pengurus per periode</span>
                  </div>
                </Link>
                <Link
                  to="/profil/ad-art"
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                  <FileText className="w-4 h-4 text-[#D97706]" />
                  <div>
                    <span className="block text-slate-900 font-semibold">AD / ART</span>
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
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors ${
              location.pathname.startsWith('/anggota') ? 'text-amber-400 font-semibold' : 'hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Direktori</span>
            {status === 'active' ? (
              <span className="text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                Aktif
              </span>
            ) : (
              <span className="text-[10px] uppercase font-bold bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded">
                Anggota
              </span>
            )}
          </Link>
        </nav>

        {/* Tombol Aksi Kanan (Desktop) */}
        <div className="hidden lg:flex items-center gap-3">
          {isSignedIn ? (
            <div className="relative" ref={userDropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-white/10 transition-colors focus:outline-none"
              >
                <div className="w-8 h-8 rounded-lg bg-[#D97706] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left">
                  <span className="block text-xs font-bold text-white line-clamp-1 max-w-[120px]">
                    {profile?.fullName || user?.fullName || 'Anggota'}
                  </span>
                  <span className="block text-[10px] text-amber-400 uppercase font-semibold">
                    {status || 'Login'}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-300 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white text-[#0F172A] shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <span className="block text-xs text-slate-500">Masuk sebagai</span>
                    <span className="block text-xs font-bold text-slate-900 truncate">
                      {user?.primaryEmailAddress?.emailAddress || user?.email}
                    </span>
                  </div>

                  {status === 'active' && (
                    <>
                      <Link
                        to="/anggota"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Users className="w-4 h-4 text-[#D97706]" />
                        <span>Direktori Anggota</span>
                      </Link>
                      <Link
                        to="/profil-saya"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <User className="w-4 h-4 text-[#D97706]" />
                        <span>Profil Saya</span>
                      </Link>
                    </>
                  )}

                  {status !== 'active' && (
                    <Link
                      to="/status"
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                    >
                      <User className="w-4 h-4 text-amber-600" />
                      <span>Status Pendaftaran</span>
                    </Link>
                  )}

                  {isAdmin && (
                    <Link
                      to="/admin/persetujuan"
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50"
                    >
                      <Shield className="w-4 h-4 text-purple-600" />
                      <span>Panel Pengurus</span>
                    </Link>
                  )}

                  <div className="pt-1 mt-1 border-t border-slate-100">
                    <button
                      onClick={() => signOut()}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Keluar (Sign Out)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/daftar"
              className="px-5 py-2.5 rounded-xl bg-[#D97706] hover:bg-amber-600 text-white font-bold text-sm transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              <span>Daftar / Masuk</span>
            </Link>
          )}
        </div>

        {/* Tombol Hamburger Mobile */}
        <div className="flex items-center lg:hidden gap-2">
          {!isSignedIn && (
            <Link
              to="/daftar"
              className="px-3.5 py-2 rounded-lg bg-[#D97706] text-white text-xs font-bold"
            >
              Daftar
            </Link>
          )}
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
              {status === 'active' ? 'Aktif' : 'Login'}
            </span>
          </Link>

          {isSignedIn ? (
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <Link
                to="/profil-saya"
                className="block w-full py-2.5 text-center rounded-xl bg-slate-800 text-white font-bold text-xs"
              >
                Profil Saya
              </Link>
              <button
                onClick={() => signOut()}
                className="block w-full py-2.5 text-center rounded-xl bg-rose-900/40 text-rose-300 font-bold text-xs"
              >
                Keluar (Sign Out)
              </button>
            </div>
          ) : (
            <div className="pt-4">
              <Link
                to="/daftar"
                className="block w-full py-3 text-center rounded-xl bg-[#D97706] text-white font-bold text-sm shadow-md"
              >
                Daftar / Masuk Anggota
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
